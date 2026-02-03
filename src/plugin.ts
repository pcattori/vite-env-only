import { type PluginOption } from "vite"

import pkg from "../package.json"
import { transform } from "./transform"

export default function envOnly(): PluginOption[] {
  return [
    {
      name: "vite-env-only/macro",
      async transform(code, id, options) {
        if (!code.includes(pkg.name)) return
        return transform(code, id, { ssr: options?.ssr === true })
      },
    },
  ]
}
