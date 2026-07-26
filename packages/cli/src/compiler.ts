import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { CompileFormatEnum, createTypstCompiler } from '@myriaddreamin/typst.ts/compiler';
import { MemoryAccessModel } from '@myriaddreamin/typst.ts/fs/memory';
import { loadFonts, withAccessModel } from '@myriaddreamin/typst.ts/options.init';

const VROOT = '/@memory/';

let compiler: ReturnType<typeof createTypstCompiler> | null = null;

async function ensureWasm(): Promise<void> {
  if (compiler) return;
  compiler = createTypstCompiler();
}

export interface CompileOptions {
  templateDir: string;
  resumeJson: string;
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

  insert(`${VROOT}template.typ`, readFileSync(resolve(opts.templateDir, 'template.typ'), 'utf-8'));
  insert(`${VROOT}resume.json`, opts.resumeJson);
  insert(`${VROOT}cfg_colors.json`, JSON.stringify(opts.config.colors));
  insert(`${VROOT}cfg_fonts.json`, JSON.stringify(opts.config.fonts));
  insert(`${VROOT}cfg_sizes.json`, JSON.stringify(opts.config.sizes));
  insert(`${VROOT}cfg_layout.json`, JSON.stringify(opts.config.layout));

  const iconsDir = resolve(opts.templateDir, 'icons');
  if (existsSync(iconsDir)) {
    for (const entry of readdirSync(iconsDir)) {
      if (!entry.endsWith('.svg')) continue;
      insert(`${VROOT}icons/${entry}`, readFileSync(resolve(iconsDir, entry)));
    }
  }

  const fontsDir = resolve(opts.templateDir, 'fonts');
  const fontBlobs: Uint8Array[] = [];
  if (existsSync(fontsDir)) {
    for (const entry of readdirSync(fontsDir)) {
      if (!entry.endsWith('.ttf') && !entry.endsWith('.otf')) continue;
      fontBlobs.push(readFileSync(resolve(fontsDir, entry)));
    }
  }

  if (!compiler) throw new Error('compiler not initialized');

  await compiler.init({
    workspace: VROOT,
    beforeBuild: [loadFonts(fontBlobs, { assets: false }), withAccessModel(fsAcc)],
  });

  const doc = await compiler.compile({
    mainFilePath: `${VROOT}template.typ`,
    format: CompileFormatEnum.pdf,
  });

  if (!(doc.result instanceof Uint8Array)) {
    const diag = doc.diagnostics ? JSON.stringify(doc.diagnostics, null, 2) : 'no diagnostics';
    throw new Error(`typst compile failed:\n${diag}`);
  }

  return { pdf: doc.result, bytes: doc.result.byteLength };
}
