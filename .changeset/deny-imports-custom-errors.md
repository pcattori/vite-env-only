---
"vite-env-only": minor
---

Add `DenyImportsSpecifierError` and `DenyImportsFileError` custom error types with structured, type-safe data in `details` field.

For example, if you are running Vite programmatically, you can now be precise about the errors you catch from `denyImports`.

```ts
import {
  DenyImportsSpecifierError,
  DenyImportsFileError,
} from "vite-env-only"

try {
  vite.build(/* ...config goes here... */)
} catch (err) {
  if (err instanceof DenyImportsSpecifierError) {
    err.details.pattern    // string | RegExp
    err.details.importer   // string
    err.details.import     // string
    err.details.env        // "server" | "client"
  }
  if (err instanceof DenyImportsFileError) {
    err.details.pattern    // string | RegExp
    err.details.importer   // string | undefined
    err.details.import     // string
    err.details.resolved   // string
    err.details.env        // "server" | "client"
  }
}
```
