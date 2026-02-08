import fs from "node:fs"
import path from "node:path"

import dedent from "dedent"
import { build } from "vite"
import { describe, expect } from "vitest"

import { test } from "../../test/fixtures"
import { Envs } from "../env"
import { envOnly } from "./plugin"

const macroSpecifier = "vite-env-only/macro"

describe("only macro", () => {
  test("throws on namespace import from vite-env-only/macro", async ({
    files,
    viteConfig,
  }) => {
    await files({
      "index.ts": dedent`
        import * as envOnly from "${macroSpecifier}"

        export const message = envOnly.only("server", "server only")
      `,
    })

    for (const env of Envs) {
      let config = viteConfig({
        env,
        entry: "index.ts",
        outputFile: "dist/index.js",
        plugins: [envOnly()],
      })
      await expect(build(config)).rejects.toThrow(
        `Namespace import is not supported by '${macroSpecifier}'`,
      )
    }
  })

  test("throws on default import from vite-env-only/macro", async ({
    files,
    viteConfig,
  }) => {
    await files({
      "index.ts": dedent`
        import envOnly from "${macroSpecifier}"

        export const message = envOnly.only("server", "server only")
      `,
    })

    for (const env of Envs) {
      let config = viteConfig({
        env,
        entry: "index.ts",
        outputFile: "dist/index.js",
        plugins: [envOnly()],
      })
      await expect(build(config)).rejects.toThrow(
        `Default import is not supported by '${macroSpecifier}'`,
      )
    }
  })

  test("allows aliasing in named import", async ({
    cwd,
    files,
    viteConfig,
  }) => {
    await files({
      "index.ts": dedent`
        import { only as myOnly } from "${macroSpecifier}"

        export default {
          server: myOnly("server", "server-val"),
          client: myOnly("client", "client-val"),
        }
      `,
    })
    await build(
      viteConfig({
        env: "server",
        entry: "index.ts",
        outputFile: "dist/server.js",
        plugins: [envOnly()],
      }),
    )
    expect((await import(path.join(cwd, "dist/server.js"))).default).toEqual({
      server: "server-val",
      client: undefined,
    })

    await build(
      viteConfig({
        env: "client",
        entry: "index.ts",
        outputFile: "dist/client.js",
        plugins: [envOnly()],
      }),
    )
    expect((await import(path.join(cwd, "dist/client.js"))).default).toEqual({
      server: undefined,
      client: "client-val",
    })
  })

  test("throws when manipulated at runtime (must be statically analyzable)", async ({
    files,
    viteConfig,
  }) => {
    await files({
      "index.ts": dedent`
        import { only as x } from "${macroSpecifier}"

        const z = x

        export const message = z("server", "server only")
      `,
    })

    for (const env of Envs) {
      let config = viteConfig({
        env,
        entry: "index.ts",
        outputFile: "dist/index.js",
        plugins: [envOnly()],
      })
      await expect(build(config)).rejects.toThrow(
        "'x' macro cannot be manipulated at runtime as it must be statically analyzable",
      )
    }
  })

  test("throws when called with 0 args", async ({ files, viteConfig }) => {
    await files({
      "index.ts": dedent`
        import { only } from "${macroSpecifier}"

        export const message = only()
      `,
    })
    for (const env of Envs) {
      let config = viteConfig({
        env,
        entry: "index.ts",
        outputFile: "dist/index.js",
        plugins: [envOnly()],
      })
      await expect(build(config)).rejects.toThrow(
        "'only' macro must take exactly two arguments",
      )
    }
  })

  test("throws when called with 1 arg", async ({ files, viteConfig }) => {
    await files({
      "index.ts": dedent`
        import { only } from "${macroSpecifier}"

        export const message = only("server")
      `,
    })
    for (const env of Envs) {
      let config = viteConfig({
        env,
        entry: "index.ts",
        outputFile: "dist/index.js",
        plugins: [envOnly()],
      })
      await expect(build(config)).rejects.toThrow(
        "'only' macro must take exactly two arguments",
      )
    }
  })

  test("throws when called with 3 args", async ({ files, viteConfig }) => {
    await files({
      "index.ts": dedent`
        import { only } from "${macroSpecifier}"

        export const message = only("server", "x", "y")
      `,
    })
    for (const env of Envs) {
      let config = viteConfig({
        env,
        entry: "index.ts",
        outputFile: "dist/index.js",
        plugins: [envOnly()],
      })
      await expect(build(config)).rejects.toThrow(
        "'only' macro must take exactly two arguments",
      )
    }
  })

  test("throws when first arg is not a string literal", async ({
    files,
    viteConfig,
  }) => {
    await files({
      "index.ts": dedent`
        import { only } from "${macroSpecifier}"

        const env = "server"
        export const message = only(env, "expression")
      `,
    })
    for (const env of Envs) {
      let config = viteConfig({
        env,
        entry: "index.ts",
        outputFile: "dist/index.js",
        plugins: [envOnly()],
      })
      await expect(build(config)).rejects.toThrow(
        "'only' macro must take a string literal as the first argument",
      )
    }
  })

  test('throws when first arg is not "client" or "server"', async ({
    files,
    viteConfig,
  }) => {
    await files({
      "index.ts": dedent`
        import { only } from "${macroSpecifier}"

        export const message = only("foo", "value")
      `,
    })
    for (const env of Envs) {
      let config = viteConfig({
        env,
        entry: "index.ts",
        outputFile: "dist/index.js",
        plugins: [envOnly()],
      })
      await expect(build(config)).rejects.toThrow(
        "environment must be one of: 'server', 'client'",
      )
    }
  })

  test("replaces itself with the wrapped expression when env matches", async ({
    cwd,
    files,
    viteConfig,
  }) => {
    await files({
      "index.ts": dedent`
        import { only } from "${macroSpecifier}"

        export default only("server", 42)
      `,
    })
    await build(
      viteConfig({
        env: "server",
        entry: "index.ts",
        outputFile: "dist/index.js",
        plugins: [envOnly()],
      }),
    )
    expect((await import(path.join(cwd, "dist/index.js"))).default).toBe(42)
  })

  test("replaces itself with undefined when env does not match", async ({
    cwd,
    files,
    viteConfig,
  }) => {
    await files({
      "index.ts": dedent`
        import { only } from "${macroSpecifier}"

        export default only("client", "value")
      `,
    })
    await build(
      viteConfig({
        env: "server",
        entry: "index.ts",
        outputFile: "dist/index.js",
        plugins: [envOnly()],
      }),
    )
    expect(
      (await import(path.join(cwd, "dist/index.js"))).default,
    ).toBeUndefined()
  })

  test("eliminates newly unreferenced identifiers when env does not match", async ({
    cwd,
    files,
    viteConfig,
  }) => {
    await files({
      "index.ts": dedent`
        import { only } from "${macroSpecifier}"

        const compute = () => 1
        export const serverOnly = only("server", compute())
        export const unused = 2
      `,
    })
    await build(
      viteConfig({
        env: "client",
        entry: "index.ts",
        outputFile: "dist/index.js",
        plugins: [envOnly()],
      }),
    )
    const outPath = path.join(cwd, "dist/index.js")
    const out = fs.readFileSync(outPath, "utf-8")
    expect(out).not.toContain("compute")
    const mod = await import(outPath)
    expect(mod.serverOnly).toBeUndefined()
    expect(mod.unused).toBe(2)
  })
})
