import type { Env } from "./env"
import { normalizeRelativePath } from "./utils"
import { type EnvPatterns, validateId } from "./validate-id"

export function validateImport({
  id,
  denyImports,
  root,
  importer,
  env,
}: {
  id: string
  denyImports: EnvPatterns
  root: string
  importer: string
  env: Env
}): void {
  validateId({
    rule: "denyImports",
    id,
    env,
    invalidIds: denyImports,
    errorMessage: ({ pattern }) =>
      [
        `Import denied in ${env} environment`,
        ` - Import: "${id}"`,
        ` - Importer: ${normalizeRelativePath(root, importer)}`,
        ` - Pattern: ${pattern}`,
      ].join("\n"),
  })
}
