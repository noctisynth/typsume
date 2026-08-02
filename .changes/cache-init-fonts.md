---
"@typsume/cli": patch:fix
---

Cache downloaded fonts and preserve the PDF filename in generated CI workflows.

New projects restore `.typsume/fonts` with actions/cache v5 and upload `resume.pdf` directly with upload-artifact v7 instead of wrapping it in an artifact named `resume`.
