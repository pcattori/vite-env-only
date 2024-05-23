---
"vite-env-only": major
---

Change macros plugin to be a named export

```diff
-import envOnly from "vite-env-only"
+import { envOnlyMacros } from "vite-env-only"

export default {
  plugins: [
-    envOnly(),
+    envOnlyMacros(),
  ]
}
```
