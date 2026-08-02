---
"@typsume/cli": patch:fix
---

Build immediately and watch project configuration in dev mode.

`typsume dev` now performs an initial compilation, rebuilds for both source and `typsume.config.toml` changes, survives atomic file replacement, and shares the exact progress and artifact output used by `typsume build`.
