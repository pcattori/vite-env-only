import path from "node:path"

import micromatch from "micromatch"
import { normalizePath, type PluginOption, type ResolvedConfig } from "vite"

import pkg from "../package.json"
import { type Env } from "./env"

type Pattern = string | RegExp
type EnvPatterns = Partial<Record<Env, Pattern[]>>

type Options = Partial<
  Record<Env, { specifiers?: Pattern[]; files?: Pattern[] }>
>

export default function denyImports(options: Options): PluginOption[] {
  let denySpecifiers: EnvPatterns = {}
  let denyFiles: EnvPatterns = {}

  for (let [env, { specifiers, files }] of Object.entries(options)) {
    denySpecifiers[env as Env] = specifiers
    denyFiles[env as Env] = files
  }

  return [denyImportSpecifiers(denySpecifiers), denyImportFiles(denyFiles)]
}

function denyImportSpecifiers(denySpecifiers: EnvPatterns): PluginOption {
  let root: string
  return {
    name: "deny-imports/specifiers",
    enforce: "pre",
    configResolved(config) {
      root = config.root
    },
    resolveId(id, importer, options) {
      if (!importer) return

      let env: Env = options?.ssr ? "server" : "client"
      let denialPattern = findMatch(id, denySpecifiers[env])
      if (denialPattern) {
        let message = [
          `[${pkg.name}] Import denied`,
          ` - Denied by specifier pattern: ${denialPattern}`,
          ` - Importer: ${normalizeRelativePath(root, importer)}`,
          ` - Import: "${id}"`,
          ` - Environment: ${env}`,
        ].join("\n")
        throw Error(message)
      }
    },
  }
}

function denyImportFiles(denyFiles: EnvPatterns): PluginOption {
  let root: string
  let command: ResolvedConfig["command"]
  let name = "deny-imports/files"
  return {
    name,
    enforce: "pre",
    configResolved(config) {
      root = config.root
      command = config.command
    },
    async resolveId(id, importer, options) {
      // Vite has a special `index.html` importer for `resolveId` within `transformRequest`
      // https://github.com/vitejs/vite/blob/5684fcd8d27110d098b3e1c19d851f44251588f1/packages/vite/src/node/server/transformRequest.ts#L158
      // https://github.com/vitejs/vite/blob/5684fcd8d27110d098b3e1c19d851f44251588f1/packages/vite/src/node/server/pluginContainer.ts#L668
      if (command !== "build" && importer?.endsWith(".html")) return

      let isResolving = options?.custom?.[name] ?? false
      if (isResolving) return
      options.custom = {
        ...options.custom,
        [name]: true,
      }

      let resolvedId = (await this.resolve(id, importer, options))?.id
      if (!resolvedId || !path.isAbsolute(resolvedId)) return
      let relativePath = normalizeRelativePath(root, resolvedId)

      let env: Env = options?.ssr ? "server" : "client"
      let denialPattern = findMatch(relativePath, denyFiles[env])
      if (denialPattern) {
        let message = [
          `[${pkg.name}] Import denied`,
          ` - Denied by file pattern: ${denialPattern}`,
          ...(importer
            ? [` - Importer: ${normalizeRelativePath(root, importer)}`]
            : []),
          ` - Import: "${id}"`,
          ` - Resolved: ${relativePath}`,
          ` - Environment: ${env}`,
        ].join("\n")
        throw Error(message)
      }
    },
  }
}

function normalizeRelativePath(root: string, filePath: string) {
  return normalizePath(path.relative(root, filePath))
}

function findMatch(id: string, patterns: Pattern[] = []): Pattern | null {
  for (let pattern of patterns) {
    let matchGlob =
      typeof pattern === "string" && micromatch.isMatch(id, pattern)
    let matchRegex = pattern instanceof RegExp && id.match(pattern)
    if (matchGlob || matchRegex) return pattern
  }
  return null
}
