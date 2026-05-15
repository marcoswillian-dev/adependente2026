import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    ssr: false,
  },

  vite: {
    base: "/",

    server: {
      host: "0.0.0.0",
      allowedHosts: ["adependente2026.onrender.com"],
    },

    preview: {
      host: "0.0.0.0",
      allowedHosts: ["adependente2026.onrender.com"],
    },

    build: {
      // Gera a build na pasta dist
      outDir: "dist",
      emptyOutDir: true,
      assetsDir: "assets",
    },
  },
});