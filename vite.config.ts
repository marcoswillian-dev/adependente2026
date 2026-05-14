import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    ssr: false, // Continue mantendo falso para evitar erro de MIME
  },
  vite: {
    base: "/", // ISSO garante que o navegador procure os arquivos na raiz
    build: {
      outDir: "dist",
      emptyOutDir: true,
    },
  },
});