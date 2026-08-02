---
"@typsume/cli": patch:feat
---

Load project-local fonts declared in configuration.

Projects can now list relative TTF, OTF, or TTC files under `build.font-paths`; the CLI validates project boundaries and injects their bytes into Typst without exposing them through the template workspace.
