---
"@typsume/workspace": patch:feat
---

Define remote template font resources

Templates may declare ordered font mirrors with optional SHA-256 integrity. CLI and Web load
direct TTF/OTF files or in-memory ZIP archives without persistent caching, and all fallback behavior
must explicitly tell users what happens next.
