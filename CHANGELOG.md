# vite-env-only

## 3.0.3

### Patch Changes

- 2b5d238: Better dead code elimination

  Upgrading to babel-dead-code-elimination@1.0.6 as it contains fixes for function parameters.

## 3.0.2

### Patch Changes

- 69d739d: Better dead code elimination

  Upgrading to babel-dead-code-eliminiation@1.0.5 as it contains fixes for:

  - Object destructuring
  - Array destructuring
  - Function expressions
  - Arrow function expressions

## 3.0.1

### Patch Changes

- 02c683a: Allow call expressions in macro identifier validation

  Previously, the code had duplicated checks for allowing macro within import specifiers.
  This was always meant to be a check for import specifiers _and_ a check for a call expression.

## 3.0.0

### Major Changes

- a46e247: Rather than ship as a monolithic plugin, we've split up `vite-env-only` into two separate plugins: `envOnlyMacros` and `denyImports`.
  These are both named exports of `vite-env-only`; the default export has been removed.
  This makes it easy to tell if you app is relying on macros, import denial, or both.

  Additionally, we've changed the macros themselves to come from `vite-env-only/macros` to more clearly separate
  `vite-env-only` plugins (for use in your `vite.config.ts`) and `vite-env-only` macros (for use in your app code).

  ## Migrating macros

  👉 In your `vite.config.ts`, replace the default import with the `envOnlyMacros` named import:

  ```diff
  -import envOnly from "vite-env-only"
  +import { envOnlyMacros } from "vite-env-only"

  export default {
    plugins: [
  -    envOnly(),
  +    envOnlyMacros(),
    ]
  }
  ```

  👉 In your app code, replace your macro imports to use the new `/macros` export:

  ```diff
  -import { serverOnly$ } from "vite-env-only"
  +import { serverOnly$ } from "vite-env-only/macros"
  ```

  ## Migrating `denyImports` + `denyFiles`

  The new `denyImports` plugin replaces the old `denyImports` and `denyFiles` options.
  Both of these options denied imports:

  - `denyImports` denied imports with specific _import specifiers_
  - `denyFiles` denied imports that resolved to specific _files_

  Additionally, neither of these options had anything to do with macros.
  But there wasn't a way to configure `vite-env-only` for import denial without also _implicitly_ setting up its macros.

  The new `denyImports` named export is a new plugin replaces these options.

  The `specifiers` option replaces the old `denyImports` option.
  Matching is performed against the raw import specifier in the source code.

  The `files` option replaces the old `denyFiles` option.
  Matching is performed against the resolved and normalized root-relative file path.

  ```ts
  {
    client?: {
      specifiers?: Array<string | RegExp>,
      files?: Array<string | RegExp>
    },
    server?: {
      specifiers?: Array<string | RegExp>,
      files?: Array<string | RegExp>
    }
  }
  ```

  👉 In your `vite.config.ts`, replace the `envOnly` plugin with the `denyImports` plugin.

  For example:

  ```ts
  // vite.config.ts
  import { defineConfig } from "vite"
  import envOnly from "vite-env-only"

  export default defineConfig({
    plugins: [
      envOnly({
        denyImports: {
          client: ["fs-extra", /^node:/, "@prisma/*"],
          server: ["jquery"],
        },
        denyFiles: {
          client: ["**/.server/*", "**/*.server.*"],
        },
      }),
    ],
  })
  ```

  Should now be written as:

  ```ts
  // vite.config.ts
  import { defineConfig } from "vite"
  import { denyImports } from "vite-env-only"

  export default defineConfig({
    plugins: [
      denyImports({
        client: {
          specifiers: ["fs-extra", /^node:/, "@prisma/*"],
          files: ["**/.server/*", "**/*.server.*"],
        },
        server: {
          specifiers: ["jquery"],
        },
      }),
    ],
  })
  ```

  🚨 **Macros are not enabled** by the `denyImports` plugin. 🚨
  If you also wanted to use macros, be sure to explicitly add the `envOnlyMacros` plugin to your `vite.config.ts`.

## 2.4.1

### Patch Changes

- 4f87331: Use default import from micromatch to fix ESM build error

## 2.4.0

### Minor Changes

- 25a324d: Allow globs for `denyImports` and `denyFiles`

  Using [micromatch](https://github.com/micromatch/micromatch) for pattern matching
