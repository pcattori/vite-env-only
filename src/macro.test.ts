import { expect, test } from "vitest"

import { server$, client$ } from "./macro"

test("unreplaced macro throws error", () => {
  expect(() => server$("hello")).toThrowError(/unreplaced macro/)
  expect(() => client$("world")).toThrowError(/unreplaced macro/)
})
