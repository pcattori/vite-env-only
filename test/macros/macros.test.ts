import * as vite from "vite"
import { describe, test, expect } from "vitest"
import path from "node:path"
import envOnly from "../../src"

describe("macros", () => {
  const root = __dirname

  const config = ({
    ssr,
    outDir,
    plugins,
  }: {
    ssr: boolean
    outDir: string
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
          dir: outDir,
          entryFileNames: "index.js",
        },
      },
    },
  })

  test("serverOnly$", async () => {
    const outDir = path.join(root, "dist/server")

    await vite.build(
      config({
        ssr: true,
        outDir,
        plugins: [envOnly()],
      })
    )

    expect((await import(outDir)).default).toEqual({
      server: true,
      client: false,
    })
  })

  test("clientOnly$", async () => {
    const outDir = path.join(root, "dist/client")

    await vite.build(
      config({
        ssr: false,
        outDir,
        plugins: [envOnly()],
      })
    )

    expect((await import(outDir)).default).toEqual({
      server: false,
      client: true,
    })
  })

  test("standalone plugin", async () => {
    const outDir = path.join(root, "dist/server")

    await vite.build(
      config({
        ssr: true,
        outDir,
        plugins: [envOnly.macros()],
      })
    )

    expect((await import(outDir)).default).toEqual({
      server: true,
      client: false,
    })
  })
})
