---
"vite-env-only": major
---

Stop publishing CJS; only publish ESM.

[Node 20+ (LTS) supports require(esm)](https://nodejs.org/en/blog/release/v20.19.0) which means all active & maintenance LTS versions across all major JavaScript runtimes can handle
ESM packages being `require`d in CJS code.
