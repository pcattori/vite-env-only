import { type PluginOption } from "vite"

import pkg from "../package.json"
import { transform } from "./transform"

export {
  default as denyImports,
  DenyImportsFileError,
  DenyImportsSpecifierError,
} from "./deny-imports"

export function envOnlyMacros(): PluginOption[] {
  return [
    {
      name: "env-only-macros",
      async transform(code, id, options) {
        if (!code.includes(pkg.name)) return
        return transform(code, id, { ssr: options?.ssr === true })
      },
    },
  ]
}
