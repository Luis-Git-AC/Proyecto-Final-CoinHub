import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // El manifest ya existe y está enlazado en index.html
      // (public/site.webmanifest); este plugin solo añade el service worker.
      manifest: false,
      registerType: "autoUpdate",
      injectRegister: "auto",
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,woff2}"],
        navigateFallbackDenylist: [/^\/api\//],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./src/test/setup.ts",
    css: false,
    // e2e/ son specs de Playwright, no de Vitest — sin este exclude, Vitest
    // intenta importarlos y falla porque llaman a su propio test() global.
    exclude: ["**/node_modules/**", "**/.git/**", "e2e/**"],
  },
});
