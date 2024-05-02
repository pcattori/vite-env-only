import { serverOnly$, clientOnly$ } from "vite-env-only"

export default {
  server: serverOnly$(true) || false,
  client: clientOnly$(true) || false,
}
