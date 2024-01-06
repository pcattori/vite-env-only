// Adapted from https://github.com/egoist/babel-plugin-eliminator/blob/d29859396b7708b7f7abbacdd951cbbc80902f00/src/index.ts

import {
  traverse,
  t,
  type NodePath,
  type BabelTypes,
  ParseResult,
} from "./babel"

function getIdentifier(
  path: NodePath<
    | BabelTypes.FunctionDeclaration
    | BabelTypes.FunctionExpression
    | BabelTypes.ArrowFunctionExpression
  >,
): NodePath<BabelTypes.Identifier> | null {
  let parentPath = path.parentPath
  if (parentPath.type === "VariableDeclarator") {
    let variablePath = parentPath as NodePath<BabelTypes.VariableDeclarator>
    let name = variablePath.get("id")
    return name.node.type === "Identifier"
      ? (name as NodePath<BabelTypes.Identifier>)
      : null
  }

  if (parentPath.type === "AssignmentExpression") {
    let variablePath = parentPath as NodePath<BabelTypes.AssignmentExpression>
    let name = variablePath.get("left")
    return name.node.type === "Identifier"
      ? (name as NodePath<BabelTypes.Identifier>)
      : null
  }

  if (path.node.type === "ArrowFunctionExpression") {
    return null
  }

  return path.node.id && path.node.id.type === "Identifier"
    ? (path.get("id") as NodePath<BabelTypes.Identifier>)
    : null
}

function isIdentifierReferenced(
  ident: NodePath<BabelTypes.Identifier>,
): boolean {
  let binding = ident.scope.getBinding(ident.node.name)
  if (binding?.referenced) {
    // Functions can reference themselves, so we need to check if there's a
    // binding outside the function scope or not.
    if (binding.path.type === "FunctionDeclaration") {
      return !binding.constantViolations
        .concat(binding.referencePaths)
        // Check that every reference is contained within the function:
        .every((ref) => ref.findParent((parent) => parent === binding?.path))
    }

    return true
  }
  return false
}

export const eliminateUnusedVariables = (ast: ParseResult<BabelTypes.File>) => {
  let referencesRemovedInThisPass: number

  let sweepFunction = (
    path: NodePath<
      | BabelTypes.FunctionDeclaration
      | BabelTypes.FunctionExpression
      | BabelTypes.ArrowFunctionExpression
    >,
  ) => {
    let identifier = getIdentifier(path)
    if (identifier?.node && !isIdentifierReferenced(identifier)) {
      ++referencesRemovedInThisPass

      if (
        t.isAssignmentExpression(path.parentPath.node) ||
        t.isVariableDeclarator(path.parentPath.node)
      ) {
        path.parentPath.remove()
      } else {
        path.remove()
      }
    }
  }

  let sweepImport = (
    path: NodePath<
      | BabelTypes.ImportSpecifier
      | BabelTypes.ImportDefaultSpecifier
      | BabelTypes.ImportNamespaceSpecifier
    >,
  ) => {
    let local = path.get("local")
    if (!isIdentifierReferenced(local)) {
      ++referencesRemovedInThisPass
      path.remove()
      if (
        (path.parent as BabelTypes.ImportDeclaration).specifiers.length === 0
      ) {
        path.parentPath.remove()
      }
    }
  }

  // Traverse again to remove unused references. This happens at least once,
  // then repeats until no more references are removed.
  do {
    referencesRemovedInThisPass = 0

    traverse(ast, {
      Program(path) {
        path.scope.crawl()
      },
      // eslint-disable-next-line no-loop-func
      VariableDeclarator(variablePath) {
        if (variablePath.node.id.type === "Identifier") {
          let local = variablePath.get("id") as NodePath<BabelTypes.Identifier>
          if (!isIdentifierReferenced(local)) {
            ++referencesRemovedInThisPass
            variablePath.remove()
          }
        } else if (variablePath.node.id.type === "ObjectPattern") {
          let pattern = variablePath.get(
            "id",
          ) as NodePath<BabelTypes.ObjectPattern>

          let beforeCount = referencesRemovedInThisPass
          let properties = pattern.get("properties")
          properties.forEach((property) => {
            let local = property.get(
              property.node.type === "ObjectProperty"
                ? "value"
                : property.node.type === "RestElement"
                  ? "argument"
                  : (function () {
                      throw new Error("invariant")
                    })(),
            ) as NodePath<BabelTypes.Identifier>

            if (!isIdentifierReferenced(local)) {
              ++referencesRemovedInThisPass
              property.remove()
            }
          })

          if (
            beforeCount !== referencesRemovedInThisPass &&
            pattern.get("properties").length < 1
          ) {
            variablePath.remove()
          }
        } else if (variablePath.node.id.type === "ArrayPattern") {
          let pattern = variablePath.get(
            "id",
          ) as NodePath<BabelTypes.ArrayPattern>

          let beforeCount = referencesRemovedInThisPass
          let elements = pattern.get("elements")
          elements.forEach((e) => {
            let local: NodePath<BabelTypes.Identifier>
            if (e.node?.type === "Identifier") {
              local = e as NodePath<BabelTypes.Identifier>
            } else if (e.node?.type === "RestElement") {
              local = e.get("argument") as NodePath<BabelTypes.Identifier>
            } else {
              return
            }

            if (!isIdentifierReferenced(local)) {
              ++referencesRemovedInThisPass
              e.remove()
            }
          })

          if (
            beforeCount !== referencesRemovedInThisPass &&
            pattern.get("elements").length < 1
          ) {
            variablePath.remove()
          }
        }
      },
      FunctionDeclaration: sweepFunction,
      FunctionExpression: sweepFunction,
      ArrowFunctionExpression: sweepFunction,
      ImportSpecifier: sweepImport,
      ImportDefaultSpecifier: sweepImport,
      ImportNamespaceSpecifier: sweepImport,
    })
  } while (referencesRemovedInThisPass)
}
