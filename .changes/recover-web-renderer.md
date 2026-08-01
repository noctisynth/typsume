---
"@typsume/web": patch:fix
---

Recover browser previews from renderer ownership failures

Render SVG markup without mutating the DOM from inside the Rust WASM call, isolate every artifact
buffer, serialize renderer access, and recreate the renderer after a failed task so StrictMode
effect replay cannot reuse a poisoned instance.
