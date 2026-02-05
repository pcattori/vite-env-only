import path from "node:path"

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
  "lib/main.js": dedent`
    import * as denyMe from "./deny-me"

    export default { denyMe }
  `,
  "lib/deny-me.js": dedent`
    export default "deny me"
  `,
}

const config = ({
  root,
  ssr,
  options,
}: {
  root: string
  ssr: boolean
  options: Parameters<typeof denyImports>[0]
}): vite.InlineConfig => ({
  root,
  logLevel: "silent",
  build: {
    ssr,
    minify: false,
    lib: {
      entry: "lib/main.js",
      formats: ["es"],
    },
    rollupOptions: {
      output: {
        dir: ssr
          ? path.join(root, "dist/server")
          : path.join(root, "dist/client"),
        entryFileNames: "index.js",
      },
    },
  },
  plugins: [denyImports(options)],
})

describe("denyImports", () => {
  let envs: Array<Env> = ["server", "client"]
  for (let env of envs) {
    let ssr = env === "server"
    let otherEnv = env === "server" ? "client" : "server"

    test(`specifiers / denied by exact match [${env}]`, async ({ files }) => {
      const root = await files(FILES)
      await expect(
        vite.build(
          config({
            root,
            ssr,
            options: {
              [env]: { specifiers: ["./deny-me"] },
            },
          }),
        ),
      ).rejects.toThrowError(
        new DenyImportsSpecifierError({
          pattern: "./deny-me",
          importer: "lib/main.js",
          import: "./deny-me",
          env,
        }),
      )
    })

    test(`specifiers / denied by regex [${env}]`, async ({ files }) => {
      const root = await files(FILES)
      await expect(
        vite.build(
          config({
            root,
            ssr,
            options: {
              [env]: { specifiers: [/^\.\/deny-me$/] },
            },
          }),
        ),
      ).rejects.toThrowError(
        new DenyImportsSpecifierError({
          pattern: /^\.\/deny-me$/,
          importer: "lib/main.js",
          import: "./deny-me",
          env,
        }),
      )
    })

    test(`specifiers / ignores other envs [${env}]`, async ({ files }) => {
      const root = await files(FILES)
      await vite.build(
        config({
          root,
          ssr,
          options: {
            [otherEnv]: { specifiers: [/^\.\/deny-me\.js$/] },
          },
        }),
      )
    })

    test(`specifiers / passes [${env}]`, async ({ files }) => {
      const root = await files(FILES)
      await vite.build(
        config({
          root,
          ssr,
          options: {
            [env]: { specifiers: ["other", "**/other/*", /other/] },
          },
        }),
      )
    })

    test(`files / denied by exact match [${env}]`, async ({ files }) => {
      const root = await files(FILES)
      await expect(
        vite.build(
          config({
            root,
            ssr,
            options: {
              [env]: { files: ["lib/deny-me.js"] },
            },
          }),
        ),
      ).rejects.toThrowError(
        new DenyImportsFileError({
          pattern: "lib/deny-me.js",
          importer: "lib/main.js",
          import: "./deny-me",
          resolved: "lib/deny-me.js",
          env,
        }),
      )
    })

    test(`files / denied by glob [${env}]`, async ({ files }) => {
      const root = await files(FILES)
      await expect(
        vite.build(
          config({
            root,
            ssr,
            options: {
              [env]: { files: ["**/deny-me.*"] },
            },
          }),
        ),
      ).rejects.toThrowError(
        new DenyImportsFileError({
          pattern: "**/deny-me.*",
          importer: "lib/main.js",
          import: "./deny-me",
          resolved: "lib/deny-me.js",
          env,
        }),
      )
    })

    test(`files / denied by regex [${env}]`, async ({ files }) => {
      const root = await files(FILES)
      await expect(
        vite.build(
          config({
            root,
            ssr,
            options: {
              [env]: { files: [/^lib\/deny-me\.js$/] },
            },
          }),
        ),
      ).rejects.toThrowError(
        new DenyImportsFileError({
          pattern: /^lib\/deny-me\.js$/,
          importer: "lib/main.js",
          import: "./deny-me",
          resolved: "lib/deny-me.js",
          env,
        }),
      )
    })

    test(`files / passes [${env}]`, async ({ files }) => {
      const root = await files(FILES)
      await vite.build(
        config({
          root,
          ssr,
          options: {
            [env]: { files: ["other", "**/other/*", /other/] },
          },
        }),
      )
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
