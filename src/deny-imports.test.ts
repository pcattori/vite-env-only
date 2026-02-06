import dedent from "dedent"
import * as vite from "vite"
import { describe, expect } from "vitest"
import { test } from "../test/fixtures"
import denyImports, {
  DenyImportsFileError,
  DenyImportsSpecifierError,
} from "./deny-imports"
import { Env } from "./env"

const FILES = {
  "lib/index.ts": dedent`
    import * as denyMe from "./deny-me"

    export default { denyMe }
  `,
  "lib/deny-me.ts": dedent`
    export default "deny me"
  `,
}

describe("denyImports", () => {
  let envs: Array<Env> = ["server", "client"]
  for (let env of envs) {
    let otherEnv: Env = env === "server" ? "client" : "server"

    test(`specifiers / denied by exact match [${env}]`, async ({
      files,
      viteConfig,
    }) => {
      await files(FILES)

      const config = viteConfig({
        env,
        entry: "lib/index.ts",
        outputFile: "dist/index.js",
        plugins: [denyImports({ [env]: { specifiers: ["./deny-me"] } })],
      })

      await expect(vite.build(config)).rejects.toThrowError(
        new DenyImportsSpecifierError({
          pattern: "./deny-me",
          importer: "lib/index.ts",
          import: "./deny-me",
          env,
        }),
      )
    })

    test(`specifiers / denied by regex [${env}]`, async ({
      files,
      viteConfig,
    }) => {
      await files(FILES)

      const config = viteConfig({
        env,
        entry: "lib/index.ts",
        outputFile: "dist/index.js",
        plugins: [denyImports({ [env]: { specifiers: [/^\.\/deny-me$/] } })],
      })

      await expect(vite.build(config)).rejects.toThrowError(
        new DenyImportsSpecifierError({
          pattern: /^\.\/deny-me$/,
          importer: "lib/index.ts",
          import: "./deny-me",
          env,
        }),
      )
    })

    test(`specifiers / ignores other envs [${env}]`, async ({
      files,
      viteConfig,
    }) => {
      await files(FILES)

      const config = viteConfig({
        env,
        entry: "lib/index.ts",
        outputFile: "dist/index.js",
        plugins: [
          denyImports({ [otherEnv]: { specifiers: [/^\.\/deny-me$/] } }),
        ],
      })

      await vite.build(config)
    })

    test(`specifiers / passes [${env}]`, async ({ files, viteConfig }) => {
      await files(FILES)

      const config = viteConfig({
        env,
        entry: "lib/index.ts",
        outputFile: "dist/index.js",
        plugins: [
          denyImports({
            [env]: { specifiers: ["other", "**/other/*", /other/] },
          }),
        ],
      })
      await vite.build(config)
    })

    test(`files / denied by exact match [${env}]`, async ({
      files,
      viteConfig,
    }) => {
      await files(FILES)

      const config = viteConfig({
        env,
        entry: "lib/index.ts",
        outputFile: "dist/index.js",
        plugins: [denyImports({ [env]: { files: ["lib/deny-me.ts"] } })],
      })
      await expect(vite.build(config)).rejects.toThrowError(
        new DenyImportsFileError({
          pattern: "lib/deny-me.ts",
          importer: "lib/index.ts",
          import: "./deny-me",
          resolved: "lib/deny-me.ts",
          env,
        }),
      )
    })

    test(`files / denied by glob [${env}]`, async ({ files, viteConfig }) => {
      await files(FILES)
      const config = viteConfig({
        env,
        entry: "lib/index.ts",
        outputFile: "dist/index.js",
        plugins: [denyImports({ [env]: { files: ["**/deny-me.*"] } })],
      })
      await expect(vite.build(config)).rejects.toThrowError(
        new DenyImportsFileError({
          pattern: "**/deny-me.*",
          importer: "lib/index.ts",
          import: "./deny-me",
          resolved: "lib/deny-me.ts",
          env,
        }),
      )
    })

    test(`files / denied by regex [${env}]`, async ({ files, viteConfig }) => {
      await files(FILES)
      const config = viteConfig({
        env,
        entry: "lib/index.ts",
        outputFile: "dist/index.js",
        plugins: [denyImports({ [env]: { files: [/^lib\/deny-me\.ts$/] } })],
      })
      await expect(vite.build(config)).rejects.toThrowError(
        new DenyImportsFileError({
          pattern: /^lib\/deny-me\.ts$/,
          importer: "lib/index.ts",
          import: "./deny-me",
          resolved: "lib/deny-me.ts",
          env,
        }),
      )
    })

    test(`files / passes [${env}]`, async ({ files, viteConfig }) => {
      await files(FILES)
      const config = viteConfig({
        env,
        entry: "lib/index.ts",
        outputFile: "dist/index.js",
        plugins: [
          denyImports({ [env]: { files: ["other", "**/other/*", /other/] } }),
        ],
      })
      await vite.build(config)
    })
  }

  describe("DenyImportsSpecifierError", () => {
    test("message formatting (pattern string)", () => {
      const error = new DenyImportsSpecifierError({
        pattern: "./test",
        importer: "src/main.js",
        import: "./test",
        env: "server",
      })
      expect(error.message).toMatchInlineSnapshot(`
        "[vite-env-only] Import denied
         - Denied by specifier pattern: ./test
         - Importer: src/main.js
         - Import: "./test"
         - Environment: server"
      `)
    })

    test("message formatting (pattern regex)", () => {
      const error = new DenyImportsSpecifierError({
        pattern: /^\.\/test$/,
        importer: "src/main.js",
        import: "./test",
        env: "client",
      })
      expect(error.message).toMatchInlineSnapshot(`
        "[vite-env-only] Import denied
         - Denied by specifier pattern: /^\\.\\/test$/
         - Importer: src/main.js
         - Import: "./test"
         - Environment: client"
      `)
    })
  })

  describe("DenyImportsFileError", () => {
    test("message formatting (pattern string)", () => {
      const error = new DenyImportsFileError({
        pattern: "lib/test.js",
        importer: "src/main.js",
        import: "./test",
        resolved: "lib/test.js",
        env: "server",
      })
      expect(error.message).toMatchInlineSnapshot(`
        "[vite-env-only] Import denied
         - Denied by file pattern: lib/test.js
         - Importer: src/main.js
         - Import: "./test"
         - Resolved: lib/test.js
         - Environment: server"
      `)
    })

    test("message formatting (pattern regex)", () => {
      const error = new DenyImportsFileError({
        pattern: /^lib\/test\.js$/,
        importer: "src/main.js",
        import: "./test",
        resolved: "lib/test.js",
        env: "client",
      })
      expect(error.message).toMatchInlineSnapshot(`
        "[vite-env-only] Import denied
         - Denied by file pattern: /^lib\\/test\\.js$/
         - Importer: src/main.js
         - Import: "./test"
         - Resolved: lib/test.js
         - Environment: client"
      `)
    })

    test("message formatting (importer undefined)", () => {
      const error = new DenyImportsFileError({
        pattern: "lib/test.js",
        importer: undefined,
        import: "./test",
        resolved: "lib/test.js",
        env: "client",
      })
      expect(error.message).toMatchInlineSnapshot(`
        "[vite-env-only] Import denied
         - Denied by file pattern: lib/test.js
         - Import: "./test"
         - Resolved: lib/test.js
         - Environment: client"
      `)
    })
  })
})
