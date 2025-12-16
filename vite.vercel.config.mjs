import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/",
  plugins: [react()],
  build: {
    outDir: "dist",
    rollupOptions: {
      input: path.resolve("index.html"),
    },
  },
  resolve: {
    alias: {
      "@": path.resolve("./src"),
    },
  },
});
