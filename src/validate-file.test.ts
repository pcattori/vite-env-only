import { describe, expect, test } from "vitest"
import { validateFile } from "./validate-file"
import path from "path"

function fromCwd(relativePath: string) {
  return path.join(process.cwd(), relativePath)
}

describe("validateFile", () => {
  test("denyFiles.client / env:client / failed string validation", () => {
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
      [Error: [vite-env-only:denyFiles] File denied in client environment
       - File: lib/server-only.ts
       - Importer: path/to/importer.ts
       - Pattern: "lib/server-only.ts"]
    `
    )
  })

  test("denyFiles.client / env:client / failed regex validation", () => {
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
      [Error: [vite-env-only:denyFiles] File denied in client environment
       - File: lib/server-only.ts
       - Importer: path/to/importer.ts
       - Pattern: /^lib\\/server-only\\.ts$/]
    `
    )
  })

  test("denyFiles.client / env:client / failed validation without importer", () => {
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
      [Error: [vite-env-only:denyFiles] File denied in client environment
       - File: lib/server-only.ts
       - Pattern: "lib/server-only.ts"]
    `
    )
  })

  test("denyFiles.client / env:client / passed validation", () => {
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

  test("denyFiles.server / env:client / ignores denyFiles.server", () => {
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

  test("denyFiles.client / env:server / ignores denyFiles.client", () => {
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

  test("denyFiles.server / env:server / failed string validation", () => {
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
      [Error: [vite-env-only:denyFiles] File denied in server environment
       - File: lib/client-only.js
       - Importer: path/to/importer.ts
       - Pattern: "lib/client-only.js"]
    `
    )
  })

  test("denyFiles.server / env:server / failed regex validation", () => {
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
      [Error: [vite-env-only:denyFiles] File denied in server environment
       - File: lib/client-only.ts
       - Importer: path/to/importer.ts
       - Pattern: /^lib\\/client-only\\.ts$/]
    `
    )
  })

  test("denyFiles.server / env:server / failed validation without importer", () => {
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
      [Error: [vite-env-only:denyFiles] File denied in server environment
       - File: lib/client-only.ts
       - Pattern: "lib/client-only.ts"]
    `
    )
  })

  test("denyFiles.server / env:server / passed validation", () => {
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
