![ci workflow](https://github.com/pcattori/vite-env-only/actions/workflows/ci.yml/badge.svg)

# vite-env-only

Minimal Vite plugin for for isolating server-only and client-only code.

## Install

```sh
npm install -D vite-env-only
```

## Setup

```ts
// vite.config.ts
import { defineConfig } from "vite"
import envOnly from "vite-env-only"

export default defineConfig({
  plugins: [envOnly()],
})
```

## Options

### `denyImports`

Configures validation of import specifiers that should not be present on the client or server.
Validation is performed against the raw import specifier in the source code.
Uses [micromatch][micromatch] for pattern matching globs.

```ts
{
  denyImports?: {
    client?: Array<string | RegExp>,
    server?: Array<string | RegExp>
  }
}
```

For example:

```ts
// vite.config.ts
import { defineConfig } from "vite"
import envOnly from "vite-env-only"

export default defineConfig({
  plugins: [
    envOnly({
      denyImports: {
        client: ["fs-extra", /^node:/],
      },
    }),
  ],
})
```

### `denyFiles`

Configures validation of files that should not be present on the client or server.
Validation is performed against the resolved and normalized root-relative file path.
Uses [micromatch][micromatch] for pattern matching globs.

```ts
{
  denyFiles?: {
    client?: Array<string | RegExp>,
    server?: Array<string | RegExp>
  }
}
```

For example:

```ts
// vite.config.ts
import { defineConfig } from "vite"
import envOnly from "vite-env-only"

export default defineConfig({
  plugins: [
    envOnly({
      denyFiles: {
        client: [
          // Deny all files with a `.server` suffix
          "**/*.server.*",
          // Deny all files nested within a `.server` directory
          "**/.server/**/*",
          // Deny a specific file
          "src/secrets.ts",
        ],
      },
    }),
  ],
})
```

## Macros

All macros can be imported within your app code from `"vite-env-only/macros"`.

### `serverOnly$`

Marks an expression as server-only and replaces it with `undefined` on the client.
Keeps the expression as-is on the server.

For example:

```ts
import { serverOnly$ } from "vite-env-only/macros"

export const message = serverOnly$("i only exist on the server")
```

On the client this produces:

```ts
export const message = undefined
```

On the server this produces:

```ts
export const message = "i only exist on the server"
```

### `clientOnly$`

Marks an expression as client-only and replaces it with `undefined` on the server.
Keeps the expression as-is on the client.

For example:

```ts
import { clientOnly$ } from "vite-env-only/macros"

export const message = clientOnly$("i only exist on the client")
```

On the client this produces:

```ts
export const message = "i only exist on the client"
```

On the server this produces:

```ts
export const message = undefined
```

### Dead-code elimination

This plugin eliminates any identifiers that become unreferenced as a result of macro replacement.

For example, given the following usage of `serverOnly$`:

```ts
import { serverOnly$ } from "vite-env-only/macros"
import { readFile } from "node:fs"

function readConfig() {
  return JSON.parse(readFile.sync("./config.json", "utf-8"))
}

export const serverConfig = serverOnly$(readConfig())
```

On the client this produces:

```ts
export const serverConfig = undefined
```

On the server this produces:

```ts
import { readFile } from "node:fs"

function readConfig() {
  return JSON.parse(readFile.sync("./config.json", "utf-8"))
}

export const serverConfig = readConfig()
```

### Type safety

The macro types capture the fact that values can be `undefined` depending on the environment.

For example:

```ts
import { serverOnly$ } from "vite-env-only/macros"

export const API_KEY = serverOnly$("secret")
//           ^? string | undefined
```

If you want to opt out of strict type safety, you can use a [non-null assertion][ts-non-null] (`!`):

```ts
import { serverOnly$ } from "vite-env-only/macros"

export const API_KEY = serverOnly$("secret")!
//           ^? string
```

### Why?

Vite already provides [`import.meta.env.SSR`][vite-env-vars] which works in a similar way to these macros in production.
However, in development Vite neither replaces `import.meta.env.SSR` nor performs dead-code elimination as Vite considers these steps to be optimizations.

In general, its a bad idea to rely on optimizations for correctness.
In contrast, these macros treat code replacement and dead-code elimination as part of their feature set.

Additionally, these macros use function calls to mark expressions as server-only or client-only.
That means they can _guarantee_ that code within the function call never ends up in the wrong environment while only transforming a single AST node type: function call expressions.

`import.meta.env.SSR` is instead a special identifier which can show up in many different AST node types: `if` statements, ternaries, `switch` statements, etc.
This makes it far more challenging to guarantee that dead-code completely eliminated.

## Prior art

Thanks to these project for exploring environment isolation and conventions for transpilation:

- [`esm-env`][esm-env]
- [Qwik][qwik]
- [TanStack `bling`][bling]

[vite-env-vars]: https://vitejs.dev/guide/env-and-mode#env-variables
[esm-env]: https://github.com/benmccann/esm-env
[qwik]: https://qwik.builder.io/
[bling]: https://github.com/TanStack/bling
[bling]: https://github.com/TanStack/bling
[ts-non-null]: https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#non-null-assertion-operator-postfix-
[micromatch]: https://github.com/micromatch/micromatch
