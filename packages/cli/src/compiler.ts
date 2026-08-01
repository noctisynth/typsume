import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { relative, resolve, sep } from 'node:path';
import { CompileFormatEnum, createTypstCompiler } from '@myriaddreamin/typst.ts/compiler';
import { MemoryAccessModel } from '@myriaddreamin/typst.ts/fs/memory';
import { loadFonts, withAccessModel } from '@myriaddreamin/typst.ts/options.init';
import { ExitCode, TypsumeError } from './errors.ts';
import { loadRemoteFonts } from './font-resources.ts';
import type { FontResource } from './meta.ts';

const VROOT = '/@memory/';

let compiler: ReturnType<typeof createTypstCompiler> | null = null;

async function ensureWasm(): Promise<void> {
  if (compiler) return;
  try {
    compiler = createTypstCompiler();
  } catch (error) {
    throw new TypsumeError(
      `Failed to initialize typst.ts WASM compiler: ${(error as Error).message}`,
      ExitCode.wasmInit,
    );
  }
}

export interface CompileOptions {
  templateDir: string;
  resumeJson: string;
  fontCacheDir: string;
  fontResources?: FontResource[];
  config: {
    colors: Record<string, string>;
    fonts: { main: string; mono: string };
    sizes: Record<string, number>;
    layout: Record<string, string>;
  };
}

export interface CompileResult {
  pdf: Uint8Array;
  bytes: number;
}

export async function compileWithTemplate(opts: CompileOptions): Promise<CompileResult> {
  await ensureWasm();

  const fsAcc = new MemoryAccessModel();

  function insert(absPath: string, content: Uint8Array | string): void {
    const bytes = typeof content === 'string' ? new TextEncoder().encode(content) : content;
    fsAcc.insertFile(absPath, bytes, new Date());
  }

  function insertTemplateResources(directory: string): void {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const sourcePath = resolve(directory, entry.name);
      if (entry.isDirectory()) {
        insertTemplateResources(sourcePath);
        continue;
      }
      if (!entry.isFile() || entry.name === 'meta.toml') continue;
      if (entry.name.endsWith('.ttf') || entry.name.endsWith('.otf')) continue;

      const workspacePath = relative(opts.templateDir, sourcePath).split(sep).join('/');
      insert(`${VROOT}${workspacePath}`, readFileSync(sourcePath));
    }
  }

  insertTemplateResources(opts.templateDir);
  insert(`${VROOT}resume.json`, opts.resumeJson);
  insert(`${VROOT}cfg_colors.json`, JSON.stringify(opts.config.colors));
  insert(`${VROOT}cfg_fonts.json`, JSON.stringify(opts.config.fonts));
  insert(`${VROOT}cfg_sizes.json`, JSON.stringify(opts.config.sizes));
  insert(`${VROOT}cfg_layout.json`, JSON.stringify(opts.config.layout));

  const fontsDir = resolve(opts.templateDir, 'fonts');
  const fontBlobs: Uint8Array[] = [];
  if (existsSync(fontsDir)) {
    for (const entry of readdirSync(fontsDir)) {
      if (!entry.endsWith('.ttf') && !entry.endsWith('.otf')) continue;
      fontBlobs.push(readFileSync(resolve(fontsDir, entry)));
    }
  }
  fontBlobs.push(
    ...(await loadRemoteFonts(opts.fontResources ?? [], { cacheDir: opts.fontCacheDir })),
  );

  if (!compiler) throw new Error('compiler not initialized');

  try {
    await compiler.init({
      workspace: VROOT,
      beforeBuild: [loadFonts(fontBlobs, { assets: false }), withAccessModel(fsAcc)],
    } as never);
  } catch (error) {
    throw new TypsumeError(
      `Failed to initialize typst.ts WASM workspace: ${(error as Error).message}`,
      ExitCode.wasmInit,
    );
  }

  let doc: Awaited<ReturnType<typeof compiler.compile>>;
  try {
    doc = await compiler.compile({
      mainFilePath: `${VROOT}template.typ`,
      format: CompileFormatEnum.pdf,
    });
  } catch (error) {
    throw new TypsumeError(
      `Typst compilation failed: ${(error as Error).message}`,
      ExitCode.compile,
    );
  }

  if (!(doc.result instanceof Uint8Array)) {
    const diag = doc.diagnostics ? JSON.stringify(doc.diagnostics, null, 2) : 'no diagnostics';
    throw new TypsumeError(`Typst compilation failed:\n${diag}`, ExitCode.compile);
  }

  return { pdf: doc.result, bytes: doc.result.byteLength };
}
