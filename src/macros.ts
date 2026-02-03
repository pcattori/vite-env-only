import pkg from "../package.json"

const maybe = <T>(_: T): T | undefined => {
  throw Error(
    [
      `${pkg.name}: unreplaced macro`,
      "",
      `Did you forget to add the '${pkg.name}' plugin to your Vite config?`,
      "👉 https://github.com/pcattori/vite-env-only#install",
    ].join("\n")
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
