import { expect, test } from "vitest"
import dedent from "dedent"

import { name as pkgName } from "../package.json"
import { transform } from "./transform"

test("macro / elimination", () => {
  const source = dedent`
    import { server$ } from "${pkgName}"
    import { a } from "server-only"

    const b = server$(a)
    console.log(b)
  `
  const expected = dedent`
    const b = undefined;
    console.log(b);
  `
  expect(transform(source, "server$")).toBe(expected)
})

test("macro / no elimination when imported from different package", () => {
  const source = dedent`
    import { server$ } from "something-else"
    import { a } from "dep"

    const b = server$(a)
    console.log(b)
  `
  const expected = dedent`
    import { server$ } from "something-else";
    import { a } from "dep";
    const b = server$(a);
    console.log(b);
  `
  expect(transform(source, "server$")).toBe(expected)
})
