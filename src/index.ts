import type { Plugin } from "vite"

import { name as pkgName } from "../package.json"
import { transform } from "./transform"
import { type ImportValidators, validateId } from "./validate"

export { serverOnly$, clientOnly$ } from "./macro"

type Options = { imports?: ImportValidators }

export default ({ imports = {} }: Options = {}): Plugin => {
  let root: string

  return {
    name: "vite-plugin-env-only",
    configResolved(config) {
      root = config.root
    },
    resolveId(id, importer, options) {
      validateId({
        id,
        imports,
        root,
        importer,
        env: options?.ssr ? "server" : "client",
      })
    },
    async transform(code, id, options) {
      if (!code.includes(pkgName)) return
      return transform(code, id, { ssr: options?.ssr === true })
    },
  }
}
