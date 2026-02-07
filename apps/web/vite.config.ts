import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  define: {
    // In production, API is served from the same origin
    'import.meta.env.VITE_API_URL': mode === 'production' ? '""' : '"http://localhost:3001"',
  },
  server: {
    port: 3000,
    host: true,
    proxy: {
      '/auth': 'http://localhost:3001',
      '/vault': 'http://localhost:3001',
      '/health': 'http://localhost:3001',
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
}));
