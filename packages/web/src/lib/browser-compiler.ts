import { CompileFormatEnum, createTypstCompiler } from '@myriaddreamin/typst.ts/compiler';
import { MemoryAccessModel } from '@myriaddreamin/typst.ts/fs/memory';
import { loadFonts, withAccessModel } from '@myriaddreamin/typst.ts/options.init';
import compilerWasmUrl from '@myriaddreamin/typst-ts-web-compiler/wasm?url';
import type { ResumeData } from '@typsume/core';
import { type FontStatus, loadBrowserFonts } from './font-resources';
import { DEFAULT_TEMPLATE } from './template-registry';

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
  queue: Promise<void>;
}

interface CompileCallbacks {
  phase?: (phase: CompilePhase) => void;
  resource?: (status: FontStatus) => void;
}

const runtimes = new Map<boolean, Promise<CompilerRuntime>>();

function insert(accessModel: MemoryAccessModel, path: string, content: string): void {
  accessModel.insertFile(`${VIRTUAL_ROOT}${path}`, encoder.encode(content), new Date());
}

async function createRuntime(
  allowFontDownloads: boolean,
  callbacks: CompileCallbacks,
): Promise<CompilerRuntime> {
  callbacks.phase?.('Loading template');
  const accessModel = new MemoryAccessModel();
  insert(accessModel, 'template.typ', DEFAULT_TEMPLATE.source);
  for (const [path, source] of Object.entries(DEFAULT_TEMPLATE.assets)) {
    insert(accessModel, path, source);
  }

  let fonts: Uint8Array[] = [];
  if (allowFontDownloads) {
    callbacks.phase?.('Loading font resources');
    fonts = await loadBrowserFonts(
      DEFAULT_TEMPLATE.fontResources,
      callbacks.resource ? { report: callbacks.resource } : {},
    );
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
    getModule: () => compilerWasmUrl,
    beforeBuild: [loadFonts(fonts, { assets: false }), withAccessModel(accessModel)],
  } as never);
  return { compiler, queue: Promise.resolve() };
}

async function getRuntime(
  allowFontDownloads: boolean,
  callbacks: CompileCallbacks,
): Promise<CompilerRuntime> {
  let runtime = runtimes.get(allowFontDownloads);
  if (!runtime) {
    runtime = createRuntime(allowFontDownloads, callbacks).catch((error) => {
      runtimes.delete(allowFontDownloads);
      throw error;
    });
    runtimes.set(allowFontDownloads, runtime);
  }
  return runtime;
}

function mapResume(runtime: CompilerRuntime, resume: ResumeData): void {
  const config = DEFAULT_TEMPLATE.config(resume);
  runtime.compiler.mapShadow(`${VIRTUAL_ROOT}resume.json`, encoder.encode(JSON.stringify(resume)));
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
  callbacks: CompileCallbacks,
): Promise<Uint8Array> {
  const runtime = await getRuntime(allowFontDownloads, callbacks);
  let resolveResult: (value: Uint8Array) => void = () => undefined;
  let rejectResult: (reason: unknown) => void = () => undefined;
  const result = new Promise<Uint8Array>((resolve, reject) => {
    resolveResult = resolve;
    rejectResult = reject;
  });

  runtime.queue = runtime.queue
    .then(async () => {
      mapResume(runtime, resume);
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
      runtimes.delete(allowFontDownloads);
      rejectResult(error);
    });

  return result;
}

export function compilePreview(
  resume: ResumeData,
  allowFontDownloads: boolean,
  callbacks: CompileCallbacks = {},
): Promise<Uint8Array> {
  return compile(resume, CompileFormatEnum.vector, allowFontDownloads, callbacks);
}

export function compilePdf(
  resume: ResumeData,
  allowFontDownloads: boolean,
  callbacks: CompileCallbacks = {},
): Promise<Uint8Array> {
  return compile(resume, CompileFormatEnum.pdf, allowFontDownloads, callbacks);
}
