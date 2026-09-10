import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    host: true,
    port: 5173,
    // A app roda same-origin com a API em produção. Em dev, encaminha /sibh
    // para o host real (v1/parameters não manda cabeçalho CORS).
    proxy: {
      "/sibh": {
        target: "https://apps.spaguas.sp.gov.br",
        changeOrigin: true,
      },
    },
  },
});
