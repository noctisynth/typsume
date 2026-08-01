import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': new URL('./src', import.meta.url).pathname,
    },
  },
  build: {
    target: 'es2022',
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('@myriaddreamin')) return 'typst-runtime';
          if (id.includes('react-hook-form') || id.includes('@hookform')) return 'form-runtime';
          return undefined;
        },
      },
    },
  },
});
