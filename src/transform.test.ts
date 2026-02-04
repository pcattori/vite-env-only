import { describe, expect, test } from "vitest"
import dedent from "dedent"

import pkg from "../package.json"
import { transform } from "./transform"

const macroSpecifier = `${pkg.name}/macro`

describe('only("server", ...)', () => {
  const source = dedent`
    import { only } from "${macroSpecifier}"

    export const message = only("server", "server only")
  `

  test("ssr:true", () => {
    const expected = dedent`
      export const message = "server only";
    `
    expect(transform(source, "", { ssr: true }).code).toBe(expected)
  })

  test("ssr:false", () => {
    const expected = dedent`
      export const message = undefined;
    `
    expect(transform(source, "", { ssr: false }).code).toBe(expected)
  })
})

describe('only("client", ...)', () => {
  const source = dedent`
    import { only } from "${macroSpecifier}"

    export const message = only("client", "client only")
  `

  test("ssr:true", () => {
    const expected = dedent`
      export const message = undefined;
    `
    expect(transform(source, "", { ssr: true }).code).toBe(expected)
  })

  test("ssr:false", () => {
    const expected = dedent`
      export const message = "client only";
    `
    expect(transform(source, "", { ssr: false }).code).toBe(expected)
  })
})

describe("complex", () => {
  const source = dedent`
    import { only } from "${macroSpecifier}"
    import { a } from "server-only"
    import { b } from "client-only"

    export const c = only("server", "server only")
    const d = only("server", a)
    console.log(d)

    export const e = only("client", "client only")
    const f = only("client", b)
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
    expect(transform(source, "", { ssr: true }).code).toBe(expected)
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
    expect(transform(source, "", { ssr: false }).code).toBe(expected)
  })
})

test("exactly two arguments", () => {
  const source = dedent`
      import { only } from "${macroSpecifier}"

      export const message = only()
    `
  expect(() => transform(source, "", { ssr: false })).toThrow(
    `'only' must take exactly two arguments`
  )
})

test("alias", () => {
  const source = dedent`
      import { only as x } from "${macroSpecifier}"

      export const message = x("client", "hello")
    `
  expect(transform(source, "", { ssr: false }).code).toBe(
    `export const message = "hello";`
  )
  expect(transform(source, "", { ssr: true }).code).toBe(
    `export const message = undefined;`
  )
})

test("no dynamic", () => {
  const source = dedent`
      import { only as x } from "${macroSpecifier}"

      const z = x

      export const message = z("server", "server only")
    `
  for (const ssr of [false, true]) {
    expect(() => transform(source, "", { ssr })).toThrow(
      "'x' macro cannot be manipulated at runtime as it must be statically analyzable"
    )
  }
})

test("no namespace import", () => {
  const source = dedent`
    import * as envOnly from "${macroSpecifier}"

    export const message = envOnly.only("server", "server only")
  `
  expect(() => transform(source, "", { ssr: false })).toThrow(
    `Namespace import is not supported by '${macroSpecifier}'`
  )
})

test("only eliminate newly unreferenced identifiers", () => {
  const source = dedent`
    import { only } from "${macroSpecifier}"
      import { dep } from "dep"

      const compute = () => dep() + 1
      export const a = only("server", compute())

      const _compute = () => 1
      const _b = _compute()
    `
  const expected = dedent`
      export const a = undefined;
      const _compute = () => 1;
      const _b = _compute();
    `
  expect(transform(source, "", { ssr: false }).code).toBe(expected)
})
