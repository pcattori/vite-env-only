import { defineConfig } from "tsdown"

export default defineConfig([
  {
    entry: "src/index.ts",
    platform: "node",
    format: ["esm"],
  },
  {
    entry: "src/deny-imports.ts",
    platform: "node",
    format: ["esm"],
  },
  {
    entry: "src/macros.ts",
    platform: "neutral",
    format: ["esm"],
  },
])
