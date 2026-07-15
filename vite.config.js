import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
  build: {
    rollupOptions: {
      output: {
        hashCharacters: "hex",
      },
    },
  },
  plugins: [react()],
});
