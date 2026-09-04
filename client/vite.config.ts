import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';

// server/index.js owns :3002 for the web UI and Socket.IO — the single port this whole
// app is reachable on. In dev, Vite serves the client on its own port and proxies
// Socket.IO through so the browser only ever talks to one origin; in production
// `npm run build` outputs straight into server/public, which server/index.js serves
// as static files.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: path.resolve(__dirname, '../server/public'),
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    proxy: {
      '/socket.io': {
        target: 'http://localhost:3002',
        ws: true,
      },
    },
  },
});
