import fs from "node:fs"
import path from "node:path"
import { test as base } from "vitest"

export const test = base.extend<{
  cwd: string
  files: (entries: Record<string, string>) => Promise<string>
}>({
  cwd: async ({ task }, use) => {
    const root = path.join(process.cwd(), ".test")
    fs.mkdirSync(root, { recursive: true })
    const cwd = fs.mkdtempSync(path.join(root, "vitest-"))
    await use(cwd)
    const result = task.result
    if (result?.errors?.length === 0) {
      fs.rmSync(cwd, { recursive: true, force: true })
    }
  },
  files: async ({ cwd }, use) => {
    const write = async (entries: Record<string, string>): Promise<string> => {
      for (const [rel, content] of Object.entries(entries)) {
        const full = path.join(cwd, rel)
        fs.mkdirSync(path.dirname(full), { recursive: true })
        fs.writeFileSync(full, content, "utf-8")
      }
      return cwd
    }
    await use(write)
  },
})
