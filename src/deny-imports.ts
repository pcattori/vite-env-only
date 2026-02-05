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
        throw new DenyImportsSpecifierError({
          pattern: denialPattern,
          importer: normalizeRelativePath(root, importer),
          import: id,
          env,
        })
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
        throw new DenyImportsFileError({
          pattern: denialPattern,
          importer: importer ? normalizeRelativePath(root, importer) : undefined,
          import: id,
          resolved: relativePath,
          env,
        })
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

export class DenyImportsSpecifierError extends Error {
  details: {
    pattern: Pattern
    importer: string
    import: string
    env: Env
  }

  constructor(details: DenyImportsSpecifierError["details"]) {
    const { pattern, importer, import: importSpecifier, env } = details
    super(
      [
        `[${pkg.name}] Import denied`,
        ` - Denied by specifier pattern: ${pattern}`,
        ` - Importer: ${importer}`,
        ` - Import: "${importSpecifier}"`,
        ` - Environment: ${env}`,
      ].join("\n"),
    )
    this.name = "DenyImportsSpecifierError"
    this.details = details
  }
}

export class DenyImportsFileError extends Error {
  details: {
    pattern: Pattern
    importer: string | undefined
    import: string
    resolved: string
    env: Env
  }

  constructor(details: DenyImportsFileError["details"]) {
    const { pattern, importer, import: importSpecifier, resolved, env } = details
    super(
      [
        `[${pkg.name}] Import denied`,
        ` - Denied by file pattern: ${pattern}`,
        ...(importer ? [` - Importer: ${importer}`] : []),
        ` - Import: "${importSpecifier}"`,
        ` - Resolved: ${resolved}`,
        ` - Environment: ${env}`,
      ].join("\n"),
    )
    this.name = "DenyImportsFileError"
    this.details = details
  }
}
