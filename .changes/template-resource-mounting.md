---
"@typsume/cli": patch:fix
---

Mount self-contained template resources in the Typst workspace

The compiler now recursively exposes template files to Typst while keeping metadata and font files
on their dedicated loading paths. Templates can reference assets such as profile images without the
compiler needing to understand resume fields.
