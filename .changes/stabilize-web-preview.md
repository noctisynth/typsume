---
"@typsume/web": patch:fix
---

Stabilize browser preview warnings and rendering

Show font resource warnings as a vertical problem list and avoid development-only concurrent
renderer calls that could trigger unsafe WASM aliasing errors.
