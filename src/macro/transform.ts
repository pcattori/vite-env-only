import * as babel from "@babel/core"
import { parse } from "@babel/parser"
import traverse, { type NodePath, type Binding } from "@babel/traverse"
import generate, { type GeneratorResult } from "@babel/generator"
import * as t from "@babel/types"

import pkg from "../../package.json"
import {
  deadCodeElimination,
  findReferencedIdentifiers,
} from "babel-dead-code-elimination"
import { Env, Envs } from "../env"

const MACRO_IMPORT_SPECIFIER = `${pkg.name}/macro`

export function transform(
  code: string,
  id: string,
  options: { env: Env },
): GeneratorResult {
  let ast = parse(code, { sourceType: "module" })

  // Workaround for `path.buildCodeFrameError`
  // See:
  // - https://github.com/babel/babel/issues/11889
  // - https://github.com/babel/babel/issues/11350#issuecomment-606169054
  // @ts-expect-error `@types/babel__core` is missing types for `File`
  new babel.File({ filename: undefined }, { code, ast })

  const refs = findReferencedIdentifiers(ast)

  traverse(ast, {
    CallExpression(path) {
      if (!isMacroCall(path)) return
      if (path.node.arguments.length !== 2) {
        throw path.buildCodeFrameError(
          `'only' macro must take exactly two arguments`,
        )
      }
      let [env, expr] = path.node.arguments
      if (!t.isStringLiteral(env)) {
        throw path.buildCodeFrameError(
          `'only' macro must take a string literal as the first argument`,
        )
      }
      if (!Envs.includes(env.value as Env)) {
        throw path.buildCodeFrameError(
          `environment must be one of: ${Envs.map((e) => `'${e}'`).join(", ")}`,
        )
      }

      if (!t.isExpression(expr)) {
        throw path.buildCodeFrameError(
          `'only' macro must take an expression as the second argument`,
        )
      }
      path.replaceWith(
        env.value === options.env ? expr : t.identifier("undefined"),
      )
    },

    // ensure that macro is not manipulated at runtime
    Identifier(path) {
      if (t.isImportSpecifier(path.parent)) return
      if (!isMacroIdentifier(path)) return
      if (t.isCallExpression(path.parent)) return
      throw path.buildCodeFrameError(
        `'${path.node.name}' macro cannot be manipulated at runtime as it must be statically analyzable`,
      )
    },

    ImportDeclaration(path) {
      if (path.node.source.value !== MACRO_IMPORT_SPECIFIER) return
      path.node.specifiers.forEach((specifier, i) => {
        if (t.isImportDefaultSpecifier(specifier)) {
          const subpath = path.get(`specifiers.${i}`)
          if (Array.isArray(subpath)) throw new Error("unreachable")
          throw subpath.buildCodeFrameError(
            `Default import is not supported by '${MACRO_IMPORT_SPECIFIER}'`,
          )
        }
        if (t.isImportNamespaceSpecifier(specifier)) {
          const subpath = path.get(`specifiers.${i}`)
          if (Array.isArray(subpath)) throw new Error("unreachable")
          throw subpath.buildCodeFrameError(
            `Namespace import is not supported by '${MACRO_IMPORT_SPECIFIER}'`,
          )
        }
      })
    },
  })
  deadCodeElimination(ast, refs)
  return generate(ast, { sourceMaps: true, sourceFileName: id }, code)
}

const isMacroBinding = (binding: Binding): boolean => {
  // import source
  if (!t.isImportDeclaration(binding.path.parent)) return false
  if (binding.path.parent.source.value !== MACRO_IMPORT_SPECIFIER) return false

  // import specifier
  if (!t.isImportSpecifier(binding.path.node)) return false
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

const isMacroCall = (path: NodePath<t.CallExpression>) => {
  let callee = path.get("callee")
  if (!callee.isIdentifier()) return false
  return isMacroIdentifier(callee)
}
