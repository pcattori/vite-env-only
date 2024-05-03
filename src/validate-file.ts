import type { Env } from "./env"
import { normalizeRelativePath } from "./utils"
import { type EnvMatchers, validateId } from "./validate-id"

export function validateFile({
  absolutePath,
  denyFiles,
  root,
  importer,
  env,
}: {
  absolutePath: string
  denyFiles: EnvMatchers
  root: string
  importer: string | undefined
  env: Env
}): void {
  const relativePath = normalizeRelativePath(root, absolutePath)

  validateId({
    id: relativePath,
    env,
    invalidIds: denyFiles,

    errorMessage: ({ matcherString }) =>
      [
        `File denied in ${env} environment`,
        ` - File: ${relativePath}`,
        ...(importer
          ? [` - Importer: ${normalizeRelativePath(root, importer)}`]
          : []),
        ` - Matcher: ${matcherString}`,
      ].join("\n"),
  })
}
