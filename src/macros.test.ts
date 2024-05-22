import { expect, test } from "vitest"

import { serverOnly$, clientOnly$ } from "./macros"

test("unreplaced macro throws error", () => {
  expect(() => serverOnly$("hello")).toThrowError(/unreplaced macro/)
  expect(() => clientOnly$("world")).toThrowError(/unreplaced macro/)
})
