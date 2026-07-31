# Changelog

## v0.1.0

### Chores

- Cover remote font loading and project cache behavior

Tests verify direct and ZIP fonts, mirror fallback, integrity rejection, URL sanitization, corrupted
cache recovery, project-root discovery, and the ignored `.typsume` runtime directory.

### New Features

- Scaffold all subcommands

typsume now has 6 subcommands via citty:
- build: compile JSON/YAML/TOML to PDF via typst.ts WASM
- validate: schema validation only
- dump: normalize + stdout JSON
- templates: list available templates
- init: scaffold minimal project
- dev: watch + rebuild on change

Includes typst.ts WASM compile pipeline, template resolver,
config loader (project + XDG), and typed error codes.
- Load template fonts from remote resources

The CLI now downloads ordered font mirrors, verifies optional SHA-256 integrity, extracts TTF and
OTF files from ZIP archives with fflate, and reports every fallback before continuing. The default
template fetches Maple Mono NF CN instead of storing its large font binaries in Git.
