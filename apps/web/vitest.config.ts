import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      // server-only throws outside a React Server Component bundle; unit tests import server modules directly
      "server-only": path.join(import.meta.dirname, "test/server-only.ts"),
      "@": path.join(import.meta.dirname, "src"),
    },
  },
});
