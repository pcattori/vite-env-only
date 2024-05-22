import { serverOnly$, clientOnly$ } from "vite-env-only/macros"

export default {
  server: serverOnly$(true) ?? false,
  client: clientOnly$(true) ?? false,
}
