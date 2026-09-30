import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// I test della landing: puri, senza rete né browser. Lo stesso alias `@/` di Next.
export default defineConfig({
  test: { environment: "node", include: ["src/**/*.test.ts"] },
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
});
