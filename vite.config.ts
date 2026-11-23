import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "node:path";

export default defineConfig({
  plugins: [tailwindcss()],
  build: {
    outDir: "dist/client",
    emptyOutDir: true,
    lib: {
      entry: resolve(import.meta.dirname, "src/web/client/main.ts"),
      name: "VMNClient",
      formats: ["iife"],
      fileName: () => "app.js",
    },
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) => {
          if (assetInfo.name && assetInfo.name.endsWith(".css")) {
            return "tailwind.css";
          }
          return "[name][extname]";
        },
      },
    },
  },
});
