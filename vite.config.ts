import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
export default defineConfig({
  plugins: [react(), tailwindcss()],
  root: "apps/web",
  build: {
    outDir: process.env.WEB_DIST_PATH ?? "../../dist/web",
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    proxy: {
      "/api": process.env.ANUMITRA_DEV_API_ORIGIN ?? "http://127.0.0.1:3000",
    },
  },
});
