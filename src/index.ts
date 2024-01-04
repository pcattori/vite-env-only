import { name as pkgName } from "../package.json"
import { transform } from "./transform"

const maybe = <T>(x: T): T | undefined => x

/**
 * On the server, returns the value passed in.
 * On the client, returns `undefined`.
 */
export const server$ = maybe

/**
 * On the client, returns the value passed in.
 * On the server, returns `undefined`.
 */
export const client$ = maybe

export const plugin = () => {
  return {
    name: "vite-plugin-env-only",
    async transform(code: string, _: unknown, options: { ssr?: boolean }) {
      let macro = options.ssr ? "client$" : "server$"
      if (code.includes(macro) && code.includes(pkgName)) {
        return transform(code, macro)
      }
    },
  }
}
