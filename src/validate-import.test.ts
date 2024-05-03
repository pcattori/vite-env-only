import { describe, expect, test } from "vitest"
import { validateImport } from "./validate-import"
import path from "path"

function fromCwd(relativePath: string) {
  return path.join(process.cwd(), relativePath)
}

describe("validateImport", () => {
  describe("server", () => {
    describe("env: client", () => {
      test("failed string validation", () => {
        expect(() =>
          validateImport({
            id: "server-only",
            denyImports: {
              client: ["server-only"],
              server: [],
            },
            root: fromCwd("/"),
            importer: fromCwd("/path/to/importer.ts"),
            env: "client",
          })
        ).toThrowErrorMatchingInlineSnapshot(
          `
          [Error: Import denied in client environment
           - Import: "server-only"
           - Importer: path/to/importer.ts
           - Matcher: "server-only"]
        `
        )
      })

      test("failed regex validation", () => {
        expect(() =>
          validateImport({
            id: "../foo.server.ts",
            denyImports: {
              client: [/\.server/],
              server: [],
            },
            root: fromCwd("/"),
            importer: fromCwd("/path/to/importer.ts"),
            env: "client",
          })
        ).toThrowErrorMatchingInlineSnapshot(
          `
          [Error: Import denied in client environment
           - Import: "../foo.server.ts"
           - Importer: path/to/importer.ts
           - Matcher: /\\.server/]
        `
        )
      })

      test("passed validation", () => {
        expect(() =>
          validateImport({
            id: "some-other-module",
            denyImports: {
              client: ["server-only"],
              server: [],
            },
            root: fromCwd("/"),
            importer: fromCwd("/path/to/importer.ts"),
            env: "client",
          })
        ).not.toThrow()
      })
    })

    describe("env: server", () => {
      test("ignores server only modules", () => {
        expect(() =>
          validateImport({
            id: "server-only",
            denyImports: {
              client: ["server-only"],
              server: [],
            },
            root: fromCwd("/"),
            importer: fromCwd("/path/to/importer.ts"),
            env: "server",
          })
        ).not.toThrow()
      })
    })
  })

  describe("client", () => {
    describe("env: server", () => {
      test("failed string validation", () => {
        expect(() =>
          validateImport({
            id: "client-only",
            denyImports: {
              client: [],
              server: ["client-only"],
            },
            root: fromCwd("/"),
            importer: fromCwd("/path/to/importer.ts"),
            env: "server",
          })
        ).toThrowErrorMatchingInlineSnapshot(
          `
          [Error: Import denied in server environment
           - Import: "client-only"
           - Importer: path/to/importer.ts
           - Matcher: "client-only"]
        `
        )
      })

      test("failed regex validation", () => {
        expect(() =>
          validateImport({
            id: "../foo.client.ts",
            denyImports: {
              client: [],
              server: [/\.client/],
            },
            root: fromCwd("/"),
            importer: fromCwd("/path/to/importer.ts"),
            env: "server",
          })
        ).toThrowErrorMatchingInlineSnapshot(
          `
          [Error: Import denied in server environment
           - Import: "../foo.client.ts"
           - Importer: path/to/importer.ts
           - Matcher: /\\.client/]
        `
        )
      })

      test("passed validation", () => {
        expect(() =>
          validateImport({
            id: "some-other-module",
            denyImports: {
              client: [],
              server: ["client-only"],
            },
            root: fromCwd("/"),
            importer: fromCwd("/path/to/importer.ts"),
            env: "server",
          })
        ).not.toThrow()
      })
    })

    describe("env: client", () => {
      test("ignores client only modules", () => {
        expect(() =>
          validateImport({
            id: "client-only",
            denyImports: {
              client: [],
              server: ["client-only"],
            },
            root: fromCwd("/"),
            importer: fromCwd("/path/to/importer.ts"),
            env: "client",
          })
        ).not.toThrow()
      })
    })
  })
})
