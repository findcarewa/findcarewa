import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  // Relative base so the built assets resolve correctly when the site is
  // hosted under a subpath (e.g. GitHub Pages: username.github.io/repo-name/).
  base: './',
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
