---
"@typsume/cli": patch:fix
---

Keep generated font caches stable across resume content edits.

The GitHub Actions cache key now follows project configuration only, while the CLI's internal resource hashes continue to isolate individual downloaded fonts.
