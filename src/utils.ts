import { normalizePath } from "vite"
import path from "node:path"

export function normalizeRelativePath(root: string, filePath: string) {
  return normalizePath(path.relative(root, filePath))
}
