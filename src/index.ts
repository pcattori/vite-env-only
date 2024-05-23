import { ResolvedConfig, type PluginOption } from "vite"

import { name as pkgName } from "../package.json"
import { transform } from "./transform"

export { default as denyImports } from "./deny-imports"

export default (): PluginOption[] => {
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
  ]
}
