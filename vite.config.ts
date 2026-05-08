import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
    client: { entry: "src/client-entry.tsx" },
  },
  vite: {
    build: {
      chunkSizeWarningLimit: 1000,
    },
  },
});