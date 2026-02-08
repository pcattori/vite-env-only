---
"vite-env-only": major
---

Replace `clientOnly$` and `serverOnly$` with `only`

Also, `/macros` export has been replaces with `/macro`

```ts
// BEFORE
import { clientOnly$, serverOnly$ } from "vite-env-only/macros"

export const clientThing = clientOnly$(1)
export const serverThing = clientOnly$(2)

// AFTER
import { only } from "vite-env-only/macro"

export const clientThing = only("client", 1)
export const serverThing = only("server", 2)
```
