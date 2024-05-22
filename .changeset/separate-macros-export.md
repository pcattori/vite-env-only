---
"vite-env-only": major
---

Export macros from `"vite-env-only/macros"` rather than `"vite-env-only"`

```diff
-import { serverOnly$, clientOnly$ } from "vite-env-only"
+import { serverOnly$, clientOnly$ } from "vite-env-only/macros"
```
