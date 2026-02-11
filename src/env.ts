export const Envs = ["server", "client"] as const
export type Env = (typeof Envs)[number]
