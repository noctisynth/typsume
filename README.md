# Typsume

Data-driven Typst resume compiler.

[中文版](./README.zh.md)

## Quick start

```bash
bun install

# build sample resume
bun run typsume build examples/sample/resume.json

# create a new project
bun run typsume init my-resume
cd my-resume
bun run typsume build resume.json
```

## Structure

```
@typsume/workspace         root workspace
├── packages/
│   ├── core               shared Zod schema + TS types + JSON Schema
│   └── cli                typsume CLI (citty + typst.ts WASM)
├── templates/
│   └── default/           default two-column resume template
├── examples/
│   └── sample/            sample placeholder data
└── .changes/              smif changesets
```

## CLI

| Command | Description |
|---------|-------------|
| `typsume build <source>` | Validate and compile to PDF |
| `typsume validate <source>` | Schema validation only |
| `typsume dump <source>` | Normalize and print JSON |
| `typsume templates` | List available templates |
| `typsume init [dir]` | Scaffold a minimal project |
| `typsume dev <source>` | Watch and rebuild on change |

Input formats: JSON, YAML, TOML.

## License

MIT
