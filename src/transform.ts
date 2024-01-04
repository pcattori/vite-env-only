import generate from "@babel/generator"
import { parse } from "@babel/parser"
import traverse from "@babel/traverse"
import * as t from "@babel/types"

import { name as pkgName } from "../package.json"
import { eliminateUnusedVariables } from "./eliminate-unused-variables"

export const transform = (source: string, macro: string): string => {
  let ast = parse(source, { sourceType: "module" })
  traverse(ast, {
    CallExpression(path) {
      if (!t.isIdentifier(path.node.callee, { name: macro })) return
      let binding = path.scope.getBinding(macro)
      if (!t.isImportDeclaration(binding?.path.parent)) return
      if (binding.path.parent.source.value !== pkgName) return
      path.replaceWith(t.identifier("undefined"))
    },
  })
  eliminateUnusedVariables(ast)
  return generate(ast).code
}
