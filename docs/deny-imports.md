# Deny Imports

Prevents specific packages and files from being included in specific environment bundles
by throwing an error at build-time when a matching import would have been included.

## Setup

```ts
// vite.config.ts
import { defineConfig } from "vite"
import { denyImports } from "vite-env-only/deny-imports"

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

## Options

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
- Globs via [micromatch](https://github.com/micromatch/micromatch)
- `RegExp`s

**Examples:**

```ts
denyImports({
  client: {
    // Deny specific package
    specifiers: ["node:fs"],
    
    // Deny all node built-ins
    specifiers: [/^node:/],
    
    // Deny package pattern
    specifiers: ["@prisma/*"],
  },
})
```

### `files`

Matching is performed against the resolved and normalized root-relative file path.
Match patterns can be:

- String literal for exact matches
- Globs via [micromatch](https://github.com/micromatch/micromatch)
- `RegExp`s

**Examples:**

```ts
denyImports({
  client: {
    // Deny files in .server directories
    files: ["**/.server/*"],
    
    // Deny files with .server extension
    files: ["**/*.server.*"],
    
    // Combine multiple patterns
    files: ["**/.server/*", "**/*.server.*"],
  },
})
```

## Use Cases

### Prevent Server Code in Client Bundle

Ensure server-only dependencies don't accidentally end up in the client bundle:

```ts
denyImports({
  client: {
    specifiers: [
      /^node:/,           // All Node.js built-ins
      "prisma",           // Database client
      "@prisma/client",
      "dotenv",           // Environment variables
    ],
    files: [
      "**/.server/*",     // Convention: server-only files
      "**/*.server.*",
    ],
  },
})
```

### Prevent Client Code in Server Bundle

Useful for preventing large client-only libraries from bloating the server bundle:

```ts
denyImports({
  server: {
    specifiers: [
      "react-dom/client",  // Client-only React APIs
      "@tanstack/react-query", // Often only needed client-side
    ],
    files: [
      "**/.client/*",
      "**/*.client.*",
    ],
  },
})
```

## Error Messages

When a denied import is detected, you'll get a clear error message:

```
[vite-env-only] Import denied
 - Denied by specifier pattern: /^node:/
 - Importer: src/components/Header.tsx
 - Import: "node:fs"
 - Environment: client
```
