# vite-env-only

Vite plugin that provides macros for client-only and server-only code.

## Usage

```ts
// vite.config.ts
import { defineConfig } from "vite"
import envOnly from "vite-env-only"

export default defineConfig({
  plugins: [envOnly()],
})
```

```ts
// app/something.ts
import { client$, server$ } from "vite-env-only"
import { clientThing } from "client-thing"
import { serverThing } from "server-thing"

export const a = client$(clientThing)
export const b = server$(serverThing)
```

> [!WARNING]
> Both `client$` and `server$` are macros, so they must appear _exactly_ like that in your code.
> If you try to rename them, this plugin will not work.

On the client (`ssr: false`), this produces:

```ts
// app/something.ts
import { client$ } from "vite-env-only"
import { clientThing } from "client-thing"

export const a = client$(clientThing)
```

On the server (`ssr: true`), this produces:

```ts
// app/something.ts
import { server$ } from "vite-env-only"
import { serverThing } from "server-thing"

export const b = server$(serverThing)
```
