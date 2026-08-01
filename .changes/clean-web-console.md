---
"@typsume/web": patch:fix
---

Clean browser runtime warnings and fix section collapsing

Initialize compiler and renderer WASM modules with the current wasm-bindgen object parameter,
omit runtime JavaScript from static SVG previews, and separate manual accordion state from
outline navigation so expanded sections collapse on the first click.
