import type { Plugin } from "vite"

import { name as pkgName } from "../package.json"
import { transform } from "./transform"

export { serverOnly$, clientOnly$ } from "./macro"

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
