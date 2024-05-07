import { ResolvedConfig, type PluginOption } from "vite"
import path from "node:path"

import { name as pkgName } from "../package.json"
import { transform } from "./transform"
import { type EnvPatterns } from "./validate-id"
import { validateImport } from "./validate-import"
import { validateFile } from "./validate-file"

export { serverOnly$, clientOnly$ } from "./macro"

type Options = {
  denyImports?: EnvPatterns
  denyFiles?: EnvPatterns
}

export default ({ denyImports, denyFiles }: Options = {}): PluginOption[] => {
  let root: string
  let command: ResolvedConfig["command"]

  return [
    {
      name: "vite-plugin-env-only",
      configResolved(config) {
        root = config.root
        command = config.command
      },
      async transform(code, id, options) {
        if (!code.includes(pkgName)) return
        return transform(code, id, { ssr: options?.ssr === true })
      },
    },
    denyImports
      ? {
          name: "vite-plugin-env-only-imports",
          enforce: "pre",
          resolveId(id, importer, options) {
            if (!importer) {
              return
            }

            validateImport({
              id,
              denyImports,
              root,
              importer,
              env: options?.ssr ? "server" : "client",
            })
          },
        }
      : null,
    denyFiles
      ? {
          name: "vite-plugin-env-only-files",
          enforce: "pre",
          async resolveId(id, importer, options) {
            if (command !== "build" && importer?.endsWith(".html")) {
              // Vite has a special `index.html` importer for `resolveId` within `transformRequest`
              // https://github.com/vitejs/vite/blob/5684fcd8d27110d098b3e1c19d851f44251588f1/packages/vite/src/node/server/transformRequest.ts#L158
              // https://github.com/vitejs/vite/blob/5684fcd8d27110d098b3e1c19d851f44251588f1/packages/vite/src/node/server/pluginContainer.ts#L668
              return
            }

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
              denyFiles,
              root,
              importer,
              env: options?.ssr ? "server" : "client",
            })
          },
        }
      : null,
  ]
}
