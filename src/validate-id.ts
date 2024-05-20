import micromatch from "micromatch"

import { Env } from "./env"
import pkg from "../package.json"

type Pattern = string | RegExp
export type EnvPatterns = Partial<Record<Env, Array<Pattern>>>

export function validateId({
  rule,
  id,
  env,
  invalidIds: denyIds,
  errorMessage,
}: {
  rule: string
  id: string
  env: Env
  invalidIds: EnvPatterns
  errorMessage: (args: { pattern: string }) => string
}): void {
  const patterns = denyIds[env]

  if (!patterns || !patterns.length) {
    return
  }

  for (const pattern of patterns) {
    if (
      (typeof pattern === "string" && micromatch.isMatch(id, pattern)) ||
      (pattern instanceof RegExp && id.match(pattern))
    ) {
      let message = errorMessage({
        pattern:
          typeof pattern === "string"
            ? JSON.stringify(pattern)
            : pattern.toString(),
      })

      throw new Error(`[${pkg.name}:${rule}] ${message}`)
    }
  }
}
