import fs from "node:fs"
import path from "node:path"
import { test as base } from "vitest"
import type { InlineConfig, PluginOption } from "vite"

import type { Env } from "../src/env"

export const test = base.extend<{
  cwd: string
  files: (entries: Record<string, string>) => Promise<void>
  viteConfig: (args: {
    env: Env
    entry: string
    outputFile: string
    plugins?: PluginOption[]
  }) => InlineConfig
}>({
  cwd: async ({ task }, use) => {
    const root = path.join(process.cwd(), ".test")
    fs.mkdirSync(root, { recursive: true })
    const cwd = fs.mkdtempSync(path.join(root, "vitest-"))
    await use(cwd)
    if ((task.result?.errors?.length ?? 0) === 0) {
      fs.rmSync(cwd, { recursive: true, force: true })
    }
  },
  files: async ({ cwd }, use) => {
    const write = async (entries: Record<string, string>): Promise<void> => {
      for (const [rel, content] of Object.entries(entries)) {
        const full = path.join(cwd, rel)
        fs.mkdirSync(path.dirname(full), { recursive: true })
        fs.writeFileSync(full, content, "utf-8")
      }
    }
    await use(write)
  },
  viteConfig: async ({ cwd }, use) => {
    await use(({ env, entry, outputFile, plugins }): InlineConfig => {
      return {
        root: cwd,
        logLevel: "silent",
        build: {
          ssr: env === "server",
          minify: false,
          lib: {
            entry,
            formats: ["es"],
          },
          rollupOptions: {
            output: {
              dir: path.join(cwd, path.dirname(outputFile)),
              entryFileNames: path.basename(outputFile),
            },
          },
        },
        plugins: plugins ?? [],
      }
    })
  },
})
