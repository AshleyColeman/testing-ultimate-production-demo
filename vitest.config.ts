import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    testTimeout: 300000,
    hookTimeout: 300000,
    teardownTimeout: 120000,
    isolate: false,
    pool: "forks",
    poolOptions: {
      forks: {
        singleFork: false,
        minForks: 1,
        maxForks: 10,
      },
    },
    include: ["src/**/*.test.ts", "src/**/*.spec.ts"],
    exclude: ["node_modules", "dist", ".git"],
    reporters: ["verbose"],
    // Run all tests including orchestrator
    sequence: {
      setupFiles: "list",
      hooks: "list",
    },
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: ["node_modules/", "dist/", "tests/"],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@/prisma/client": path.resolve(
        __dirname,
        "./node_modules/.prisma/client"
      ),
    },
  },
});
