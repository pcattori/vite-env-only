import { type PluginOption } from "vite"
import path from "node:path"

import { name as pkgName } from "../package.json"
import { transform } from "./transform"
import { type ImportValidators, validateImport } from "./validate-import"
import { type FileValidators, validateFile } from "./validate-file"

export { serverOnly$, clientOnly$ } from "./macro"

type Options = { imports?: ImportValidators; files?: FileValidators }

export default ({
  imports: importValidators,
  files: fileValidators,
}: Options = {}): PluginOption[] => {
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
    importValidators
      ? {
          name: "vite-plugin-env-only-imports",
          enforce: "pre",
          resolveId(id, importer, options) {
            validateImport({
              importValidators,
              id,
              root,
              importer,
              env: options?.ssr ? "server" : "client",
            })
          },
        }
      : null,
    fileValidators
      ? {
          name: "vite-plugin-env-only-files",
          enforce: "pre",
          async resolveId(id, importer, options) {
            let isResolving =
              options?.custom?.["vite-plugin-env-only-files"] ?? false

            if (isResolving) {
              return
            }

            options.custom = {
              ...options.custom,
              "vite-plugin-env-only-files": true,
            }

            const resolvedId = (await this.resolve(id, importer, options))?.id

            if (!resolvedId || !path.isAbsolute(resolvedId)) {
              return
            }

            validateFile({
              absolutePath: resolvedId,
              fileValidators,
              root,
              importer,
              env: options?.ssr ? "server" : "client",
            })
          },
        }
      : null,
  ]
}
