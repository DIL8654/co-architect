import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  envDir: '../backend',
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
  server: {
    port: 5173,
    allowedHosts: ['localhost', 'f85b-2001-4657-8501-0-7d14-95e2-430e-d6e0.ngrok-free.app'],
  },
});
