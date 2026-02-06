import path from "node:path"

import dedent from "dedent"
import * as vite from "vite"
import { describe, expect } from "vitest"
import { test } from "../test/fixtures"
import { envOnlyMacros } from "./index.js"
import { serverOnly$, clientOnly$ } from "./macros"

describe("macros", () => {
  test("unreplaced macro throws error", () => {
    expect(() => serverOnly$("hello")).toThrowError(/unreplaced macro/)
    expect(() => clientOnly$("world")).toThrowError(/unreplaced macro/)
  })

  const FILES = {
    "index.ts": dedent`
      import { serverOnly$, clientOnly$ } from "vite-env-only/macros"

      export default {
        server: serverOnly$(true) ?? false,
        client: clientOnly$(true) ?? false,
      }
    `,
  }

  test("serverOnly$", async ({ cwd, files, viteConfig }) => {
    await files(FILES)

    await vite.build(
      viteConfig({
        env: "server",
        entry: "index.ts",
        outputFile: "dist/index.js",
        plugins: [envOnlyMacros()],
      }),
    )

    expect((await import(path.join(cwd, "dist/index.js"))).default).toEqual({
      server: true,
      client: false,
    })
  })

  test("clientOnly$", async ({ cwd, files, viteConfig }) => {
    await files(FILES)

    await vite.build(
      viteConfig({
        env: "client",
        entry: "index.ts",
        outputFile: "dist/index.js",
        plugins: [envOnlyMacros()],
      }),
    )

    expect((await import(path.join(cwd, "dist/index.js"))).default).toEqual({
      server: false,
      client: true,
    })
  })
})
