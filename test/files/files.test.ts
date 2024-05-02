import * as vite from "vite"
import { describe, test, expect } from "vitest"
import path from "node:path"
import envOnly from "../../src"

describe("files", () => {
  const root = __dirname

  const config = ({
    ssr,
    envOnlyOptions,
  }: {
    ssr: boolean
    envOnlyOptions: Parameters<typeof envOnly>[0]
  }): vite.InlineConfig => ({
    root,
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
    plugins: [envOnly(envOnlyOptions)],
  })

  test("server failure", async () => {
    await expect(
      vite.build(
        config({
          ssr: true,
          envOnlyOptions: {
            files: {
              server: ["lib/server-only.js"],
              client: ["lib/client-only.js"],
            },
          },
        })
      )
    ).rejects.toMatchInlineSnapshot(
      `[Error: File "lib/client-only.js" imported by "lib/main.js" is not allowed in the server module graph]`
    )
  })

  test("server success", async () => {
    vite.build(
      config({
        ssr: true,
        envOnlyOptions: {
          files: {
            server: [],
            client: [],
          },
        },
      })
    )
  })

  test("client failure", async () => {
    await expect(
      vite.build(
        config({
          ssr: false,
          envOnlyOptions: {
            files: {
              server: ["lib/server-only.js"],
              client: ["lib/client-only.js"],
            },
          },
        })
      )
    ).rejects.toMatchInlineSnapshot(
      `[Error: File "lib/server-only.js" imported by "lib/main.js" is not allowed in the client module graph]`
    )
  })

  test("client success", async () => {
    await vite.build(
      config({
        ssr: false,
        envOnlyOptions: {
          files: {
            server: [],
            client: [],
          },
        },
      })
    )
  })
})
