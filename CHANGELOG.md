# Changelog

## v0.1.0

### Bug Fixes

- Load template fonts from remote resources

The CLI now downloads ordered font mirrors, verifies optional SHA-256 integrity, extracts TTF and
OTF files from ZIP archives with fflate, and reports every fallback before continuing. The default
template fetches Maple Mono NF CN instead of storing its large font binaries in Git.
- Correct resume() layout call and font name

### New Features

- Add data-driven default template and typst.ts smoke
- Define remote template font resources

Templates may declare ordered font mirrors with optional SHA-256 integrity. CLI and Web load
direct TTF/OTF files or in-memory ZIP archives, and all fallback behavior must explicitly tell users
what happens next. CLI downloads are atomically cached inside each resume project's ignored
`.typsume/fonts/` directory; Web keeps font bytes only for the current page lifecycle.
- Rewrite template.typ to match reference layout
