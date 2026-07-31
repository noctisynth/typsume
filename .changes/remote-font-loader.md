---
"@typsume/cli": minor:feat
"@typsume/workspace": patch:fix
---

Load template fonts from remote resources

The CLI now downloads ordered font mirrors, verifies optional SHA-256 integrity, extracts TTF and
OTF files from ZIP archives with fflate, and reports every fallback before continuing. The default
template fetches Maple Mono NF CN instead of storing its large font binaries in Git.
