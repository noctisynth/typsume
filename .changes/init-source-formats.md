---
"@typsume/cli": patch:feat
---

Add source format selection to project initialization

`typsume init` now creates `resume.toml` by default and accepts `--format json|yaml|toml` for
projects that prefer another supported source format.
