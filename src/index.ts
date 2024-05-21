import { ResolvedConfig, type PluginOption } from "vite"
import path from "node:path"

import { name as pkgName } from "../package.json"
import { transform } from "./transform"
import { type EnvPatterns } from "./validate-id"
import { validateImport } from "./validate-import"
import { validateFile } from "./validate-file"

export { serverOnly$, clientOnly$ } from "./macro"

function macrosPlugin(): PluginOption {
  return {
    name: "vite-env-only-macros",
    async transform(code, id, options) {
      if (!code.includes(pkgName)) return
      return transform(code, id, { ssr: options?.ssr === true })
    },
  }
}

function denyImportsPlugin(denyImports: EnvPatterns): PluginOption {
  let root: string

  return {
    name: "vite-env-only-deny-imports",
    enforce: "pre",
    configResolved(config) {
      root = config.root
    },
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
}

function denyFilesPlugin(denyFiles: EnvPatterns): PluginOption {
  let root: string
  let command: ResolvedConfig["command"]

  return {
    name: "vite-env-only-deny-files",
    enforce: "pre",
    configResolved(config) {
      root = config.root
      command = config.command
    },
    async resolveId(id, importer, options) {
      if (command !== "build" && importer?.endsWith(".html")) {
        // Vite has a special `index.html` importer for `resolveId` within `transformRequest`
        // https://github.com/vitejs/vite/blob/5684fcd8d27110d098b3e1c19d851f44251588f1/packages/vite/src/node/server/transformRequest.ts#L158
        // https://github.com/vitejs/vite/blob/5684fcd8d27110d098b3e1c19d851f44251588f1/packages/vite/src/node/server/pluginContainer.ts#L668
        return
      }

      let isResolving = options?.custom?.["vite-env-only-deny-files"] ?? false

      if (isResolving) {
        return
      }

      options.custom = {
        ...options.custom,
        "vite-env-only-deny-files": true,
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
}

function envOnly({
  denyImports,
  denyFiles,
}: {
  denyImports?: EnvPatterns
  denyFiles?: EnvPatterns
} = {}): PluginOption {
  return [
    macrosPlugin(),
    denyImports ? denyImportsPlugin(denyImports) : null,
    denyFiles ? denyFilesPlugin(denyFiles) : null,
  ]
}

envOnly.macros = macrosPlugin
envOnly.denyImports = denyImportsPlugin
envOnly.denyFiles = denyFilesPlugin

export default envOnly
