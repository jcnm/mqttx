import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      // Provide empty stubs for Node.js modules
      'node:url': resolve(__dirname, './src/stubs/node-url.ts'),
      'node:path': resolve(__dirname, './src/stubs/node-path.ts'),
    },
  },
  optimizeDeps: {
    exclude: ['@sparkplug/codec'],
  },
  server: {
    port: 5173,
    host: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      external: [],
    },
  },
});
