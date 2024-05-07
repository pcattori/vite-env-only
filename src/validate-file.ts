import type { Env } from "./env"
import { normalizeRelativePath } from "./utils"
import { type EnvPatterns, validateId } from "./validate-id"

export function validateFile({
  absolutePath,
  denyFiles,
  root,
  importer,
  env,
}: {
  absolutePath: string
  denyFiles: EnvPatterns
  root: string
  importer: string | undefined
  env: Env
}): void {
  const relativePath = normalizeRelativePath(root, absolutePath)

  validateId({
    rule: "denyFiles",
    id: relativePath,
    env,
    invalidIds: denyFiles,

    errorMessage: ({ pattern }) =>
      [
        `File denied in ${env} environment`,
        ` - File: ${relativePath}`,
        ...(importer
          ? [` - Importer: ${normalizeRelativePath(root, importer)}`]
          : []),
        ` - Pattern: ${pattern}`,
      ].join("\n"),
  })
}
