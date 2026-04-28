import { defineConfig } from 'vite'
import { resolve } from 'path'
import react from '@vitejs/plugin-react-swc'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: false,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'esbuild',
    esbuild: {
      drop: ['console', 'debugger'],
    },
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        simulasi: resolve(__dirname, 'simulasi/index.html'),
      },
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom'],
        },
      },
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom'],
  },
})
