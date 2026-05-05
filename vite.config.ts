import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  logLevel: 'info', // Ativa logs detalhados
  build: {
    target: "esnext",
    minify: "esbuild",
    cssCodeSplit: true,
    chunkSizeWarningLimit: 2500, // Aumentado para evitar avisos em projetos grandes
    rollupOptions: {
      output: {
        // Desativamos manualChunks para deixar o Vite/Rollup gerenciar as dependências
        // Isso elimina erros de circularidade que travam a publicação
        manualChunks: undefined,
      }
    }
  },
}));