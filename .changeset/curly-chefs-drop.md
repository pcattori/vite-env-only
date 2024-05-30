---
"vite-env-only": patch
---

Allow call expressions in macro identifier validation

Previously, the code had duplicated checks for allowing macro within import specifiers.
This was always meant to be a check for import specifiers _and_ a check for a call expression.
