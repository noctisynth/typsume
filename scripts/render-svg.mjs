// Render a compiled vector artifact to SVG. Useful for visually inspecting
// the resume PDF in a browser.
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { CompileFormatEnum, createTypstCompiler } from '@myriaddreamin/typst.ts/compiler';
import { MemoryAccessModel } from '@myriaddreamin/typst.ts/fs/memory';
import { loadFonts, withAccessModel } from '@myriaddreamin/typst.ts/options.init';
import { createTypstRenderer } from '@myriaddreamin/typst.ts/renderer';

const repoRoot = resolve(import.meta.dirname, '..');
const templateDir = resolve(repoRoot, 'templates/default');
const resumeJsonPath = resolve(repoRoot, 'examples/sample/resume.json');

const fs = new MemoryAccessModel();
const VROOT = '/@memory/';

function insertAbs(p, c) {
  fs.insertFile(p, new TextEncoder().encode(c), new Date());
}

insertAbs(`${VROOT}template.typ`, readFileSync(resolve(templateDir, 'template.typ'), 'utf8'));
insertAbs(`${VROOT}resume.json`, readFileSync(resumeJsonPath, 'utf8'));

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
    else if (/^-?\d+(\.\d+)?$/.test(val)) val = Number(val);
    const target = section ? out[section] : out;
    target[key] = val;
  }
  return out;
}
const cfg = parseMetaToml(metaToml).config;
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
for (const [name, obj] of [
  ['cfg_colors', colors],
  ['cfg_fonts', fonts],
  ['cfg_sizes', sizes],
  ['cfg_layout', layout],
]) {
  insertAbs(`${VROOT}${name}.json`, JSON.stringify(obj));
}

for (const entry of readdirSync(resolve(templateDir, 'icons'))) {
  if (!entry.endsWith('.svg')) continue;
  insertAbs(`${VROOT}icons/${entry}`, readFileSync(resolve(templateDir, 'icons', entry), 'utf8'));
}

const fontBlobs = readdirSync(resolve(templateDir, 'fonts'))
  .filter((e) => e.endsWith('.ttf') || e.endsWith('.otf'))
  .map((e) => readFileSync(resolve(templateDir, 'fonts', e)));

const compiler = createTypstCompiler();
await compiler.init({
  workspace: VROOT,
  beforeBuild: [loadFonts(fontBlobs, { assets: false }), withAccessModel(fs)],
});

// First compile to vector format so we have an artifact we can render
const doc = await compiler.compile({
  mainFilePath: `${VROOT}template.typ`,
  format: CompileFormatEnum.vector,
});
if (!(doc.result instanceof Uint8Array)) {
  console.error('vector compile failed:', JSON.stringify(doc.diagnostics, null, 2));
  process.exit(1);
}
const vector = doc.result;

// Now create the renderer. The renderer needs the SAME fonts + access model.
const renderer = createTypstRenderer();
await renderer.init({
  workspace: VROOT,
  beforeBuild: [loadFonts(fontBlobs, { assets: false }), withAccessModel(fs)],
});

const svgResult = await renderer.renderToSvg({
  artifactContent: vector,
  container: null,
  pixelPerPt: 3,
});

if (typeof svgResult === 'boolean' && !svgResult) {
  console.error('renderToSvg returned false');
  process.exit(1);
}

const out = resolve(repoRoot, '.smoke-out', 'sample.svg');
mkdirSync(resolve(out, '..'), { recursive: true });
writeFileSync(out, String(svgResult));
console.log('OK svg written to', out, 'length', String(svgResult).length);
