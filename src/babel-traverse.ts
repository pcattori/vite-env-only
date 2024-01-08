export type { NodePath } from "@babel/traverse"

// Avoid CJS-ESM default export interop differences across different tools
// https://github.com/babel/babel/issues/13855#issuecomment-945123514

import { createRequire } from "node:module"
const require = createRequire(import.meta.url)

// @ts-expect-error
import _traverse = require("@babel/traverse")
export const traverse = _traverse.default
