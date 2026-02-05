import path from "node:path"

import dedent from "dedent"
import * as vite from "vite"
import { describe, expect } from "vitest"
import test from "./fixtures"
import { envOnlyMacros } from "../src/index.js"

describe("macros", () => {
  const config = ({
    root,
    ssr,
    outDir,
  }: {
    root: string
    ssr: boolean
    outDir: string
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
          dir: outDir,
          entryFileNames: "index.js",
        },
      },
    },
    plugins: [envOnlyMacros()],
  })

  const FILES = {
    "lib/main.js": dedent`
      import { serverOnly$, clientOnly$ } from "vite-env-only/macros"

      export default {
        server: serverOnly$(true) ?? false,
        client: clientOnly$(true) ?? false,
      }
    `,
  }

  test("serverOnly$", async ({ files }) => {
    const root = await files(FILES)
    const outDir = path.join(root, "dist/server")
    await vite.build(config({ root, ssr: true, outDir }))

    expect((await import(path.join(outDir, "index.js"))).default).toEqual({
      server: true,
      client: false,
    })
  })

  test("clientOnly$", async ({ files }) => {
    const root = await files(FILES)
    const outDir = path.join(root, "dist/client")
    await vite.build(config({ root, ssr: false, outDir }))

    expect((await import(path.join(outDir, "index.js"))).default).toEqual({
      server: false,
      client: true,
    })
  })
})
