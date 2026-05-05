import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  preview: {
    allowedHosts: true,
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
  build: {
    target: "es2020",
    minify: "esbuild",
    cssCodeSplit: true,
    chunkSizeWarningLimit: 3000,
    reportCompressedSize: false,
    emptyOutDir: true,
    rollupOptions: {
      output: {
        // Simplified chunking strategy for better stability
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            // Group heavy libraries to avoid too many small files
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
              return 'vendor-core';
            }
            if (id.includes('@radix-ui') || id.includes('lucide-react')) {
              return 'vendor-ui';
            }
            if (id.includes('@supabase') || id.includes('@tanstack')) {
              return 'vendor-lib';
            }
            // All other node_modules go into a single vendor chunk
            return 'vendor';
          }
        },
      },
    },
  },
}));
