import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    // Desativar SSR é o que vai matar a tela preta de vez na Vercel
    ssr: false,
  },
  vite: {
    build: {
      chunkSizeWarningLimit: 1000,
      // Forçamos a saída para 'dist', que é o padrão que a Vercel espera
      outDir: "dist",
      emptyOutDir: true,
    },
    base: "/",
  },
});