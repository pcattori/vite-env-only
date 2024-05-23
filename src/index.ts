import { type PluginOption } from "vite"

import { name as pkgName } from "../package.json"
import { transform } from "./transform"

export { default as denyImports } from "./deny-imports"

export function envOnlyMacros(): PluginOption[] {
  return [
    {
      name: "vite-plugin-env-only-macros",
      async transform(code, id, options) {
        if (!code.includes(pkgName)) return
        return transform(code, id, { ssr: options?.ssr === true })
      },
    },
  ]
}
