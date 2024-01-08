import * as recast from "recast"
import { parse as babelParse, type ParserOptions } from "@babel/parser"
import type { File } from "@babel/types"

export function parse(code: string, options: ParserOptions): File {
  return recast.parse(code, {
    parser: {
      parse: (code: string) => {
        return babelParse(code, { ...options, tokens: true })
      },
    },
  })
}

export function generate(ast: File): { code: string; map?: object } {
  return recast.print(ast, { sourceMapName: "map.json" })
}
