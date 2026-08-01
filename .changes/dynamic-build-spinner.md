---
"@typsume/cli": patch:feat
---

Use a dynamic single-line build spinner

Interactive builds now update one Clack spinner in place across compilation stages, pause cleanly
for download consent, and fall back to regular progress logs in CI and piped environments.
