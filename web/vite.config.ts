import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// During dev, proxy /api to the Fastify backend so there are no CORS issues.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
});
