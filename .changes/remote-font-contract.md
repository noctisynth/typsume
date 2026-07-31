---
"@typsume/workspace": patch:feat
---

Define remote template font resources

Templates may declare ordered font mirrors with optional SHA-256 integrity. CLI and Web load
direct TTF/OTF files or in-memory ZIP archives, and all fallback behavior must explicitly tell users
what happens next. CLI downloads are atomically cached inside each resume project's ignored
`.typsume/fonts/` directory; Web keeps font bytes only for the current page lifecycle.
