import { CompileFormatEnum, createTypstCompiler } from '@myriaddreamin/typst.ts/compiler';
import { MemoryAccessModel } from '@myriaddreamin/typst.ts/fs/memory';
import { loadFonts, withAccessModel } from '@myriaddreamin/typst.ts/options.init';
import compilerWasmUrl from '@myriaddreamin/typst-ts-web-compiler/wasm?url';
import type { ResumeData, TemplateConfigOverrides } from '@typsume/core';
import type { SelectedFontBundle } from '@/models/font-model';
import { inspectFontFamilies, selectFontFamily } from './font-inspection';
import { type FontStatus, loadBrowserFonts, loadLocalFontFallback } from './font-resources';
import { DEFAULT_TEMPLATE } from './template-registry';
import { wasmModuleInput } from './wasm-module';

const VIRTUAL_ROOT = '/@memory/';
const encoder = new TextEncoder();

export type CompilePhase =
  | 'Loading template'
  | 'Loading font resources'
  | 'Initializing Typst WASM'
  | 'Compiling preview'
  | 'Compiling PDF';

interface CompilerRuntime {
  compiler: ReturnType<typeof createTypstCompiler>;
  fontFamilyOverride: string | null;
  queue: Promise<void>;
}

interface CompileCallbacks {
  phase?: (phase: CompilePhase) => void;
  resource?: (status: FontStatus) => void;
}

const runtimes = new Map<string, Promise<CompilerRuntime>>();

function insert(accessModel: MemoryAccessModel, path: string, content: string): void {
  accessModel.insertFile(`${VIRTUAL_ROOT}${path}`, encoder.encode(content), new Date());
}

async function createRuntime(
  allowFontDownloads: boolean,
  preferredFontFamilies: string[],
  selectedFont: SelectedFontBundle | null,
  callbacks: CompileCallbacks,
): Promise<CompilerRuntime> {
  callbacks.phase?.('Loading template');
  const accessModel = new MemoryAccessModel();
  insert(accessModel, 'template.typ', DEFAULT_TEMPLATE.source);
  for (const [path, source] of Object.entries(DEFAULT_TEMPLATE.assets)) {
    insert(accessModel, path, source);
  }

  let fonts: Uint8Array[] = [];
  let fontFamilyOverride: string | null = null;
  if (selectedFont) {
    callbacks.phase?.('Loading font resources');
    fonts = selectedFont.fonts;
    fontFamilyOverride = selectedFont.family;
    callbacks.resource?.({
      kind: 'info',
      message: `Using uploaded font ${selectedFont.family}.`,
    });
  } else if (allowFontDownloads) {
    callbacks.phase?.('Loading font resources');
    fonts = await loadBrowserFonts(
      DEFAULT_TEMPLATE.fontResources,
      callbacks.resource ? { report: callbacks.resource } : {},
    );
    if (fonts.length > 0) {
      fontFamilyOverride = await selectFontFamily(fonts, preferredFontFamilies);
      if (!fontFamilyOverride) {
        callbacks.resource?.({
          kind: 'warning',
          message:
            'Downloaded font files could not be identified by Typst. Trying a local fallback font.',
        });
        fonts = [];
      }
    }
    if (fonts.length === 0) {
      const fallback = await loadLocalFontFallback(preferredFontFamilies, {
        ...(callbacks.resource ? { report: callbacks.resource } : {}),
        inspectFamilies: inspectFontFamilies,
      });
      if (fallback) {
        fonts = fallback.fonts;
        fontFamilyOverride = fallback.family;
      }
    }
  } else {
    callbacks.resource?.({
      kind: 'warning',
      message:
        'Remote font downloads were declined. Compilation will continue without template fonts.',
    });
  }

  callbacks.phase?.('Initializing Typst WASM');
  const compiler = createTypstCompiler();
  await compiler.init({
    workspace: VIRTUAL_ROOT,
    getModule: () => wasmModuleInput(compilerWasmUrl),
    beforeBuild: [loadFonts(fonts, { assets: false }), withAccessModel(accessModel)],
  } as never);
  return { compiler, fontFamilyOverride, queue: Promise.resolve() };
}

async function getRuntime(
  allowFontDownloads: boolean,
  preferredFontFamilies: string[],
  selectedFont: SelectedFontBundle | null,
  callbacks: CompileCallbacks,
): Promise<CompilerRuntime> {
  const key = JSON.stringify([
    allowFontDownloads,
    preferredFontFamilies,
    selectedFont?.key ?? null,
  ]);
  let runtime = runtimes.get(key);
  if (!runtime) {
    runtime = createRuntime(
      allowFontDownloads,
      preferredFontFamilies,
      selectedFont,
      callbacks,
    ).catch((error) => {
      runtimes.delete(key);
      throw error;
    });
    runtimes.set(key, runtime);
  }
  return runtime;
}

