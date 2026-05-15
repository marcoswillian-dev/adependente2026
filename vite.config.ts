import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    ssr: false,
  },

  vite: {
    base: "/",

    server: {
      host: "0.0.0.0",
      allowedHosts: [".onrender.com"],
    },

    preview: {
      host: "0.0.0.0",
      allowedHosts: [".onrender.com"],
    },

    build: {
      outDir: "dist",
      emptyOutDir: true,
      assetsDir: "assets",
    },
  },
});