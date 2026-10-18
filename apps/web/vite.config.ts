import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [tailwindcss(), react()],
  envDir: "../..",
  server: {
    port: 5173,
    proxy: {
      "/api": { target: "http://localhost:3333", rewrite: (path) => path.replace(/^\/api/, "") },
    },
  },
  test: {
    environment: "jsdom",
    include: ["test/**/*.test.{ts,tsx}"],
    setupFiles: ["test/setup.ts"],
  },
});
