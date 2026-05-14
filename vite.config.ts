import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    ssr: false, 
  },
  vite: {
    base: "/", 
    build: {
      // Forçamos o Vite a ignorar a pasta 'client' e jogar tudo na 'dist'
      outDir: "dist",
      emptyOutDir: true,
      assetsDir: "assets",
    },
  },
});