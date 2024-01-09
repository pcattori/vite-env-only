import { expect, test } from "vitest"

import { serverOnly$, clientOnly$ } from "./macro"

test("unreplaced macro throws error", () => {
  expect(() => serverOnly$("hello")).toThrowError(/unreplaced macro/)
  expect(() => clientOnly$("world")).toThrowError(/unreplaced macro/)
})
