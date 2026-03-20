import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { evolutionApiPlugin } from "@nutshell/evolution/vite-plugin";
import { fileURLToPath } from "url";
import * as path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SEEDS_DIR = path.join(__dirname, "../studio/public/seeds");

export default defineConfig({
  plugins: [
    react(),
    evolutionApiPlugin(SEEDS_DIR),
  ],
  server: {
    port: 5200,
  },
});
