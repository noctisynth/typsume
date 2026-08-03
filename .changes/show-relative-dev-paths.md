---
"@typsume/cli": patch:fix
---

Show concise relative paths in dev watch status.

`typsume dev` now reports the watched resume source and project configuration relative to the command working directory while retaining absolute paths internally for reliable file monitoring.
