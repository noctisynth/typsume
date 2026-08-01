# Changelog

## v0.1.1

### Bug Fixes

- [`8904740`](https://github.com/noctisynth/typsume/commit/8904740a37fe036ac2b8e8401a09cbf96fbc7f38): Synchronize the private Web workspace with Semifold

    Register the private Web application so its changesets pass release validation while Semifold
    continues to exclude it from npm publishing and the workspace root from GitHub releases.

- [`80cba3f`](https://github.com/noctisynth/typsume/commit/80cba3fcbe90907f85d62cdc93b22c94a3bd968f): Recover browser previews from renderer ownership failures

    Render SVG markup without mutating the DOM from inside the Rust WASM call, isolate every artifact
    buffer, serialize renderer access, and recreate the renderer after a failed task so StrictMode
    effect replay cannot reuse a poisoned instance.

- [`46d034f`](https://github.com/noctisynth/typsume/commit/46d034f4c71fed47e7ae7417c71c7884bf394c8a): Clean browser runtime warnings and fix section collapsing

    Initialize compiler and renderer WASM modules with the current wasm-bindgen object parameter,
    omit runtime JavaScript from static SVG previews, and separate manual accordion state from
    outline navigation so expanded sections collapse on the first click.

- [`fad70fb`](https://github.com/noctisynth/typsume/commit/fad70fbdf3d7621e8b4ed491c335a3e1f5d22e6a): Stabilize browser preview warnings and rendering

    Show font resource warnings as a vertical problem list and avoid development-only concurrent
    renderer calls that could trigger unsafe WASM aliasing errors.

- [`d5378d2`](https://github.com/noctisynth/typsume/commit/d5378d25ffbca8d442ce3cbe4a087efe614f7f2f): Fall back to compatible local fonts in the browser

    When every remote template font fails, request Local Font Access, load the first compatible local
    family into Typst, report every fallback outcome, and compile with the selected family name.


### New Features

- [`7b8e368`](https://github.com/noctisynth/typsume/commit/7b8e368e5195defdc2d1380ed97b2df28469864c): Build the browser resume editor

    Add the Tailwind and shadcn-based three-column studio, complete schema-backed resume forms,
    localized interface copy, and validated IndexedDB draft persistence through a dedicated Zustand
    model.

- [`45c295e`](https://github.com/noctisynth/typsume/commit/45c295eba439bd839f7c1e74d91e83d3439f7dee): Compile and preview resumes in the browser

    Bundle the shared default template, lazily initialize the Typst compiler and renderer WASM,
    request font download consent, expose resource failures, render vector previews, and export PDFs
    without sending resume data to a server.

- [`2096f56`](https://github.com/noctisynth/typsume/commit/2096f569cb8eef062278e94a00b5f64e98d211f5): Add browser font management and contain editor navigation

    Allow users to upload complete TTF, OTF, and TTC files, select Typst-recognized internal font
    families, and use the same page-lifetime font for previews and PDF exports. Validate remote and
    local fallback family names through Typst, omit inaccessible browser photo paths with a visible
    warning, and keep outline navigation inside the resume form viewport.

- [`32256bd`](https://github.com/noctisynth/typsume/commit/32256bd77b3bfbfe41a3b36ba6ea5f50f1e78e3f): Scaffold the browser resume studio

    Add the React 19 and Vite workspace, lazy-load the editor route, configure Tailwind and the
    shared Web toolchain, and introduce the privacy-focused product landing page.


### Performance Improvements

- [`2334ec5`](https://github.com/noctisynth/typsume/commit/2334ec5f75ab0393ce5f90d9678675c8d2b2f035): Keep editor dependencies out of the landing page

    Let Vite split the editor route automatically so the landing page no longer preloads the form or
    Typst runtimes before a user opens the browser editor.


### Refactors

- [`d742ab9`](https://github.com/noctisynth/typsume/commit/d742ab95217e8507388f6d6d4e8585c686e71e93): Adopt the shadcn-react project architecture

    Use kebab-case files, generate UI primitives with the shadcn CLI, keep all React components under
    feature-oriented component directories, move state models to a dedicated models layer, and replace
    hand-written component CSS with Tailwind utilities.

