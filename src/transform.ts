import * as babel from "@babel/core"
import {
  generate,
  parse,
  traverse,
  t,
  type NodePath,
  type Binding,
} from "./babel"

import { name as pkgName } from "../package.json"
import { eliminateUnusedVariables } from "./eliminate-unused-variables"

const isMacroBinding = (binding: Binding, macro: string): boolean => {
  // import source
  if (!t.isImportDeclaration(binding?.path.parent)) return false
  if (binding.path.parent.source.value !== pkgName) return false

  // import specifier
  if (!t.isImportSpecifier(binding?.path.node)) return false
  let { imported } = binding.path.node
  if (!t.isIdentifier(imported)) return false
  if (imported.name !== macro) return false
  return true
}

const isMacro = (path: NodePath<t.CallExpression>, macro: string) => {
  if (!t.isIdentifier(path.node.callee)) return false
  let binding = path.scope.getBinding(path.node.callee.name)

  if (!binding) return false
  if (!isMacroBinding(binding, macro)) return false

  if (path.node.arguments.length !== 1) {
    throw path.buildCodeFrameError(`'${macro}' must take exactly one argument`)
  }
  return true
}

export const transform = (code: string, options: { ssr: boolean }): string => {
  let ast = parse(code, { sourceType: "module" })

  // Workaround for `path.buildCodeFrameError`
  // See:
  // - https://github.com/babel/babel/issues/11889
  // - https://github.com/babel/babel/issues/11350#issuecomment-606169054
  // @ts-expect-error `@types/babel__core` is missing types for `File`
  new babel.File({ filename: undefined }, { code, ast })

  traverse(ast, {
    CallExpression(path) {
      // env does not match
      // `macro$(expr)` -> `undefined`
      if (isMacro(path, options.ssr ? "client$" : "server$")) {
        path.replaceWith(t.identifier("undefined"))
      }
      // env matches
      // `macro$(expr)` -> `expr`
      if (isMacro(path, options.ssr ? "server$" : "client$")) {
        let arg = path.node.arguments[0]
        if (t.isExpression(arg)) {
          path.replaceWith(arg)
        }
      }
    },

    // ensure that macros are not manipulated at runtime
    Identifier(path) {
      if (t.isImportSpecifier(path.parent)) return

      let binding = path.scope.getBinding(path.node.name)
      if (!binding) return
      if (
        !isMacroBinding(binding, "server$") &&
        !isMacroBinding(binding, "client$")
      ) {
        return
      }
      if (t.isImportSpecifier(path.parent)) return
      throw path.buildCodeFrameError(
        `'${path.node.name}' macro cannot be manipulated at runtime as it must be statically analyzable`,
      )
    },

    // ensure that macros are not imported via namespace
    ImportDeclaration(path) {
      if (path.node.source.value !== pkgName) return
      path.node.specifiers.forEach((specifier, i) => {
        if (t.isImportNamespaceSpecifier(specifier)) {
          const subpath = path.get(`specifiers.${i}`)
          if (Array.isArray(subpath)) throw new Error("unreachable")
          throw subpath.buildCodeFrameError(
            `Namespace import is not supported by '${pkgName}'`,
          )
        }
      })
    },
  })
  eliminateUnusedVariables(ast)
  return generate(ast).code
}
