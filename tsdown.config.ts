import { defineConfig } from "tsdown"

export default defineConfig([
  {
    entry: "src/macro/plugin.ts",
    platform: "node",
    format: ["esm"],
  },
  {
    entry: "src/macro/export.ts",
    platform: "neutral",
    format: ["esm"],
  },
  {
    entry: "src/deny-imports.ts",
    platform: "node",
    format: ["esm"],
  },
])
