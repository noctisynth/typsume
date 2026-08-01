---
"@typsume/cli": patch:chore
---

Restore the Bun canary runtime in CI

The CI workflow now uses the available Bun canary release instead of requesting a nonexistent
stable version.
