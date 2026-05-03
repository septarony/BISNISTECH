import { defineConfig } from 'vite'
import { resolve } from 'path'
import react from '@vitejs/plugin-react-swc'

export default defineConfig({
  plugins: [react()],
  server: { port: 5173, strictPort: false },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'esbuild',
    chunkSizeWarningLimit: 700,
    esbuild: { drop: ['console', 'debugger'] },
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        katalog: resolve(__dirname, 'katalog-antrian.html'),
        simulasi: resolve(__dirname, 'simulasi/index.html'),
        edukasi: resolve(__dirname, 'edukasi/index.html'),
        admin: resolve(__dirname, 'admin/index.html'),
      },
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          tiptap: ['@tiptap/react', '@tiptap/starter-kit', '@tiptap/extension-link', '@tiptap/extension-image'],
        },
      },
    },
  },
  optimizeDeps: { include: ['react', 'react-dom'] },
})
