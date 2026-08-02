# Changelog

## v0.1.6

### Bug Fixes

- [`5bd571d`](https://github.com/noctisynth/typsume/commit/5bd571d73a37138f46190d22dd7323dccb2c9933): Refine CLI configuration export and award spacing

    Describe CLI compatibility at the data format menu level, let users copy a complete project
    configuration from the typesetting panel, and keep grouped award rows compact.

- [`f09b5c2`](https://github.com/noctisynth/typsume/commit/f09b5c2aa3ff1edca4ef9c356c4f843e7c420f40): Fix dynamic editor sections and award rendering

    Allow expanded form sections to grow when items are added, group awards by date without long
    timeline rules, and promote resume imports and every download format to the editor header.

- [`c14f2e0`](https://github.com/noctisynth/typsume/commit/c14f2e01ff1087cb5a3c3a22d5e1a88ce5749cfd): Polish editor data actions and conditional sections

    Align grouped awards, omit empty resume sections, move imports back to the form header, provide a
    compact data download menu, and localize the remaining editor status and font consent copy.

- [`e369ea8`](https://github.com/noctisynth/typsume/commit/e369ea8b4e3ab155ed6f1a8888f65483ff0653bb): Update generated GitHub Actions workflows to current stable action versions.

    New projects now use checkout v6 and upload-artifact v7 so their automated resume builds remain compatible with current GitHub-hosted runners.


### New Features

- [`4ab0b02`](https://github.com/noctisynth/typsume/commit/4ab0b027ef91a350bfdc47d6bdf12ba21d9f3774): Share template configuration across CLI and Web

    Define and validate the complete template configuration contract, apply project overrides from
    typsume.config.toml in the CLI, and keep Web typesetting overrides in an independent persisted
    model instead of resume metadata.

- [`d77c087`](https://github.com/noctisynth/typsume/commit/d77c087f65948200b449bc524342e19fc089f046): Support portable project photo assets

    Upload and persist PNG or JPEG profile photos under logical assets paths, mount referenced images
    in both compilers, export complete CLI project archives, and reject unsafe project asset paths.

## v0.1.5

### New Features

- [`b4f6799`](https://github.com/noctisynth/typsume/commit/b4f67994466b515a0f7b48f6d7d3bb6b6664c5f7): Separate build completion from artifact output

    The dynamic spinner now ends with a concise completion status, followed by a dedicated Consola
    result line containing the generated relative path and file size.

- [`d87a5ab`](https://github.com/noctisynth/typsume/commit/d87a5abde54475f89187cc7de67a81e0aa725446): Use a dynamic single-line build spinner

    Interactive builds now update one Clack spinner in place across compilation stages, pause cleanly
    for download consent, and fall back to regular progress logs in CI and piped environments.

- [`6d18449`](https://github.com/noctisynth/typsume/commit/6d18449ef63cff375ca639f36b328ebc53bd5079): Use completion ticks and relative output paths

    Build stages now emit success ticks only after completing, and generated artifact paths are shown
    relative to the current working directory for concise terminal output.

## v0.1.4

### Chores

- [`2a14bef`](https://github.com/noctisynth/typsume/commit/2a14befa7e3d23d729c9d467239f8e33a61eb772): Isolate CLI subprocess test homes

    CLI subprocess tests now use temporary HOME and XDG directories so Bun caches and test
    configuration never pollute the package source directory.

- [`03343e2`](https://github.com/noctisynth/typsume/commit/03343e2b854d96fa818c45fa10a2f951a93decc9): Isolate interaction tests from CI authorization

    Tests for declined and non-interactive font downloads now use an explicit environment so the
    GitHub Actions authorization variable cannot change their expected policy branch.


### New Features

- [`cbf7abe`](https://github.com/noctisynth/typsume/commit/cbf7abe94732bfd61dc0a22e12d537c6ddd61568): Add GitHub Actions scaffolding and download consent

    Project initialization can now generate a main-branch PDF artifact workflow, and remote font
    downloads require interactive consent unless explicitly allowed or running in GitHub Actions.

## v0.1.3

### New Features

- [`36d26e3`](https://github.com/noctisynth/typsume/commit/36d26e35f94ff90af5b2960527b3a7f65f63a5f6): Colorize important CLI output details

    Paths, build stages, generated artifacts, byte counts, and rebuild timings now use terminal-aware
    colorette styling while structured output remains free of ANSI formatting.

- [`9b16d00`](https://github.com/noctisynth/typsume/commit/9b16d00ab6a7cc78ea5ce9660226aebf8ddd89f0): Report progress throughout resume builds

    The build command now reports validation, template resolution, font loading, WASM initialization,
    Typst compilation, and PDF writing so long-running builds no longer appear idle.

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
