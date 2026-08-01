---
"@typsume/cli": patch:chore
---

Isolate CLI subprocess test homes

CLI subprocess tests now use temporary HOME and XDG directories so Bun caches and test
configuration never pollute the package source directory.
