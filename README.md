# vite-env-only

Minimal vite plugin for environment isolation via macros for client-only and server-only code.

## Installation

```sh
npm install -D vite-env-only
```

```ts
// vite.config.ts
import { defineConfig } from "vite"
import envOnly from "vite-env-only"

export default defineConfig({
  plugins: [envOnly()],
})
```

## Macros

### `server$`

```ts
declare const server$: <T>(_: T) => T | undefined
```

Marks an expression as server-only and replaces it with `undefined` on the client.
Keeps the expression as-is on the server.

```ts
import { server$ } from "vite-env-only"

export const message = server$("i only exist on the server")
```

On the server (`ssr: true`), this produces:

```ts
export const message = "i only exist on the server"
```

On the client (`ssr: false`), this produces:

```ts
export const message = undefined
```

### `client$`

```ts
declare const client$: <T>(_: T) => T | undefined
```

Marks an expression as client-only and replaces it with `undefined` on the server.
Keeps the expression as-is on the client.

```ts
import { client$ } from "vite-env-only"

export const message = client$("i only exist on the client")
```

On the server (`ssr: true`), this produces:

```ts
export const message = undefined
```

On the client (`ssr: false`), this produces:

```ts
export const message = "i only exist on the client"
```

## Dead-code elimination

After macro replacement, this plugin eliminates any unused variables.

```ts
import { server$, client$ } from "vite-env-only"
import { serverDep } from "server-dep"
import { clientDep } from "client-dep"

const serverValue = serverDep() + 1
const clientValue = clientDep() + 1

export const serverThing = server$(serverValue)
export const clientThing = client$(clientValue)
```

On the server (`ssr: true`), this produces:

```ts
import { serverDep } from "server-dep"

const serverValue = serverDep() + 1

export const serverThing = server$(serverValue)
export const clientThing = undefined
```

On the client (`ssr: false`), this produces:

```ts
import { clientDep } from "client-dep"

const clientValue = clientDep() + 1

export const serverThing = undefined
export const clientThing = client$(clientValue)
```

## Why?

Vite already provides [`import.meta.env.SSR`][vite-env-vars] which works in a similar way to this plugin in production.
However, in development Vite neither substitutes `import.meta.env.SSR` nor performs dead-code elimination as Vite considers these to be optimizations.

In general, its a bad idea to rely on optimizations for correctness.
In contrast, this plugin considers substitution and dead-code elimination to be part of its feature set.

Additionally, this plugin uses function calls to mark expressions as server-only or client-only.
That means it can _guarantee_ that code within its macros never ends up in the wrong environment while only transforming a single AST node type: function call expressions.

`import.meta.env.SSR` is instead a special identifier which can show up in many different AST node types: `if` statements, ternaries, `switch` statements, etc. which makes it easy to miss edge cases during dead-code elimination.

## Prior art

Thanks to these project for exploring environment isolation and transpilation conventions:

- [`esm-env`][esm-env]
- [Qwik][qwik]
- [TanStack `bling`][bling]

[vite-env-vars]: https://vitejs.dev/guide/env-and-mode#env-variables
[esm-env]: https://github.com/benmccann/esm-env
[qwik]: https://qwik.builder.io/
[bling]: https://github.com/TanStack/bling
