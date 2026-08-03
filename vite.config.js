import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages serves a project site at https://<user>.github.io/<repo>/ ,
// so the app is NOT at the domain root. Set VITE_BASE to "/<repo-name>/"
// in the deploy workflow. Locally it stays "/".
export default defineConfig({
  base: process.env.VITE_BASE || '/',
  plugins: [react()],
  build: { outDir: 'dist', sourcemap: false },
});
