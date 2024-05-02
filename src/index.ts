import type { PluginOption } from "vite"

import { name as pkgName } from "../package.json"
import { transform } from "./transform"
import { type ImportValidators, validateImport } from "./validate-import"

export { serverOnly$, clientOnly$ } from "./macro"

type Options = { imports?: ImportValidators }

export default ({ imports }: Options = {}): PluginOption[] => {
  let root: string

  return [
    {
      name: "vite-plugin-env-only",
      configResolved(config) {
        root = config.root
      },
      async transform(code, id, options) {
        if (!code.includes(pkgName)) return
        return transform(code, id, { ssr: options?.ssr === true })
      },
    },
    imports
      ? {
          name: "vite-plugin-env-only-imports",
          enforce: "pre",
          resolveId(id, importer, options) {
            validateImport({
              id,
              imports,
              root,
              importer,
              env: options?.ssr ? "server" : "client",
            })
          },
        }
      : null,
  ]
}
