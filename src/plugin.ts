import { type PluginOption } from "vite"

import pkg from "../package.json"
import { transform } from "./transform"

export default function envOnly(): PluginOption[] {
  return [
    {
      name: "vite-env-only/macro",
      async transform(code, id, options) {
        if (!code.includes(pkg.name)) return
        if (id === `${pkg.name}/env`) {
          throw Error(
            [
              `${pkg.name}: '${pkg.name}/env' is not allowed within Vite`,
              "",
              `'${pkg.name}/env' is designed for use in script entry points, not within app code`,
              "👉 https://github.com/pcattori/vite-env-only#env",
            ].join("\n")
          )
        }
        return transform(code, id, { ssr: options?.ssr === true })
      },
    },
  ]
}
