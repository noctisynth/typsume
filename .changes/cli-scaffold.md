typsume: minor:feat
---

feat: scaffold all subcommands

typsume now has 6 subcommands via citty:
- build: compile JSON/YAML/TOML to PDF via typst.ts WASM
- validate: schema validation only
- dump: normalize + stdout JSON
- templates: list available templates
- init: scaffold minimal project
- dev: watch + rebuild on change

Includes typst.ts WASM compile pipeline, template resolver,
config loader (project + XDG), and typed error codes.
