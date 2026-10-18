import { defineConfig } from 'vite';

export default defineConfig({
  // En GitHub Pages el sitio vive en /Yayantra/; en tu computadora sigue siendo /
  base: process.env.GITHUB_ACTIONS ? '/Yayantra/' : '/',
});