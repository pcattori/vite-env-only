import { name as pkgName } from "../package.json"

const maybe = <T>(_: T): T | undefined => {
  throw Error(
    [
      `${pkgName}: unreplaced macro`,
      "",
      `Did you forget to add the '${pkgName}' plugin to your Vite config?`,
      "👉 https://github.com/pcattori/vite-env-only?tab=readme-ov-file#installation",
    ].join("\n"),
  )
}

/**
 * On the server, replaced with the value passed in.
 * On the client, replaced with `undefined`.
 */
export const server$ = maybe

/**
 * On the client, replaced with the value passed in.
 * On the server, replaced with `undefined`.
 */
export const client$ = maybe
