import type { Plugin } from "vite"

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

export default (): Plugin => {
  return {
    name: "vite-plugin-env-only",
    async transform(code, _, options) {
      if (code.includes(pkgName)) {
        return transform(code, { ssr: options?.ssr === true })
      }
    },
  }
}
