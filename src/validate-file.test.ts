import { describe, expect, test } from "vitest"
import { validateFile } from "./validate-file"
import path from "path"

function fromCwd(relativePath: string) {
  return path.join(process.cwd(), relativePath)
}

describe("validateFile", () => {
  describe("server", () => {
    describe("env: client", () => {
      test("failed string validation", () => {
        expect(() =>
          validateFile({
            absolutePath: fromCwd("/lib/server-only.ts"),
            denyFiles: {
              client: ["lib/server-only.ts"],
              server: [],
            },
            root: fromCwd("/"),
            importer: fromCwd("/path/to/importer.ts"),
            env: "client",
          })
        ).toThrowErrorMatchingInlineSnapshot(
          `
          [Error: File denied in client environment
           - File: lib/server-only.ts
           - Importer: path/to/importer.ts
           - Matcher: "lib/server-only.ts"]
        `
        )
      })

      test("failed regex validation", () => {
        expect(() =>
          validateFile({
            absolutePath: fromCwd("/lib/server-only.ts"),
            denyFiles: {
              client: [/^lib\/server-only\.ts$/],
              server: [],
            },
            root: fromCwd("/"),
            importer: fromCwd("/path/to/importer.ts"),
            env: "client",
          })
        ).toThrowErrorMatchingInlineSnapshot(
          `
          [Error: File denied in client environment
           - File: lib/server-only.ts
           - Importer: path/to/importer.ts
           - Matcher: /^lib\\/server-only\\.ts$/]
        `
        )
      })

      test("failed validation without importer", () => {
        expect(() =>
          validateFile({
            absolutePath: fromCwd("/lib/server-only.ts"),
            denyFiles: {
              client: ["lib/server-only.ts"],
              server: [],
            },
            root: fromCwd("/"),
            importer: undefined,
            env: "client",
          })
        ).toThrowErrorMatchingInlineSnapshot(
          `
          [Error: File denied in client environment
           - File: lib/server-only.ts
           - Matcher: "lib/server-only.ts"]
        `
        )
      })

      test("passed validation", () => {
        expect(() =>
          validateFile({
            absolutePath: fromCwd("/lib/some-other-file.ts"),
            denyFiles: {
              client: [/server-only/],
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
          validateFile({
            absolutePath: fromCwd("/lib/server-only.ts"),
            denyFiles: {
              client: ["lib/server-only.ts"],
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
          validateFile({
            absolutePath: fromCwd("/lib/client-only.js"),
            denyFiles: {
              client: [],
              server: ["lib/client-only.js"],
            },
            root: fromCwd("/"),
            importer: fromCwd("/path/to/importer.ts"),
            env: "server",
          })
        ).toThrowErrorMatchingInlineSnapshot(
          `
          [Error: File denied in server environment
           - File: lib/client-only.js
           - Importer: path/to/importer.ts
           - Matcher: "lib/client-only.js"]
        `
        )
      })

      test("failed regex validation", () => {
        expect(() =>
          validateFile({
            absolutePath: fromCwd("/lib/client-only.ts"),
            denyFiles: {
              client: [],
              server: [/^lib\/client-only\.ts$/],
            },
            root: fromCwd("/"),
            importer: fromCwd("/path/to/importer.ts"),
            env: "server",
          })
        ).toThrowErrorMatchingInlineSnapshot(
          `
          [Error: File denied in server environment
           - File: lib/client-only.ts
           - Importer: path/to/importer.ts
           - Matcher: /^lib\\/client-only\\.ts$/]
        `
        )
      })

      test("failed validation without importer", () => {
        expect(() =>
          validateFile({
            absolutePath: fromCwd("/lib/client-only.ts"),
            denyFiles: {
              client: [],
              server: ["lib/client-only.ts"],
            },
            root: fromCwd("/"),
            importer: undefined,
            env: "server",
          })
        ).toThrowErrorMatchingInlineSnapshot(
          `
          [Error: File denied in server environment
           - File: lib/client-only.ts
           - Matcher: "lib/client-only.ts"]
        `
        )
      })

      test("passed validation", () => {
        expect(() =>
          validateFile({
            absolutePath: fromCwd("/lib/some-other-file.ts"),
            denyFiles: {
              client: [],
              server: ["lib/client-only.ts"],
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
          validateFile({
            absolutePath: fromCwd("/lib/client-only.ts"),
            denyFiles: {
              client: [],
              server: ["/lib/client-only.ts"],
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
