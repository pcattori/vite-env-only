import type { Env } from "./env"
import { normalizeRelativePath } from "./utils"
import { type Validators, validateId } from "./validate-id"

export function validateImport({
  id,
  importValidators,
  root,
  importer,
  env,
}: {
  id: string
  importValidators: Validators
  root: string
  importer: string | undefined
  env: Env
}): void {
  validateId({
    id,
    env,
    validators: importValidators,
    errorMessage: `Import from "${id}"${
      importer ? ` in "${normalizeRelativePath(root, importer)}"` : ""
    } is not allowed in the ${env} module graph`,
  })
}
