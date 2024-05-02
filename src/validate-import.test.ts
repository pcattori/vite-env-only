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
            imports: {
              server: ["server-only"],
              client: [],
            },
            root: fromCwd("/"),
            importer: fromCwd("/path/to/importer.ts"),
            env: "client",
          })
        ).toThrowErrorMatchingInlineSnapshot(
          `[Error: Import from "server-only" in "path/to/importer.ts" is not allowed in the client module graph]`
        )
      })

      test("failed regex validation", () => {
        expect(() =>
          validateImport({
            id: "../foo.server.ts",
            imports: {
              server: [/\.server/],
              client: [],
            },
            root: fromCwd("/"),
            importer: fromCwd("/path/to/importer.ts"),
            env: "client",
          })
        ).toThrowErrorMatchingInlineSnapshot(
          `[Error: Import from "../foo.server.ts" in "path/to/importer.ts" is not allowed in the client module graph]`
        )
      })

      test("failed validation without importer", () => {
        expect(() =>
          validateImport({
            id: "server-only",
            imports: {
              server: ["server-only"],
              client: [],
            },
            root: fromCwd("/"),
            importer: undefined,
            env: "client",
          })
        ).toThrowErrorMatchingInlineSnapshot(
          `[Error: Import from "server-only" is not allowed in the client module graph]`
        )
      })

      test("passed validation", () => {
        expect(() =>
          validateImport({
            id: "some-other-module",
            imports: {
              server: ["server-only"],
              client: [],
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
            imports: {
              server: ["server-only"],
              client: [],
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
            imports: {
              server: [],
              client: ["client-only"],
            },
            root: fromCwd("/"),
            importer: fromCwd("/path/to/importer.ts"),
            env: "server",
          })
        ).toThrowErrorMatchingInlineSnapshot(
          `[Error: Import from "client-only" in "path/to/importer.ts" is not allowed in the server module graph]`
        )
      })

      test("failed regex validation", () => {
        expect(() =>
          validateImport({
            id: "../foo.client.ts",
            imports: {
              server: [],
              client: [/\.client/],
            },
            root: fromCwd("/"),
            importer: fromCwd("/path/to/importer.ts"),
            env: "server",
          })
        ).toThrowErrorMatchingInlineSnapshot(
          `[Error: Import from "../foo.client.ts" in "path/to/importer.ts" is not allowed in the server module graph]`
        )
      })

      test("failed validation without importer", () => {
        expect(() =>
          validateImport({
            id: "client-only",
            imports: {
              server: [],
              client: ["client-only"],
            },
            root: fromCwd("/"),
            importer: undefined,
            env: "server",
          })
        ).toThrowErrorMatchingInlineSnapshot(
          `[Error: Import from "client-only" is not allowed in the server module graph]`
        )
      })

      test("passed validation", () => {
        expect(() =>
          validateImport({
            id: "some-other-module",
            imports: {
              server: [],
              client: ["client-only"],
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
            imports: {
              server: [],
              client: ["client-only"],
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
