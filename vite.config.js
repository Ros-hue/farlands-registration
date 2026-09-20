import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    host: '127.0.0.1',
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  preview: {
    host: '127.0.0.1',
    port: 4173,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/three/src/renderers') || id.includes('node_modules/three/build/three.module')) return 'three-renderer';
          if (id.includes('node_modules/three/build/three.core')) return 'three-core';
          if (id.includes('node_modules/three/')) return 'three-addons';
        },
      },
    },
  },
});
