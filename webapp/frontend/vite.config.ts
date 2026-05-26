import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Build into webapp/frontend/dist (served by the Python server).
// `npm run dev` runs on :5173 and proxies API/WS to the Python server on :38888.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://127.0.0.1:38888',
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false,
  },
})
