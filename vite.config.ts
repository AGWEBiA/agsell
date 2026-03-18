import { defineConfig } from "vite";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  resolve: {
    dedupe: ["react", "react-dom"],
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: undefined,
        chunkFileNames: "assets/[hash].js",
        entryFileNames: "assets/[hash].js",
        assetFileNames: "assets/[hash].[ext]",
      },
    },
  },
});
