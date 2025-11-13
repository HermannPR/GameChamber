import { defineConfig } from 'vite';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@engine': resolve(__dirname, './src/engine'),
      '@procedural': resolve(__dirname, './src/procedural'),
      '@storage': resolve(__dirname, './src/storage'),
      '@utils': resolve(__dirname, './src/utils'),
    },
  },
  server: {
    port: 5173,
    open: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    target: 'es2020',
    rollupOptions: {
      output: {
        manualChunks: {
          'three': ['three'],
          'audio': ['tone'],
          'procedural': ['simplex-noise', 'poisson-disk-sampling'],
        },
      },
    },
  },
  optimizeDeps: {
    include: ['three', '@iarna/toml', 'localforage'],
  },
});
