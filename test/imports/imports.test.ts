import * as vite from "vite"
import { describe, test, expect } from "vitest"
import path from "node:path"
import envOnly from "../../src"

describe("imports", () => {
  const root = __dirname

  const config = ({
    ssr,
    plugins,
  }: {
    ssr: boolean
    plugins: vite.PluginOption[]
  }): vite.InlineConfig => ({
    root,
    plugins,
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
  })

  test("server failure", async () => {
    await expect(
      vite.build(
        config({
          ssr: true,
          plugins: [
            envOnly({
              denyImports: {
                client: [/server-only/],
                server: [/client-only/],
              },
            }),
          ],
        })
      )
    ).rejects.toMatchInlineSnapshot(
      `
      [Error: [vite-env-only:denyImports] Import denied in server environment
       - Import: "./client-only"
       - Importer: lib/main.js
       - Pattern: /client-only/]
    `
    )
  })

  test("server success", async () => {
    vite.build(
      config({
        ssr: true,
        plugins: [
          envOnly({
            denyImports: {
              client: [],
              server: [],
            },
          }),
        ],
      })
    )
  })

  test("client failure", async () => {
    await expect(
      vite.build(
        config({
          ssr: false,
          plugins: [
            envOnly({
              denyImports: {
                client: [/server-only/],
                server: [/client-only/],
              },
            }),
          ],
        })
      )
    ).rejects.toMatchInlineSnapshot(
      `
      [Error: [vite-env-only:denyImports] Import denied in client environment
       - Import: "./server-only"
       - Importer: lib/main.js
       - Pattern: /server-only/]
    `
    )
  })

  test("client success", async () => {
    await vite.build(
      config({
        ssr: false,
        plugins: [
          envOnly({
            denyImports: {
              client: [],
              server: [],
            },
          }),
        ],
      })
    )
  })

  test("standalone plugin", async () => {
    await expect(
      vite.build(
        config({
          ssr: false,
          plugins: [
            envOnly.denyImports({
              client: [/server-only/],
              server: [/client-only/],
            }),
          ],
        })
      )
    ).rejects.toMatchInlineSnapshot(
      `
      [Error: [vite-env-only:denyImports] Import denied in client environment
       - Import: "./server-only"
       - Importer: lib/main.js
       - Pattern: /server-only/]
    `
    )
  })
})
