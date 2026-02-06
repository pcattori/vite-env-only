---
"vite-env-only": major
---

Move `denyImports` to `/deny-imports` subexport.

For example, in `vite.config.ts`:

```ts
// BEFORE
import { denyImports } from "vite-env-only"

// AFTER
import { denyImports } from "vite-env-only/deny-imports"
```
