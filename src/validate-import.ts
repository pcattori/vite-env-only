import type { Env } from "./env"
import { getEntries, normalizeRelativePath } from "./utils"

export type ImportValidators = Partial<Record<Env, Array<string | RegExp>>>

export function validateImport({
  id,
  importValidators,
  root,
  importer,
  env,
}: {
  id: string
  importValidators: ImportValidators
  root: string
  importer: string | undefined
  env: Env
}): void {
  getEntries(importValidators).forEach(([key, validators]) => {
    if (key === env || !validators || !validators.length) {
      return
    }

    for (const validator of validators) {
      if (
        (typeof validator === "string" && validator === id) ||
        (validator instanceof RegExp && id.match(validator))
      ) {
        throw new Error(
          `Import from "${id}"${
            importer ? ` in "${normalizeRelativePath(root, importer)}"` : ""
          } is not allowed in the ${env} module graph`
        )
      }
    }
  })
}
