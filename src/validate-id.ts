import { Env } from "./env"
import { getEntries, normalizeRelativePath } from "./utils"

export type Validators = Partial<Record<Env, Array<string | RegExp>>>

export function validateId({
  id,
  env,
  validators,
  errorMessage,
}: {
  id: string
  env: Env
  validators: Validators
  errorMessage: string
}): void {
  for (const [key, envValidators] of getEntries(validators)) {
    if (key === env || !envValidators || !envValidators.length) {
      continue
    }

    for (const validator of envValidators) {
      if (
        (typeof validator === "string" && validator === id) ||
        (validator instanceof RegExp && id.match(validator))
      ) {
        throw new Error(errorMessage)
      }
    }
  }
}
