import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    ssr: false, // Mantém falso para gerar arquivos estáticos puros
  },
  vite: {
    base: '/', // FORÇA o navegador a procurar o JS no lugar certo
    build: {
      outDir: 'dist',
      emptyOutDir: true,
    },
  },
});