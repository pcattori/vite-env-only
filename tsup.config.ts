import { defineConfig } from "tsup"

export default defineConfig({
  entry: ["src/index.ts", "src/macros.ts"],
  format: ["esm"],
  dts: true,
  clean: true,
})
