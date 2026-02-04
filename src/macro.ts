import pkg from "../package.json"
import { Env, getEnv } from "./env"

export const only = <value>(env: Env, value: value): value | undefined => {
  if (getEnv() === env) return value
  throw Error(
    [
      `${pkg.name}: unreplaced macro`,
      "",
      `Did you forget to add the '${pkg.name}' plugin to your Vite config?`,
      "👉 https://github.com/pcattori/vite-env-only#install",
    ].join("\n")
  )
}
