import { describe, expect, test } from "vitest"
import dedent from "dedent"

import { name as pkgName } from "../package.json"
import { transform } from "./transform"

const macros = ["server$", "client$"]

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

test("exactly one argument / server$", () => {
  const source = dedent`
    import { server$ } from "${pkgName}"

    export const message = server$()
  `
  expect(() => transform(source, { ssr: false })).toThrow(
    "'server$' must take exactly one argument",
  )
  expect(() => transform(source, { ssr: true })).toThrow(
    "'server$' must take exactly one argument",
  )
})

test("exactly one argument / client$", () => {
  const source = dedent`
    import { client$ } from "${pkgName}"

    export const message = client$()
  `
  expect(() => transform(source, { ssr: false })).toThrow(
    "'client$' must take exactly one argument",
  )
  expect(() => transform(source, { ssr: true })).toThrow(
    "'client$' must take exactly one argument",
  )
})

test("alias / server$", () => {
  const source = dedent`
    import { server$ as x } from "${pkgName}"

    export const message = x("server only")
  `
  expect(transform(source, { ssr: false })).toBe(dedent`
    export const message = undefined;
  `)
  expect(transform(source, { ssr: true })).toBe(dedent`
    export const message = "server only";
  `)
})

test("alias / client$", () => {
  const source = dedent`
    import { client$ as y } from "${pkgName}"

    export const message = y("client only")
  `
  expect(transform(source, { ssr: false })).toBe(dedent`
    export const message = "client only";
  `)
  expect(transform(source, { ssr: true })).toBe(dedent`
    export const message = undefined;
  `)
})

for (const macro of macros) {
  test(`no dynamic / ${macro}`, () => {
    const source = dedent`
    import { ${macro} as x } from "${pkgName}"

    const z = x

    export const message = z("server only")
  `
    expect(() => transform(source, { ssr: false })).toThrow(
      "'x' macro cannot be manipulated at runtime as it must be statically analyzable",
    )
    expect(() => transform(source, { ssr: true })).toThrow(
      "'x' macro cannot be manipulated at runtime as it must be statically analyzable",
    )
  })
}
