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
});