function mapResume(
  runtime: CompilerRuntime,
  resume: ResumeData,
  configOverrides: TemplateConfigOverrides,
): void {
  const browserResume = structuredClone(resume);
  if (browserResume.basics.photo) delete browserResume.basics.photo;
  const config = DEFAULT_TEMPLATE.config(configOverrides);
  if (runtime.fontFamilyOverride) {
    config.fonts = {
      main: runtime.fontFamilyOverride,
      mono: runtime.fontFamilyOverride,
    };
  }
  runtime.compiler.mapShadow(
    `${VIRTUAL_ROOT}resume.json`,
    encoder.encode(JSON.stringify(browserResume)),
  );
  runtime.compiler.mapShadow(
    `${VIRTUAL_ROOT}cfg_colors.json`,
    encoder.encode(JSON.stringify(config.colors)),
  );
  runtime.compiler.mapShadow(
    `${VIRTUAL_ROOT}cfg_fonts.json`,
    encoder.encode(JSON.stringify(config.fonts)),
  );
  runtime.compiler.mapShadow(
    `${VIRTUAL_ROOT}cfg_sizes.json`,
    encoder.encode(JSON.stringify(config.sizes)),
  );
  runtime.compiler.mapShadow(
    `${VIRTUAL_ROOT}cfg_layout.json`,
    encoder.encode(JSON.stringify(config.layout)),
  );
}

async function compile(
  resume: ResumeData,
  format: CompileFormatEnum,
  allowFontDownloads: boolean,
  selectedFont: SelectedFontBundle | null,
  configOverrides: TemplateConfigOverrides,
  callbacks: CompileCallbacks,
): Promise<Uint8Array> {
  const preferredFontFamilies = Object.values(DEFAULT_TEMPLATE.config(configOverrides).fonts);
  if (resume.basics.photo) {
    callbacks.resource?.({
      kind: 'warning',
      message:
        'Photo paths are not accessible in the browser preview. The photo was omitted from this compilation; the saved resume data was not changed.',
    });
  }
  const runtime = await getRuntime(
    allowFontDownloads,
    preferredFontFamilies,
    selectedFont,
    callbacks,
  );
  let resolveResult: (value: Uint8Array) => void = () => undefined;
  let rejectResult: (reason: unknown) => void = () => undefined;
  const result = new Promise<Uint8Array>((resolve, reject) => {
    resolveResult = resolve;
    rejectResult = reject;
  });

  runtime.queue = runtime.queue
    .then(async () => {
      mapResume(runtime, resume, configOverrides);
      callbacks.phase?.(format === CompileFormatEnum.pdf ? 'Compiling PDF' : 'Compiling preview');
      const document = await runtime.compiler.compile({
        mainFilePath: `${VIRTUAL_ROOT}template.typ`,
        format,
        diagnostics: 'full',
      });
      if (!(document.result instanceof Uint8Array)) {
        throw new Error(
          document.diagnostics?.map((diagnostic) => diagnostic.message).join('\n') ||
            'Typst compilation returned no document.',
        );
      }
      resolveResult(document.result);
    })
    .catch((error) => {
      runtimes.delete(
        JSON.stringify([allowFontDownloads, preferredFontFamilies, selectedFont?.key ?? null]),
      );
      rejectResult(error);
    });

  return result;
}

export function compilePreview(
  resume: ResumeData,
  allowFontDownloads: boolean,
  selectedFont: SelectedFontBundle | null,
  configOverrides: TemplateConfigOverrides,
  callbacks: CompileCallbacks = {},
): Promise<Uint8Array> {
  return compile(
    resume,
    CompileFormatEnum.vector,
    allowFontDownloads,
    selectedFont,
    configOverrides,
    callbacks,
  );
}

export function compilePdf(
  resume: ResumeData,
  allowFontDownloads: boolean,
  selectedFont: SelectedFontBundle | null,
  configOverrides: TemplateConfigOverrides,
  callbacks: CompileCallbacks = {},
): Promise<Uint8Array> {
  return compile(
    resume,
    CompileFormatEnum.pdf,
    allowFontDownloads,
    selectedFont,
    configOverrides,
    callbacks,
  );
}
