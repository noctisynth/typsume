# Changelog

## v0.1.4

### Bug Fixes

- [`9fab7db`](https://github.com/noctisynth/typsume/commit/9fab7dbc3fdbf9c1bd38ab70e68b34e7e99e0038): Remove the rendering seam from the logo fold.

    The document silhouette now reserves the folded corner instead of painting two diagonal shapes on top of each other, eliminating the white anti-aliasing gap at large and favicon sizes.


### New Features

- [`1d0ec22`](https://github.com/noctisynth/typsume/commit/1d0ec22f491c4666d697bc1e4df2e42e359a1696): Add a reusable Typsume brand mark.

    The Web app now uses a crisp, font-independent SVG logo inspired by structured data becoming a typeset document across the home page, editor header, and favicon.

## v0.1.3

### Bug Fixes

- [`63c69c5`](https://github.com/noctisynth/typsume/commit/63c69c58176612f92ef29e650fce068818a614a2): Fix default resume layout and contact icon rendering.

    The default template now renders education before experience and projects, removes decorative name brackets, gives wrapped awards natural spacing, maps built-in contact icons correctly, and supports safely mounted custom SVG or PNG contact icons in CLI and Web projects.

- [`1906090`](https://github.com/noctisynth/typsume/commit/19060903894628fff0b94b23d66de295f87b06e6): Align award markers with the first line of each title.

    Award rows now use a text bullet at the same font size as the title, so both elements share a typographic baseline instead of approximating alignment with a geometric circle.

- [`87d85cf`](https://github.com/noctisynth/typsume/commit/87d85cfa2f69e424932822fe10c5bc8bf7ad67a4): Align award dates, markers, and wrapped titles in the default template.

    Each award now shares one three-column row, keeps grouped years left aligned, and anchors its marker to the first title line while multiline content expands naturally.


### New Features

- [`fa8c4d8`](https://github.com/noctisynth/typsume/commit/fa8c4d82c7f572293bf19996ca575fddf64873ef): Configure contact text size independently from body text.

    The shared template configuration now exposes `contact-size`, and the default template and Web style editor apply it without forcing users to shrink all resume content to fit long contact values.

## v0.1.2

### Bug Fixes

- [`5bd571d`](https://github.com/noctisynth/typsume/commit/5bd571d73a37138f46190d22dd7323dccb2c9933): Refine CLI configuration export and award spacing

    Describe CLI compatibility at the data format menu level, let users copy a complete project
    configuration from the typesetting panel, and keep grouped award rows compact.

- [`52ff533`](https://github.com/noctisynth/typsume/commit/52ff533520d27ad11e54494242c46e5123d59c2f): Fix editor separator alignment and clipped card borders

    Center the compact header separator and reserve space inside animated accordion content so card
    rings remain visible along their top and right edges.

- [`f09b5c2`](https://github.com/noctisynth/typsume/commit/f09b5c2aa3ff1edca4ef9c356c4f843e7c420f40): Fix dynamic editor sections and award rendering

    Allow expanded form sections to grow when items are added, group awards by date without long
    timeline rules, and promote resume imports and every download format to the editor header.

- [`3014523`](https://github.com/noctisynth/typsume/commit/3014523556fb2c2f293a33ffa745c2cae208d45e): Increase preview zoom sensitivity for pixel-based wheel and trackpad input.

    Continuous gestures now reach the intended scale with less movement while traditional line and page wheel increments remain unchanged.

- [`154ca7e`](https://github.com/noctisynth/typsume/commit/154ca7e9e9b6a1247c809f5752af0495b3fa4816): Disable preview zoom until a rendered document is available.

    Font consent, initial compilation, and empty error states no longer expose active zoom controls or capture zoom gestures.

- [`4987323`](https://github.com/noctisynth/typsume/commit/4987323d77ad9e3bc1784fc32989f0ab346dd6c7): Keep uploaded photo controls within the form column

    Constrain long photo filenames to a shrinkable content column and allow photo actions to wrap
    without expanding or clipping the resume form.

- [`c14f2e0`](https://github.com/noctisynth/typsume/commit/c14f2e01ff1087cb5a3c3a22d5e1a88ce5749cfd): Polish editor data actions and conditional sections

    Align grouped awards, omit empty resume sections, move imports back to the form header, provide a
    compact data download menu, and localize the remaining editor status and font consent copy.


### New Features

- [`918d847`](https://github.com/noctisynth/typsume/commit/918d84798c594195808a576c45e44deddaa4fced): Import and export resume data in three formats

    Add atomic JSON, YAML, and TOML resume imports with shared schema validation, matching exports,
    visible errors that preserve the current draft, and a browser-safe TOML runtime.

- [`4ab0b02`](https://github.com/noctisynth/typsume/commit/4ab0b027ef91a350bfdc47d6bdf12ba21d9f3774): Share template configuration across CLI and Web

    Define and validate the complete template configuration contract, apply project overrides from
    typsume.config.toml in the CLI, and keep Web typesetting overrides in an independent persisted
    model instead of resume metadata.

- [`58fc2a1`](https://github.com/noctisynth/typsume/commit/58fc2a13688b54e6150fe8bd7ec48c639da06ad5): Deploy the Web application to GitHub Pages

    Build and publish the Web workspace on main branch updates, apply the Pages base path to Vite and
    React Router, and include an SPA fallback for direct editor navigation.

- [`d77c087`](https://github.com/noctisynth/typsume/commit/d77c087f65948200b449bc524342e19fc089f046): Support portable project photo assets

    Upload and persist PNG or JPEG profile photos under logical assets paths, mount referenced images
    in both compilers, export complete CLI project archives, and reject unsafe project asset paths.

- [`2bb9619`](https://github.com/noctisynth/typsume/commit/2bb961932f6692c081ae843c2802a21682f5ede6): Add interactive resume preview zoom controls and gesture support.

    The preview now supports preset and incremental zoom from 50% to 200%, Ctrl or Cmd plus wheel input, and trackpad pinch gestures without recompiling the Typst document.

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
