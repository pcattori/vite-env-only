import type { Env } from "./env"
import { getEntries, normalizeRelativePath } from "./utils"

export type FileValidators = Partial<Record<Env, Array<string | RegExp>>>

export function validateFile({
  absolutePath,
  fileValidators,
  root,
  importer,
  env,
}: {
  absolutePath: string
  fileValidators: FileValidators
  root: string
  importer: string | undefined
  env: Env
}): void {
  const relativePath = normalizeRelativePath(root, absolutePath)

  getEntries(fileValidators).forEach(([key, validators]) => {
    if (key === env || !validators || !validators.length) {
      return
    }

    for (const validator of validators) {
      if (
        (typeof validator === "string" && validator === relativePath) ||
        (validator instanceof RegExp && relativePath.match(validator))
      ) {
        throw new Error(
          `File "${relativePath}"${
            importer
              ? ` imported by "${normalizeRelativePath(root, importer)}"`
              : ""
          } is not allowed in the ${env} module graph`
        )
      }
    }
  })
}
