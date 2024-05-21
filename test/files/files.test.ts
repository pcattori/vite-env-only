import * as vite from "vite"
import { describe, test, expect } from "vitest"
import path from "node:path"
import envOnly from "../../src"

describe("files", () => {
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
              denyFiles: {
                client: ["lib/server-only.js"],
                server: ["lib/client-only.js"],
              },
            }),
          ],
        })
      )
    ).rejects.toMatchInlineSnapshot(
      `
      [Error: [vite-env-only:denyFiles] File denied in server environment
       - File: lib/client-only.js
       - Importer: lib/main.js
       - Pattern: "lib/client-only.js"]
    `
    )
  })

  test("server success", async () => {
    vite.build(
      config({
        ssr: true,
        plugins: [
          envOnly({
            denyFiles: {
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
              denyFiles: {
                client: ["lib/server-only.js"],
                server: ["lib/client-only.js"],
              },
            }),
          ],
        })
      )
    ).rejects.toMatchInlineSnapshot(
      `
      [Error: [vite-env-only:denyFiles] File denied in client environment
       - File: lib/server-only.js
       - Importer: lib/main.js
       - Pattern: "lib/server-only.js"]
    `
    )
  })

  test("client success", async () => {
    await vite.build(
      config({
        ssr: false,
        plugins: [
          envOnly({
            denyFiles: {
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
            envOnly.denyFiles({
              client: ["lib/server-only.js"],
              server: ["lib/client-only.js"],
            }),
          ],
        })
      )
    ).rejects.toMatchInlineSnapshot(
      `
      [Error: [vite-env-only:denyFiles] File denied in client environment
       - File: lib/server-only.js
       - Importer: lib/main.js
       - Pattern: "lib/server-only.js"]
    `
    )
  })
})
