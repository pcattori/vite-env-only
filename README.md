![ci workflow](https://github.com/pcattori/vite-env-only/actions/workflows/ci.yml/badge.svg)

# vite-env-only

Vite plugins for isolating environment-specific code across client, server, and custom environments.

Supports [Vite's Environment API](https://vite.dev/guide/api-environment).

## Install

```sh
npm install -D vite-env-only
```

## Quick Start

### `only(env, value)` - Environment-specific values

Keep expressions in one environment, replace with `undefined` in others.

```ts
// vite.config.ts
import { defineConfig } from "vite"
import envOnly from "vite-env-only"

export default defineConfig({
  plugins: [envOnly()],
})
```

```ts
// app code
import { only } from "vite-env-only/macro"

export const API_KEY = only("ssr", process.env.API_KEY)
export const analytics = only("client", { trackingId: "UA-12345" })
```

> [!TIP]
> Vite's default server environment is named `"ssr"`. To use `"server"` instead, configure an alias in `vite.config.ts`:
> ```ts
> envOnly({ alias: { server: "ssr" } })
> ```
> Then use your alias with `only` in your app code:
> ```ts
> export const API_KEY = only("server", process.env.API_KEY)
> ```

**Dead-code elimination** - Unreferenced code is automatically removed:

```ts
import { only } from "vite-env-only/macro"
import { readFileSync } from "node:fs"

const config = only("ssr", readFileSync("./config.json", "utf-8"))
```

On the client (or any non-`ssr` environement), that file is transformed into:

```ts
const config = undefined
```

**Type-safe** - Values are typed with `| undefined`:

```ts
const API_KEY = only("ssr", "secret")
//    ^? string | undefined
```

[→ Full documentation](./docs/only.md)

### `denyImports` - Prevent imports intended for other environments

Throw build errors when specific packages or files are imported in the wrong environment.

```ts
// vite.config.ts
import { defineConfig } from "vite"
import { denyImports } from "vite-env-only/deny-imports"

export default defineConfig({
  plugins: [
    denyImports({
      client: {
        specifiers: [/^node:/, "@prisma/client"],
        files: ["**/*.server.*"],
      },
    }),
  ],
})
```

[→ Full documentation](./docs/deny-imports.md)

## Prior art

Thanks to these projects for exploring environment isolation and conventions for transpilation:

- [`esm-env`](https://github.com/benmccann/esm-env)
- [Qwik](https://qwik.builder.io/)
- [TanStack `bling`](https://github.com/TanStack/bling)
