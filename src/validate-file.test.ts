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
            fileValidators: {
              server: ["lib/server-only.ts"],
              client: [],
            },
            root: fromCwd("/"),
            importer: fromCwd("/path/to/importer.ts"),
            env: "client",
          })
        ).toThrowErrorMatchingInlineSnapshot(
          `[Error: File "lib/server-only.ts" imported by "path/to/importer.ts" is not allowed in the client module graph]`
        )
      })

      test("failed regex validation", () => {
        expect(() =>
          validateFile({
            absolutePath: fromCwd("/lib/server-only.ts"),
            fileValidators: {
              server: [/^lib\/server-only\.ts$/],
              client: [],
            },
            root: fromCwd("/"),
            importer: fromCwd("/path/to/importer.ts"),
            env: "client",
          })
        ).toThrowErrorMatchingInlineSnapshot(
          `[Error: File "lib/server-only.ts" imported by "path/to/importer.ts" is not allowed in the client module graph]`
        )
      })

      test("failed validation without importer", () => {
        expect(() =>
          validateFile({
            absolutePath: fromCwd("/lib/server-only.ts"),
            fileValidators: {
              server: ["lib/server-only.ts"],
              client: [],
            },
            root: fromCwd("/"),
            importer: undefined,
            env: "client",
          })
        ).toThrowErrorMatchingInlineSnapshot(
          `[Error: File "lib/server-only.ts" is not allowed in the client module graph]`
        )
      })

      test("passed validation", () => {
        expect(() =>
          validateFile({
            absolutePath: fromCwd("/lib/some-other-file.ts"),
            fileValidators: {
              server: [/server-only/],
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
          validateFile({
            absolutePath: fromCwd("/lib/server-only.ts"),
            fileValidators: {
              server: ["lib/server-only.ts"],
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
          validateFile({
            absolutePath: fromCwd("/lib/client-only.js"),
            fileValidators: {
              server: [],
              client: ["lib/client-only.js"],
            },
            root: fromCwd("/"),
            importer: fromCwd("/path/to/importer.ts"),
            env: "server",
          })
        ).toThrowErrorMatchingInlineSnapshot(
          `[Error: File "lib/client-only.js" imported by "path/to/importer.ts" is not allowed in the server module graph]`
        )
      })

      test("failed regex validation", () => {
        expect(() =>
          validateFile({
            absolutePath: fromCwd("/lib/client-only.ts"),
            fileValidators: {
              server: [],
              client: [/^lib\/client-only\.ts$/],
            },
            root: fromCwd("/"),
            importer: fromCwd("/path/to/importer.ts"),
            env: "server",
          })
        ).toThrowErrorMatchingInlineSnapshot(
          `[Error: File "lib/client-only.ts" imported by "path/to/importer.ts" is not allowed in the server module graph]`
        )
      })

      test("failed validation without importer", () => {
        expect(() =>
          validateFile({
            absolutePath: fromCwd("/lib/client-only.ts"),
            fileValidators: {
              server: [],
              client: ["lib/client-only.ts"],
            },
            root: fromCwd("/"),
            importer: undefined,
            env: "server",
          })
        ).toThrowErrorMatchingInlineSnapshot(
          `[Error: File "lib/client-only.ts" is not allowed in the server module graph]`
        )
      })

      test("passed validation", () => {
        expect(() =>
          validateFile({
            absolutePath: fromCwd("/lib/some-other-file.ts"),
            fileValidators: {
              server: [],
              client: ["lib/client-only.ts"],
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
            fileValidators: {
              server: [],
              client: ["/lib/client-only.ts"],
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
