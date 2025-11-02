import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

const basePath =
  process.env.VITE_BASE_PATH ??
  (process.env.NODE_ENV === 'production' ? '/Mini-Game/' : '/');

export default defineConfig({
  plugins: [react()],
  base: basePath,
  resolve: {
    alias: {
      '@game-engine': path.resolve(__dirname, '../..', 'packages/game-engine/src'),
      '@shared': path.resolve(__dirname, '../..', 'packages/shared/src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
      '/ws': {
        target: 'ws://localhost:4000',
        ws: true,
      },
    },
  },
});
