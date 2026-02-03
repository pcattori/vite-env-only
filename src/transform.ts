import * as babel from "@babel/core"
import { parse } from "@babel/parser"
import traverse, { type NodePath, type Binding } from "@babel/traverse"
import generate, { type GeneratorResult } from "@babel/generator"
import * as t from "@babel/types"

import pkg from "../package.json"
import {
  deadCodeElimination,
  findReferencedIdentifiers,
} from "babel-dead-code-elimination"
import { Env } from "./env"

const macroSpecifier = `${pkg.name}/macro`

const isMacroBinding = (binding: Binding): boolean => {
  // import source
  if (!t.isImportDeclaration(binding?.path.parent)) return false
  if (binding.path.parent.source.value !== macroSpecifier) return false

  // import specifier
  if (!t.isImportSpecifier(binding?.path.node)) return false
  let { imported } = binding.path.node
  if (!t.isIdentifier(imported)) return false
  if (imported.name !== "only") return false
  return true
}

const isMacroIdentifier = (path: NodePath<t.Identifier>) => {
  let binding = path.scope.getBinding(path.node.name)
  if (!binding) return false
  return isMacroBinding(binding)
}

const isMacro = (path: NodePath<t.CallExpression>) => {
  const callee = path.get("callee")
  if (!callee.isIdentifier()) return false
  return isMacroIdentifier(callee)
}

export const transform = (
  code: string,
  id: string,
  options: { ssr: boolean }
): GeneratorResult => {
  let ast = parse(code, { sourceType: "module" })

  // Workaround for `path.buildCodeFrameError`
  // See:
  // - https://github.com/babel/babel/issues/11889
  // - https://github.com/babel/babel/issues/11350#issuecomment-606169054
  // @ts-expect-error `@types/babel__core` is missing types for `File`
  new babel.File({ filename: undefined }, { code, ast })

  const refs = findReferencedIdentifiers(ast)
  const ENV: Env = options.ssr ? "server" : "client"

  traverse(ast, {
    CallExpression(path) {
      if (!isMacro(path)) return

      if (path.node.arguments.length !== 2) {
        throw path.buildCodeFrameError(`'only' must take exactly two arguments`)
      }

      if (!t.isStringLiteral(path.node.arguments[0])) {
        throw path.buildCodeFrameError(
          `'only' must take a string literal as the first argument`
        )
      }
      let env = path.node.arguments[0].value

      // env does not match
      // `only(env, expr)` -> `undefined`
      if (env !== ENV) {
        path.replaceWith(t.identifier("undefined"))
        return
      }
      // env matches
      // `only(env, expr)` -> `expr`
      let expr = path.node.arguments[1]
      if (!t.isExpression(expr)) {
        throw path.buildCodeFrameError(
          `'only' must take an expression as the second argument`
        )
      }
      path.replaceWith(expr)
    },

    // ensure that macro is not manipulated at runtime
    Identifier(path) {
      if (t.isImportSpecifier(path.parent)) return
      if (!isMacroIdentifier(path)) return
      if (t.isCallExpression(path.parent)) return
      throw path.buildCodeFrameError(
        `'${path.node.name}' macro cannot be manipulated at runtime as it must be statically analyzable`
      )
    },

    // ensure that macro is not imported via namespace
    ImportDeclaration(path) {
      if (path.node.source.value !== macroSpecifier) return
      path.node.specifiers.forEach((specifier, i) => {
        if (t.isImportNamespaceSpecifier(specifier)) {
          const subpath = path.get(`specifiers.${i}`)
          if (Array.isArray(subpath)) throw new Error("unreachable")
          throw subpath.buildCodeFrameError(
            `Namespace import is not supported by '${macroSpecifier}'`
          )
        }
      })
    },
  })
  deadCodeElimination(ast, refs)
  return generate(ast, { sourceMaps: true, sourceFileName: id }, code)
}
