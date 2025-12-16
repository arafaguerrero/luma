const path = require("path");
const { defineConfig } = require("vite");
const react = require("@vitejs/plugin-react");
const { cloudflare } = require("@cloudflare/vite-plugin");
const { mochaPlugins } = require("@getmocha/vite-plugins");

module.exports = defineConfig({
  base: "/",
  plugins: [...mochaPlugins(process.env), react(), cloudflare()],
  server: {
    allowedHosts: true,
  },
  build: {
    chunkSizeWarningLimit: 5000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
