import { expect, test } from "vitest"
import dedent from "dedent"

import { name as pkgName } from "../package.json"
import { transform } from "./transform"

test("elimination", () => {
  const source = dedent`
    import { server$, client$ } from "${pkgName}"
    import { a } from "server-only"
    import { b } from "client-only"

    const c = server$(a)
    console.log(c)

    const d = client$(b)
    console.log(d)
  `
  const expected = dedent`
    import { b } from "client-only";
    const c = undefined;
    console.log(c);
    const d = b;
    console.log(d);
  `
  expect(transform(source, { ssr: false })).toBe(expected)
})

test("no elimination when imported from different package", () => {
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
  expect(transform(source, { ssr: false })).toBe(expected)
})
