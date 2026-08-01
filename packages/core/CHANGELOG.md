# Changelog

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
