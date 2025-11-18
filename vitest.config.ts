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
        singleFork: false, // Allow parallel execution
        minForks: 1,
        maxForks: 6, // Run up to 6 test files in parallel
      },
    },
    // 🌍 Global setup - runs ONCE across all workers
    globalSetup: ["./tests/globalSetup.ts"],
    // 🌍 Setup file - runs in each worker thread
    setupFiles: ["./tests/setupFile.ts"],
    include: ["src/**/*.test.ts", "src/**/*.spec.ts"],
    exclude: ["node_modules", "dist", ".git"],
    reporters: ["verbose"],
    // Run all tests including orchestrator
    sequence: {
      setupFiles: "list",
      hooks: "list",
      concurrent: false, // Keep deterministic for schema allocation
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
      "@/tests": path.resolve(__dirname, "./tests"),
      "@/prisma/client": path.resolve(
        __dirname,
        "./node_modules/.prisma/client"
      ),
    },
  },
});
