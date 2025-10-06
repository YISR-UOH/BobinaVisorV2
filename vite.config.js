import process from "node:process";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";
import { fileURLToPath } from "url";

const basePath = process.env.BASE_PATH ?? "/BobinaVisorV2/";
const normalizedBase = basePath.endsWith("/") ? basePath : `${basePath}/`;

// https://vite.dev/config/
export default defineConfig({
  base: basePath,
  plugins: [
    react({
      babel: {
        plugins: [["babel-plugin-react-compiler"]],
      },
    }),
    tailwindcss(),
    VitePWA({
      base: normalizedBase,
      registerType: "autoUpdate",
      includeAssets: [
        "icons/logo.png",
        "icons/apple-touch-icon.png",
        "robots.txt",
      ],
      manifest: {
        id: normalizedBase,
        name: "Bobina Visor",
        short_name: "BobinaVisor",
        description:
          "Panel interactivo para visualizar y comparar datos de bobinas.",
        theme_color: "#152340",
        background_color: "#152340",
        start_url: normalizedBase,
        scope: normalizedBase,
        display: "standalone",
        orientation: "portrait-primary",
        icons: [
          {
            src: "icons/pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "icons/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "icons/pwa-maskable-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        navigateFallback: `${normalizedBase}index.html`,
        globPatterns: ["**/*.{js,css,html,ico,png,svg,webmanifest}"],
        maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.destination === "document",
            handler: "NetworkFirst",
            options: {
              cacheName: "html-cache",
            },
          },
          {
            urlPattern: ({ request, sameOrigin }) =>
              sameOrigin &&
              ["style", "script", "image", "font", "worker"].includes(
                request.destination
              ),
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "static-resources",
            },
          },
        ],
      },
      devOptions: {
        enabled: true,
        suppressWarnings: true,
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(path.dirname(fileURLToPath(import.meta.url)), "./src"),
    },
    exclude: ["node_modules", "**/node_modules/*"],
  },
});
