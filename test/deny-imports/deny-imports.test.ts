import path from "node:path"

import * as vite from "vite"
import { describe, expect, test } from "vitest"

import denyImports from "../../src/deny-imports"

const root = __dirname

const config = ({
  ssr,
  options,
}: {
  ssr: boolean
  options: Parameters<typeof denyImports>[0]
}): vite.InlineConfig => ({
  root: __dirname,
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
  for (let env of ["server", "client"]) {
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
          })
        )
      ).rejects.toMatchSnapshot()
    })

    test(`specifiers / denied by regex [${env}]`, async () => {
      await expect(
        vite.build(
          config({
            ssr,
            options: {
              [env]: { specifiers: [/^\.\/deny-me$/] },
            },
          })
        )
      ).rejects.toMatchSnapshot()
    })

    test(`specifiers / ignores other envs [${env}]`, async () => {
      vite.build(
        config({
          ssr,
          options: {
            [otherEnv]: { specifiers: [/^\.\/deny-me\.js$/] },
          },
        })
      )
    })

    test(`specifiers / passes [${env}]`, async () => {
      vite.build(
        config({
          ssr,
          options: {
            [env]: { specifiers: ["other", "**/other/*", /other/] },
          },
        })
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
          })
        )
      ).rejects.toMatchSnapshot()
    })

    test(`files / denied by glob [${env}]`, async () => {
      await expect(
        vite.build(
          config({
            ssr,
            options: {
              [env]: { files: ["**/deny-me.*"] },
            },
          })
        )
      ).rejects.toMatchSnapshot()
    })

    test(`files / denied by regex [${env}]`, async () => {
      await expect(
        vite.build(
          config({
            ssr,
            options: {
              [env]: { files: [/^lib\/deny-me\.js$/] },
            },
          })
        )
      ).rejects.toMatchSnapshot()
    })

    test(`files / passes [${env}]`, async () => {
      vite.build(
        config({
          ssr,
          options: {
            [env]: { files: ["other", "**/other/*", /other/] },
          },
        })
      )
    })
  }
})
