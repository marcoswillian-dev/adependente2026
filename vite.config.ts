import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    ssr: false,
  },

  vite: {
    appType: "spa",

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
      outDir: "dist",
      emptyOutDir: true,
      assetsDir: "assets",
    },
  },
});