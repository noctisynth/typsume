import { readFile } from 'node:fs/promises';
import { parse } from '@iarna/toml';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

function tomlModule() {
  return {
    name: 'typsume-toml-module',
    async load(id: string) {
      if (!id.endsWith('.toml?toml')) return null;
      const source = await readFile(id.slice(0, -'?toml'.length), 'utf8');
      return `export default ${JSON.stringify(parse(source))};`;
    },
  };
}

export default defineConfig({
  plugins: [tomlModule(), react(), tailwindcss()],
  resolve: {
    alias: [{ find: '@', replacement: new URL('./src', import.meta.url).pathname }],
  },
  build: {
    target: 'es2022',
  },
});
