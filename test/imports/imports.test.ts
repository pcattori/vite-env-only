import * as vite from "vite"
import { describe, test, expect } from "vitest"
import path from "node:path"
import envOnly from "../../src"

describe("imports", () => {
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
            imports: {
              server: [/server-only/],
              client: [/client-only/],
            },
          },
        })
      )
    ).rejects.toMatchInlineSnapshot(
      `[Error: Import from "./client-only" in "lib/main.js" is not allowed in the server module graph]`
    )
  })

  test("server success", async () => {
    vite.build(
      config({
        ssr: true,
        envOnlyOptions: {
          imports: {
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
            imports: {
              server: [/server-only/],
              client: [/client-only/],
            },
          },
        })
      )
    ).rejects.toMatchInlineSnapshot(
      `[Error: Import from "./server-only" in "lib/main.js" is not allowed in the client module graph]`
    )
  })

  test("client success", async () => {
    await vite.build(
      config({
        ssr: false,
        envOnlyOptions: {
          imports: {
            server: [],
            client: [],
          },
        },
      })
    )
  })
})
