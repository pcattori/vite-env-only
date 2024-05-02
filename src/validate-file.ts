import type { Env } from "./env"
import { normalizeRelativePath } from "./utils"
import { type Validators, validateId } from "./validate-id"

export function validateFile({
  absolutePath,
  fileValidators,
  root,
  importer,
  env,
}: {
  absolutePath: string
  fileValidators: Validators
  root: string
  importer: string | undefined
  env: Env
}): void {
  const relativePath = normalizeRelativePath(root, absolutePath)

  validateId({
    id: relativePath,
    env,
    validators: fileValidators,
    errorMessage: `File "${relativePath}"${
      importer ? ` imported by "${normalizeRelativePath(root, importer)}"` : ""
    } is not allowed in the ${env} module graph`,
  })
}
