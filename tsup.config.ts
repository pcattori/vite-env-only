import { defineConfig } from "tsup"

export default defineConfig({
  entry: ["src/index.ts", "src/macros.ts"],
  format: ["esm", "cjs"],
  shims: true,
  dts: true,
  clean: true,
})
