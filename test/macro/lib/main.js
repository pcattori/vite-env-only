import { only } from "vite-env-only/macro"

export default {
  server: only("server", true) ?? false,
  client: only("client", true) ?? false,
}
