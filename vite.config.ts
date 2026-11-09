<<<<<<< HEAD
import { defineConfig } from "vite";

export default defineConfig({
  root: "demo",
  publicDir: false,
  server: {
    port: 5173,
    open: true,
  },
  build: {
    outDir: "../demo-dist",
    emptyOutDir: true,
  },
=======
import { defineConfig } from 'vite';

export default defineConfig({
  // Relative paths so the built game works on GitHub Pages, itch.io, or any folder.
  base: './',
>>>>>>> c3dbce401f7b6aec58411fb6f497715633b34a78
});
