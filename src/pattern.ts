import micromatch from "micromatch"

export type Pattern = string | RegExp

export function findMatch(
  id: string,
  patterns: Pattern[] = []
): Pattern | null {
  for (let pattern of patterns) {
    let matchGlob =
      typeof pattern === "string" && micromatch.isMatch(id, pattern)
    let matchRegex = pattern instanceof RegExp && id.match(pattern)
    if (matchGlob || matchRegex) return pattern
  }
  return null
}
