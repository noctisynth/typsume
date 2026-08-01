---
"@typsume/web": patch:perf
---

Keep editor dependencies out of the landing page

Let Vite split the editor route automatically so the landing page no longer preloads the form or
Typst runtimes before a user opens the browser editor.
