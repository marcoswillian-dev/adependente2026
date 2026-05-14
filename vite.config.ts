import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    ssr: false, // Isso é o que evita a tela preta de "MIME type"
  },
  vite: {
    build: {
      outDir: "dist", // Casando com o seu comando 'mv' do package.json
      emptyOutDir: true,
    },
  },
});