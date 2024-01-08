import { expect, test } from "vitest"
import dedent from "dedent"

import { generate, parse } from "./babel-recast"
import { eliminateUnusedVariables } from "./eliminate-unused-variables"

const dce = (source: string): string => {
  let ast = parse(source, { sourceType: "module" })
  eliminateUnusedVariables(ast)
  return generate(ast).code
}

test("imports / bare", () => {
  const source = dedent`
    import "side-effect"
  `
  const expected = dedent`
    import "side-effect"
  `
  expect(dce(source)).toBe(expected)
})

test("imports / named", () => {
  const source = dedent`
    import { a, _b } from "named"
    import { _c } from "named-unused"
    console.log(a)
  `
  const expected = dedent`
    import { a } from "named";
    console.log(a)
  `
  expect(dce(source)).toBe(expected)
})

test("imports / default", () => {
  const source = dedent`
    import a from "default-used"
    import _b from "default-unused"
    console.log(a)
  `
  const expected = dedent`
    import a from "default-used"
    console.log(a)
  `
  expect(dce(source)).toBe(expected)
})

test("imports / namespace", () => {
  const source = dedent`
    import * as a from "namespace-used"
    import * as _b from "namespace-unused"
    console.log(a)
  `
  const expected = dedent`
    import * as a from "namespace-used"
    console.log(a)
  `
  expect(dce(source)).toBe(expected)
})

test("function / declaration", () => {
  const source = dedent`
    export function a() {
      return
    }
    function _b() {
      return
    }
  `
  const expected = dedent`
    export function a() {
      return
    }
  `
  expect(dce(source)).toBe(expected)
})

test("function / expression", () => {
  const source = dedent`
    export const a = function () {
      return
    }
    const _b = function () {
      return
    }
  `
  const expected = dedent`
    export const a = function () {
      return
    }
  `
  expect(dce(source)).toBe(expected)
})

test("function / arrow", () => {
  const source = dedent`
    export const a = () => {
      return
    }
    const _b = () => {
      return
    }
  `
  const expected = dedent`
    export const a = () => {
      return
    }
  `
  expect(dce(source)).toBe(expected)
})

test("variable / identifier", () => {
  const source = dedent`
    const a = "a"
    const _b = "b"
    console.log(a)
  `
  const expected = dedent`
    const a = "a"
    console.log(a)
  `
  expect(dce(source)).toBe(expected)
})

test("variable / array pattern", () => {
  const source = dedent`
    const [a, _b] = c
    console.log(a)
  `
  const expected = dedent`
    const [a] = c
    console.log(a)
  `
  expect(dce(source)).toBe(expected)
})

test("variable / object pattern", () => {
  const source = dedent`
    const {a, _b} = c
    console.log(a)
  `
  const expected = dedent`
    const {
      a
    } = c
    console.log(a)
  `
  expect(dce(source)).toBe(expected)
})

test("repeated elimination", () => {
  const source = dedent`
    import { a } from "named"
    import b from "default"
    import * as c from "namespace"

    function d() {
      return [a, b, c]
    }

    const e = function () {
      return d()
    }

    const f = () => {
      return e()
    }

    const g = f()
    const [h] = g
    const { i } = g

    export const j = "j"
    console.log("k")
  `
  const expected = dedent`
    export const j = "j"
    console.log("k")
  `
  expect(dce(source)).toBe(expected)
})
