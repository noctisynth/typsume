// scripts/compile-template.mjs
//
// Render a resume.json through a typst.ts WASM compiler, using the
// templates/default template, into PDF.
//
// Usage:
//   bun run scripts/compile-template.mjs <path-to-resume.json> [-o output.pdf]
//   bun run scripts/compile-template.mjs                            # default: examples/sample/resume.json
//
// Output goes to .smoke-out/<input-stem>.pdf by default.
//
// This script doubles as the smoke test for W2 (templates/default must
// compile end-to-end) and as a reference for the future packages/cli
// build command — the typst.ts wiring is the same shape CLI will use.

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { CompileFormatEnum, createTypstCompiler } from '@myriaddreamin/typst.ts/compiler';
import { MemoryAccessModel } from '@myriaddreamin/typst.ts/fs/memory';
import { withAccessModel } from '@myriaddreamin/typst.ts/options.init';

const repoRoot = resolve(import.meta.dirname, '..');
const templateDir = resolve(repoRoot, 'templates/default');

// ---------- argv ----------

const argv = process.argv.slice(2);
let inputArg = null;
let outputArg = null;
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === '-o' || a === '--output') {
    outputArg = argv[++i];
  } else if (!inputArg) {
    inputArg = a;
  }
}
const resumeJsonPath = inputArg
  ? resolve(process.cwd(), inputArg)
  : resolve(repoRoot, 'examples/sample/resume.json');
const outputPath = outputArg
  ? resolve(process.cwd(), outputArg)
  : resolve(repoRoot, '.smoke-out', `${resumeJsonPath.split('/').pop().replace(/\.[^.]+$/, '')}.pdf`);

// ---------- meta.toml -> cfg_*.json ----------

const metaToml = readFileSync(resolve(templateDir, 'meta.toml'), 'utf8');
function parseMetaToml(text) {
  const out = {};
  const lines = text.split(/\r?\n/);
  let section = null;
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const sec = trimmed.match(/^\[(.+)\]$/);
    if (sec) {
      section = sec[1];
      if (!out[section]) out[section] = {};
      continue;
    }
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    else if (val === 'true') val = true;
    else if (val === 'false') val = false;
    else if (/^-?\d+(\.\d+)?$/.test(val)) val = Number(val);
    const target = section ? out[section] : out;
    target[key] = val;
  }
  return out;
}
const meta = parseMetaToml(metaToml);
const cfg = meta.config;

const colors = {
  theme: cfg['theme-color'],
  main: cfg['main-color'],
  secondary: cfg['secondary-color'],
  link: cfg['link-color'],
  icon: cfg['icon-color'],
};
const fonts = { main: cfg.font, mono: cfg['mono-font'] };
const sizes = {
  font: cfg['font-size'],
  heading: cfg['heading-size'],
  list: cfg['list-size'],
  item_title: cfg['item-title-size'],
};
const layout = {
  margin_top: cfg['margin-top'],
  margin_bottom: cfg['margin-bottom'],
  margin_left: cfg['margin-left'],
  margin_right: cfg['margin-right'],
  gutter_width: cfg['gutter-width'],
  side_width: cfg['side-width'],
};

// ---------- virtual workspace ----------

const fsAcc = new MemoryAccessModel();
function insertAbs(absPath, content) {
  fsAcc.insertFile(absPath, new TextEncoder().encode(content), new Date());
}

// MemoryAccessModel only resolves paths prefixed with `/@memory/`
const VROOT = '/@memory/';

const templateText = readFileSync(resolve(templateDir, 'template.typ'), 'utf8');
insertAbs(`${VROOT}template.typ`, templateText);
insertAbs(`${VROOT}resume.json`, readFileSync(resumeJsonPath, 'utf8'));
insertAbs(`${VROOT}cfg_colors.json`, JSON.stringify(colors));
insertAbs(`${VROOT}cfg_fonts.json`, JSON.stringify(fonts));
insertAbs(`${VROOT}cfg_sizes.json`, JSON.stringify(sizes));
insertAbs(`${VROOT}cfg_layout.json`, JSON.stringify(layout));

// ---------- compile ----------

const compiler = createTypstCompiler();
await compiler.init({
  workspace: VROOT,
  beforeBuild: [withAccessModel(fsAcc)],
});

const doc = await compiler.compile({
  mainFilePath: `${VROOT}template.typ`,
  format: CompileFormatEnum.pdf,
});

if (!(doc.result instanceof Uint8Array)) {
  console.error('compile returned no PDF bytes:', doc);
  if (doc.diagnostics) {
    console.error('diagnostics:', JSON.stringify(doc.diagnostics, null, 2));
  }
  process.exit(1);
}

mkdirSync(resolve(outputPath, '..'), { recursive: true });
writeFileSync(outputPath, doc.result);
console.log(`OK: pdf written to ${outputPath} (${doc.result.byteLength} bytes)`);