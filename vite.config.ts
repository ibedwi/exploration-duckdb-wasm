import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tailwindcss(), reactRouter(), tsconfigPaths()],
  // QUESTION: What is optimizeDeps in vite.config.ts?
  optimizeDeps: {
    exclude: ["@duckdb/duckdb-wasm"],
  },
  // QUESTION: What is worker bundle in vite.config.ts?
  // QUESTION: Why it necessary to specify the format?
  worker: {
    format: "es",
  },
});
