import type { Env } from "./env"
import { normalizeRelativePath } from "./utils"
import { type EnvMatchers, validateId } from "./validate-id"

export function validateImport({
  id,
  denyImports,
  root,
  importer,
  env,
}: {
  id: string
  denyImports: EnvMatchers
  root: string
  importer: string
  env: Env
}): void {
  validateId({
    id,
    env,
    invalidIds: denyImports,
    errorMessage: ({ matcherString }) =>
      [
        `Import denied in ${env} environment`,
        ` - Import: "${id}"`,
        ` - Importer: ${normalizeRelativePath(root, importer)}`,
        ` - Matcher: ${matcherString}`,
      ].join("\n"),
  })
}
