import { describe, expect, test } from "vitest"
import dedent from "dedent"

import { name as pkgName } from "../package.json"
import { transform } from "./transform"

describe("server$", () => {
  const source = dedent`
    import { server$ } from "${pkgName}"

    export const message = server$("server only")
  `

  test("ssr:true", () => {
    const expected = dedent`
      export const message = "server only";
    `
    expect(transform(source, { ssr: true })).toBe(expected)
  })

  test("ssr:false", () => {
    const expected = dedent`
      export const message = undefined;
    `
    expect(transform(source, { ssr: false })).toBe(expected)
  })
})

describe("client$", () => {
  const source = dedent`
    import { client$ } from "${pkgName}"

    export const message = client$("client only")
  `

  test("ssr:true", () => {
    const expected = dedent`
      export const message = undefined;
    `
    expect(transform(source, { ssr: true })).toBe(expected)
  })

  test("ssr:false", () => {
    const expected = dedent`
      export const message = "client only";
    `
    expect(transform(source, { ssr: false })).toBe(expected)
  })
})

describe("complex", () => {
  const source = dedent`
    import { server$, client$ } from "${pkgName}"
    import { a } from "server-only"
    import { b } from "client-only"

    export const c = server$("server only")
    const d = server$(a)
    console.log(d)

    export const e = client$("client only")
    const f = client$(b)
    console.log(f)
  `

  test("ssr:true", () => {
    const expected = dedent`
      import { a } from "server-only";
      export const c = "server only";
      const d = a;
      console.log(d);
      export const e = undefined;
      const f = undefined;
      console.log(f);
    `
    expect(transform(source, { ssr: true })).toBe(expected)
  })
  test("ssr:false", () => {
    const expected = dedent`
      import { b } from "client-only";
      export const c = undefined;
      const d = undefined;
      console.log(d);
      export const e = "client only";
      const f = b;
      console.log(f);
    `
    expect(transform(source, { ssr: false })).toBe(expected)
  })
})
