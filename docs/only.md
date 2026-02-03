# `only(env, value)`

Marks an expression as environment-specific. The expression is kept as-is in the specified environment
and replaced with `undefined` in all other environments.

## Setup

```ts
// vite.config.ts
import { defineConfig } from "vite"
import envOnly from "vite-env-only"

export default defineConfig({
  plugins: [envOnly()],
})
```

## Usage

```ts
import { only } from "vite-env-only/macro"

export const serverMessage = only("ssr", "i only exist on the server")
export const clientMessage = only("client", "i only exist on the client")
```

In the `client` environment this produces:

```ts
export const serverMessage = undefined
export const clientMessage = "i only exist on the client"
```

In the `ssr` environment this produces:

```ts
export const serverMessage = "i only exist on the server"
export const clientMessage = undefined
```

**Requirements:**
- The `env` parameter must be a string literal
- The build will fail if `env` is dynamic or not a string literal

## Environment Aliasing

Vite's default server environment is named `"ssr"`. To use `"server"` instead (or any other name), configure an alias:

```ts
// vite.config.ts
import { defineConfig } from "vite"
import envOnly from "vite-env-only"

export default defineConfig({
  plugins: [
    envOnly({
      alias: {
        server: "ssr",
      },
    }),
  ],
})
```

Now `only("server", value)` will work correctly with Vite's `ssr` environment.

## Custom Environments

Works with Vite's Environment API and custom environment names:

```ts
// vite.config.ts
import { defineConfig } from "vite"
import envOnly from "vite-env-only"

export default defineConfig({
  environments: {
    client: {},
    ssr: {},
    edge: {},
  },
  plugins: [envOnly()],
})
```

```ts
const edgeConfig = only("edge", { /* edge-specific config */ })
```

## Dead-code elimination

Eliminates any identifiers that become unreferenced as a result of replacement.

For example:

```ts
import { only } from "vite-env-only/macro"
import { readFile } from "node:fs"

function readConfig() {
  return JSON.parse(readFile.sync("./config.json", "utf-8"))
}

export const serverConfig = only("ssr", readConfig())
```

In the `client` environment this produces:

```ts
export const serverConfig = undefined
```

In the `ssr` environment this produces:

```ts
import { readFile } from "node:fs"

function readConfig() {
  return JSON.parse(readFile.sync("./config.json", "utf-8"))
}

export const serverConfig = readConfig()
```

## Type safety

The types capture that values can be `undefined` depending on the environment.

```ts
const API_KEY = only("ssr", "secret")
//    ^? string | undefined
```

To opt out of strict type safety, use a [non-null assertion](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#non-null-assertion-operator-postfix-) (`!`):

```ts
const API_KEY = only("ssr", "secret")!
//    ^? string
```

## Runtime Environment Override

For scripts that import shared utilities using `only`, you can manually specify the environment at runtime using `setEnv`.

This is useful when you have utility code that:
- Uses `only` to conditionally include environment-specific logic
- Is imported by both app code (where Vite determines the environment) and standalone scripts (where the environment is ambiguous)

```ts
// scripts/seed-db.ts
import { setEnv } from "vite-env-only/env"
import { seedDatabase } from "./utils/db"

// Specify this script runs in server environment
setEnv("ssr")

await seedDatabase()
```

```ts
// utils/db.ts
import { only } from "vite-env-only/macro"
import { PrismaClient } from "@prisma/client"

// This utility is used by both app code and scripts
export const db = only("ssr", new PrismaClient())

export async function seedDatabase() {
  // db is available because environment is "ssr"
  await db.user.create({ /* ... */ })
}
```

**Important:**
- Call `setEnv` at the entry point of your script, before importing any code that uses `only`
- This is a runtime-only API - it doesn't affect build-time transformation

## Why?

Vite provides [`import.meta.env.SSR`](https://vitejs.dev/guide/env-and-mode#env-variables) which works similarly in production.
However, in development Vite neither replaces `import.meta.env.SSR` nor performs dead-code elimination
as Vite considers these steps to be optimizations.

Relying on optimizations for correctness is problematic.
In contrast, `only` treats code replacement and dead-code elimination as part of its feature set.

Additionally, `only` uses function calls to mark expressions as environment-specific.
This guarantees that code within the function call never ends up in the wrong environment
while only transforming a single AST node type: function call expressions.

`import.meta.env.SSR` is a special identifier which can appear in many different AST node types:
`if` statements, ternaries, `switch` statements, etc.
This makes it far more challenging to guarantee complete dead-code elimination.
