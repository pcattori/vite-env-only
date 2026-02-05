import path from "node:path"

import * as vite from "vite"
import { describe, expect, test } from "vitest"

import denyImports, {
  DenyImportsFileError,
  DenyImportsSpecifierError,
} from "../../src/deny-imports"
import { Env } from "../../src/env"

const root = __dirname

const config = ({
  ssr,
  options,
}: {
  ssr: boolean
  options: Parameters<typeof denyImports>[0]
}): vite.InlineConfig => ({
  root: __dirname,
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

    test(`specifiers / denied by exact match [${env}]`, async () => {
      await expect(
        vite.build(
          config({
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

    test(`specifiers / denied by regex [${env}]`, async () => {
      await expect(
        vite.build(
          config({
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

    test(`specifiers / ignores other envs [${env}]`, async () => {
      await vite.build(
        config({
          ssr,
          options: {
            [otherEnv]: { specifiers: [/^\.\/deny-me\.js$/] },
          },
        }),
      )
    })

    test(`specifiers / passes [${env}]`, async () => {
      await vite.build(
        config({
          ssr,
          options: {
            [env]: { specifiers: ["other", "**/other/*", /other/] },
          },
        }),
      )
    })

    test(`files / denied by exact match [${env}]`, async () => {
      await expect(
        vite.build(
          config({
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

    test(`files / denied by glob [${env}]`, async () => {
      await expect(
        vite.build(
          config({
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

    test(`files / denied by regex [${env}]`, async () => {
      await expect(
        vite.build(
          config({
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

    test(`files / passes [${env}]`, async () => {
      await vite.build(
        config({
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
