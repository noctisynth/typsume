---
"@typsume/web": patch:fix
---

Remove the rendering seam from the logo fold.

The document silhouette now reserves the folded corner instead of painting two diagonal shapes on top of each other, eliminating the white anti-aliasing gap at large and favicon sizes.
