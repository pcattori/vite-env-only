import { defineConfig } from "tsdown"

export default defineConfig([
  {
    entry: "src/plugin.ts",
    platform: "node",
    format: ["esm"],
  },
  {
    entry: "src/env.ts",
    platform: "neutral",
    format: ["esm"],
  },
  {
    entry: "src/macro.ts",
    platform: "neutral",
    format: ["esm"],
  },
  {
    entry: "src/deny-imports.ts",
    platform: "node",
    format: ["esm"],
  },
])
