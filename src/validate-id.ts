import { Env } from "./env"

type Matcher = string | RegExp
export type EnvMatchers = Partial<Record<Env, Array<Matcher>>>

export function validateId({
  id,
  env,
  invalidIds: denyIds,
  errorMessage,
}: {
  id: string
  env: Env
  invalidIds: EnvMatchers
  errorMessage: (args: { matcherString: string }) => string
}): void {
  const matchers = denyIds[env]

  if (!matchers || !matchers.length) {
    return
  }

  for (const matcher of matchers) {
    if (
      (typeof matcher === "string" && id === matcher) ||
      (matcher instanceof RegExp && id.match(matcher))
    ) {
      throw new Error(
        errorMessage({
          matcherString:
            typeof matcher === "string"
              ? JSON.stringify(matcher)
              : matcher.toString(),
        })
      )
    }
  }
}
