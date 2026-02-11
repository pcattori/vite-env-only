import pkg from "../../package.json"

export function only<Value>(_: Value): Value | undefined {
  throw Error(
    [
      `${pkg.name}: unreplaced macro`,
      "",
      `Did you forget to add the '${pkg.name}' plugin to your Vite config?`,
      "👉 https://github.com/pcattori/vite-env-only#install",
    ].join("\n"),
  )
}
