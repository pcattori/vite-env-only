# vite-env-only

Vite plugin that provides macros for client-only and server-only code.

## Installation

```sh
npm install vite-env-only
```

```ts
// vite.config.ts
import { defineConfig } from "vite"
import EnvOnly from "vite-env-only"

export default defineConfig({
  plugins: [EnvOnly()],
})
```

## Macros

> [!WARNING]
> Macros must appear verbatim as `server$` and `client$` in the source code.
> If you assign different names to the macros, this plugin will not work.

### `server$`

```ts
declare const server$: <T>(x: T) => T | undefined
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
declare const client$: <T>(x: T) => T | undefined
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
