import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    // DESATIVAMOS o SSR para evitar o erro de MIME type na Vercel
    ssr: false,
  },
  vite: {
    build: {
      chunkSizeWarningLimit: 1000,
      // Garante que o output seja limpo e organizado
      outDir: "dist/client",
      emptyOutDir: true,
    },
    // Força o caminho base para absoluto, evitando erro de carregamento de assets
    base: "/",
  },
});