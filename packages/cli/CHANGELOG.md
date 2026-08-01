# Changelog

## v0.1.2

### New Features

- [`a9e881e`](https://github.com/noctisynth/typsume/commit/a9e881ead52ef726163cf87de6dcda8256d1eeb2): Add source format selection to project initialization

    `typsume init` now creates `resume.toml` by default and accepts `--format json|yaml|toml` for
    projects that prefer another supported source format.

- [`8cc6f96`](https://github.com/noctisynth/typsume/commit/8cc6f96132d9528861504c9449f17edf3cdc3e42): Improve CLI output with consola

    Human-readable command status, warnings, and errors now use consola while structured JSON output
    remains clean on stdout for shell pipelines.

## v0.1.1

### Bug Fixes

- [`bbc4bac`](https://github.com/noctisynth/typsume/commit/bbc4bacacb1642f327d0a79468a10912b73fce7a): Honor default template layout settings and optional photos

    The default template now restores Typst length values from the injected layout configuration, uses
    the configured margins and column dimensions, and renders an optional profile image from the
    template workspace. The sample contact icon now matches the bundled icon name.

- [`59663a3`](https://github.com/noctisynth/typsume/commit/59663a3d8d4d3178fdeb625ed6c339fe19196dce): Keep resume item columns within predictable bounds

    The default template now gives job titles, organizations, and dates independent grid columns so
    long content wraps without displacing adjacent fields. Linked titles no longer include trailing
    underline space, and a complete Chinese sample covers long-title wrapping and all resume sections.

- [`0becd5b`](https://github.com/noctisynth/typsume/commit/0becd5ba36393498de05495be0f6969fe60683b5): Model experience departments explicitly

    Resume item blocks now support an optional department field. The default template renders that
    field as the experience detail line while project items continue to render their technology stack.
    The English and Chinese samples now consistently map organizations, roles, schools, and degrees to
    their documented fields.

- [`916355e`](https://github.com/noctisynth/typsume/commit/916355edc0244d0b47c4965734a7f0c0c59c2b5d): Mount self-contained template resources in the Typst workspace

    The compiler now recursively exposes template files to Typst while keeping metadata and font files
    on their dedicated loading paths. Templates can reference assets such as profile images without the
    compiler needing to understand resume fields.


### Chores

- [`9995f78`](https://github.com/noctisynth/typsume/commit/9995f78dcd7b2237a20c7df663521128088239d9): Restore the Bun canary runtime in CI

    The CI workflow now uses the available Bun canary release instead of requesting a nonexistent
    stable version.

- [`587d7a8`](https://github.com/noctisynth/typsume/commit/587d7a863709f2fd0e432c5d173c5ac65debe3dc): Close the W2 template milestone

    The project documentation now treats a successful sample PDF build as the W2 exit condition,
    records the completed migration steps, and documents the final configuration and resource-loading
    contract.


### New Features

- [`474ec42`](https://github.com/noctisynth/typsume/commit/474ec42b7874862d75fcaca8df65fd6f284806bc): Complete the W3 CLI workflow

    The CLI now provides validated configuration, stable exit codes, template resolution, development
    watching, project scaffolding, and packaged built-in templates through the `typsume` executable.

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
