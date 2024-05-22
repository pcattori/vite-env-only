import { name as pkgName } from "../package.json"

const maybe = <T>(_: T): T | undefined => {
  throw Error(
    [
      `${pkgName}: unreplaced macro`,
      "",
      `Did you forget to add the '${pkgName}' plugin to your Vite config?`,
      "👉 https://github.com/pcattori/vite-env-only#install",
    ].join("\n"),
  )
}

/**
 * On the server, replaced with the value passed in.
 * On the client, replaced with `undefined`.
 */
export const serverOnly$ = maybe

/**
 * On the client, replaced with the value passed in.
 * On the server, replaced with `undefined`.
 */
export const clientOnly$ = maybe
