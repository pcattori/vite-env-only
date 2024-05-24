---
"vite-env-only": major
---

Separate named export for `denyImports` plugin that replaces the old `denyImports` and `denyFiles` options.

For example, if you had this:

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

You should now write it like so:

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

## `specifiers`

Replaces the old `denyImports` option from the old macros plugin.
Matching is performed against the raw import specifier in the source code.

## `files`

Replaces the old `denyFiles` option of the old macros plugin.
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
