export type { types as BabelTypes } from "@babel/core"
export { parse, type ParseResult } from "@babel/parser"
export type { NodePath } from "@babel/traverse"
export * as t from "@babel/types"

// Avoid CJS-ESM default export interop differences across different tools
// https://github.com/babel/babel/issues/13855#issuecomment-945123514

import { createRequire } from "node:module"
const require = createRequire(import.meta.url)

// @ts-expect-error
import _traverse = require("@babel/traverse")
export const traverse = _traverse.default

// @ts-expect-error
import _generate = require("@babel/generator")
export const generate = _generate.default
