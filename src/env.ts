import pkg from "../package.json"

export type Env = "server" | "client"

let ENV: Env | undefined

export function getEnv(): Env | undefined {
  return ENV
}

export function setEnv(env: Env) {
  if (ENV === undefined) {
    ENV = env
    return
  }
  if (ENV === env) return
  throw Error(
    [
      `${pkg.name}: cannot change environment from '${ENV}' to '${env}'`,
      "",
      `Environment was already set to '${ENV}'`,
      "👉 https://github.com/pcattori/vite-env-only#setEnv",
    ].join("\n")
  )
}
