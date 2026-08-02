# Changelog

## v0.1.3

### New Features

- [`fa8c4d8`](https://github.com/noctisynth/typsume/commit/fa8c4d82c7f572293bf19996ca575fddf64873ef): Configure contact text size independently from body text.

    The shared template configuration now exposes `contact-size`, and the default template and Web style editor apply it without forcing users to shrink all resume content to fit long contact values.

## v0.1.2

### New Features

- [`4ab0b02`](https://github.com/noctisynth/typsume/commit/4ab0b027ef91a350bfdc47d6bdf12ba21d9f3774): Share template configuration across CLI and Web

    Define and validate the complete template configuration contract, apply project overrides from
    typsume.config.toml in the CLI, and keep Web typesetting overrides in an independent persisted
    model instead of resume metadata.

## v0.1.1

### New Features

- [`0becd5b`](https://github.com/noctisynth/typsume/commit/0becd5ba36393498de05495be0f6969fe60683b5): Model experience departments explicitly

    Resume item blocks now support an optional department field. The default template renders that
    field as the experience detail line while project items continue to render their technology stack.
    The English and Chinese samples now consistently map organizations, roles, schools, and degrees to
    their documented fields.

## v0.1.0

### New Features

- Bootstrap monorepo with Zod schema

packages/core with shared Zod schema, TypeScript types,
JSON Schema generation (via z.toJSONSchema), and vitest test suite.
