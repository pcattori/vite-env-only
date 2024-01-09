import { describe, expect, test } from "vitest"
import dedent from "dedent"

import { name as pkgName } from "../package.json"
import { transform } from "./transform"

const macros = ["serverOnly$", "clientOnly$"] as const

describe("serverOnly$", () => {
  const source = dedent`
    import { serverOnly$ } from "${pkgName}"

    export const message = serverOnly$("server only")
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

describe("clientOnly$", () => {
  const source = dedent`
    import { clientOnly$ } from "${pkgName}"

    export const message = clientOnly$("client only")
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
    import { serverOnly$, clientOnly$ } from "${pkgName}"
    import { a } from "server-only"
    import { b } from "client-only"

    export const c = serverOnly$("server only")
    const d = serverOnly$(a)
    console.log(d)

    export const e = clientOnly$("client only")
    const f = clientOnly$(b)
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

for (const macro of macros) {
  test(`exactly one argument / ${macro}`, () => {
    const source = dedent`
      import { ${macro} } from "${pkgName}"

      export const message = ${macro}()
    `
    for (const ssr of [false, true]) {
      expect(() => transform(source, { ssr })).toThrow(
        `'${macro}' must take exactly one argument`,
      )
    }
  })
}

for (const macro of macros) {
  test(`alias / ${macro}`, () => {
    const source = dedent`
      import { ${macro} as x } from "${pkgName}"

      export const message = x("hello")
    `
    expect(transform(source, { ssr: false })).toBe(
      macro === "serverOnly$"
        ? `export const message = undefined;`
        : `export const message = "hello";`,
    )
    expect(transform(source, { ssr: true })).toBe(
      macro === "serverOnly$"
        ? `export const message = "hello";`
        : `export const message = undefined;`,
    )
  })
}

for (const macro of macros) {
  test(`no dynamic / ${macro}`, () => {
    const source = dedent`
      import { ${macro} as x } from "${pkgName}"

      const z = x

      export const message = z("server only")
    `
    for (const ssr of [false, true]) {
      expect(() => transform(source, { ssr })).toThrow(
        "'x' macro cannot be manipulated at runtime as it must be statically analyzable",
      )
    }
  })
}

test("no namespace import", () => {
  for (const macro of macros) {
    const source = dedent`
      import * as envOnly from "${pkgName}"

      export const message = envOnly.${macro}("server only")
    `
    for (const ssr of [false, true]) {
      expect(() => transform(source, { ssr })).toThrow(
        `Namespace import is not supported by '${pkgName}'`,
      )
    }
  }
})

test("only eliminate newly unreferenced identifiers", () => {
  for (const macro of macros) {
    const source = dedent`
      import { ${macro} } from "${pkgName}"
      import { dep } from "dep"

      const compute = () => dep() + 1
      export const a = ${macro}(compute())

      const _compute = () => 1
      const _b = _compute()
    `
    const expected = dedent`
      export const a = undefined;
      const _compute = () => 1;
      const _b = _compute();
    `
    expect(
      transform(source, { ssr: macro === "serverOnly$" ? false : true }),
    ).toBe(expected)
  }
})
