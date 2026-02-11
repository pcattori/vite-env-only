import pkg from "../../package.json"

import { type PluginOption } from "vite"
import { transform } from "./transform"

export function envOnly(): PluginOption[] {
  return [
    {
      name: "env-only-macro",
      async transform(code, id, options) {
        if (!code.includes(pkg.name)) return
        return transform(code, id, { env: options?.ssr ? "server" : "client" })
      },
    },
  ]
}
