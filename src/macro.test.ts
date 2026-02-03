import { expect, test } from "vitest"

import { only } from "./macro"

test("unreplaced macro throws error", () => {
  expect(() => only("server", "hello")).toThrowError(/unreplaced macro/)
  expect(() => only("client", "world")).toThrowError(/unreplaced macro/)
})
