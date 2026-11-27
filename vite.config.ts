import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ command }) => ({
  plugins: [react(), tailwindcss()],

  // Local: /
  // Production: /gvx-tech/
  base: command === 'build' ? '/gvx-tech/' : '/',

  server: {
    port: 3000,
    host: '0.0.0.0',
  },
}));