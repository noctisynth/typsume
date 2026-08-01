---
"@typsume/web": patch:fix
---

Fall back to compatible local fonts in the browser

When every remote template font fails, request Local Font Access, load the first compatible local
family into Typst, report every fallback outcome, and compile with the selected family name.
