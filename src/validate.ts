import { normalizePath } from "vite"
import path from "node:path"

type Env = "server" | "client"
export type ImportValidators = Partial<Record<Env, Array<string | RegExp>>>

export function validateId({
  id,
  imports,
  root,
  importer,
  env,
}: {
  id: string
  imports: ImportValidators
  root: string
  importer: string | undefined
  env: Env
}): void {
  entries(imports).forEach(([key, validators]) => {
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
            importer ? ` in "${shortenImporter({ root, importer })}"` : ""
          } is not allowed in the ${env} module graph`
        )
      }
    }
  })
}

function shortenImporter({
  root,
  importer,
}: {
  root: string
  importer: string
}) {
  return normalizePath(path.relative(root, importer))
}

function entries<T extends {}>(obj: T) {
  return Object.entries(obj) as [keyof T, T[keyof T]][]
}
