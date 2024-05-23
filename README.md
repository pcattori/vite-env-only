![ci workflow](https://github.com/pcattori/vite-env-only/actions/workflows/ci.yml/badge.svg)

# vite-env-only

Minimal Vite plugin for for isolating server-only and client-only code.

## Install

```sh
npm install -D vite-env-only
```

## Deny Imports

Prevents specific packages and files from being included in the client or server bundle
by throwing an error at build-time when a matching import would have been included.

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

### `specifiers`

Matching is performed against the raw import specifier in the source code.
Match patterns can be:

- String literal for exact matches
- Globs via [micromatch][micromatch]
- `RegExp`s

### `files`

Matching is performed against the resolved and normalized root-relative file path.
Match patterns can be:

- String literal for exact matches
- Globs via [micromatch][micromatch]
- `RegExp`s

## Macros

```ts
// vite.config.ts
import { defineConfig } from "vite"
import { envOnlyMacros } from "vite-env-only"

export default defineConfig({
  plugins: [envOnlyMacros()],
})
```

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
