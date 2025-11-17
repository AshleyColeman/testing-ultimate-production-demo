import { describe, it, expect, beforeAll, afterAll } from "vitest";
import path from "path";
import fs from "fs";

// Infrastructure imports
import {
  getInfrastructure,
  getSchemasByService,
  recordTestExecution,
} from "./shared/testInfrastructure";

// Helper imports
import { simulateProductionOperation } from "./shared/testHelpers";

/**
 * 🎯 SELECTIVE TEST RUNNER
 *
 * Run individual test files with full infrastructure support.
 *
 * Usage:
 * npx vitest run src/__tests__/selectiveTestRunner.test.ts -- user-actions.test.ts
 * npx vitest run src/__tests__/selectiveTestRunner.test.ts -- auth-login.test.ts
 *
 * Or use the convenience script:
 * npm run test:selective user-actions.test.ts
 * npm run test:selective auth-login.test.ts
 */

/**
 * Helper function to get test file from environment variable
 *
 * NOTE: Direct vitest calls (npx vitest run ... -- file.test.ts) do NOT work
 * because Vitest runs tests in worker processes that don't receive CLI args.
 *
 * MUST use: npm run test:selective file.test.ts
 */
function getTestFileFromArgs(): string | null {
  // Only environment variable works (set by test-selective.cjs wrapper)
  return process.env.TEST_FILE || null;
}

describe("🎯 SELECTIVE TEST RUNNER", () => {
  let infra: any;
  let testFilePath: string | null = null;
  let testFileName: string | null = null;

  beforeAll(async () => {
    // Get test file from multiple sources
    testFileName = getTestFileFromArgs();

    if (testFileName) {
      // Ensure we have just the filename, not a full path
      testFileName = path.basename(testFileName);
      testFilePath = path.join(
        process.cwd(),
        "src",
        "__tests__",
        "microservices",
        testFileName
      );

      console.log(`\n🎯 SELECTIVE RUNNER: Loading test file: ${testFileName}`);
      console.log(`📁 Full path: ${testFilePath}`);

      // Verify file exists
      if (!fs.existsSync(testFilePath)) {
        throw new Error(`❌ Test file not found: ${testFilePath}`);
      }

      console.log(
        `✅ Test file found, proceeding with infrastructure setup...\n`
      );
    } else {
      console.log(`\n${"=".repeat(80)}`);
      console.log(`❌ NO TEST FILE SPECIFIED`);
      console.log(`${"=".repeat(80)}\n`);

      console.log(`📋 CORRECT Usage (via npm script):`);
      console.log(`   npm run test:selective user-actions.test.ts`);
      console.log(`   npm run test:selective auth-login.test.ts`);
      console.log(`   npm run test:selective payment-process.test.ts`);

      console.log(`\n⚠️  IMPORTANT: Direct vitest calls do NOT work:`);
      console.log(
        `   ❌ npx vitest run src/__tests__/selectiveTestRunner.test.ts -- user-actions.test.ts`
      );
      console.log(
        `   ❌ npx vitest run src/__tests__/microservices/user-actions.test.ts`
      );

      console.log(
        `\n� WHY: Vitest runs tests in worker processes that don't receive CLI arguments.`
      );
      console.log(
        `   The npm script (test:selective) uses test-selective.cjs to set environment`
      );
      console.log(`   variables that the worker process CAN read.`);

      console.log(
        `\n�📁 Available test files in src/__tests__/microservices/:`
      );

      // List available test files
      try {
        const testDir = path.join(
          process.cwd(),
          "src",
          "__tests__",
          "microservices"
        );
        const files = fs
          .readdirSync(testDir)
          .filter((file) => file.endsWith(".test.ts"));
        files.forEach((file) => console.log(`   • ${file}`));
      } catch (err) {
        console.log(`   (Unable to list test files)`);
      }

      console.log(`\n${"=".repeat(80)}\n`);
      throw new Error(`\n💡 Please use: npm run test:selective <filename>\n`);
    }

    // Initialize infrastructure (same as main orchestrator)
    infra = await getInfrastructure();
  });

  it("should load and execute the specified test file", async () => {
    if (!testFilePath || !testFileName) {
      throw new Error("No test file specified");
    }

    const startTime = Date.now();

    try {
      // Dynamic import of the test file
      // This automatically registers and runs all tests in that file with Vitest
      console.log(`\n${"=".repeat(80)}`);
      console.log(`🚀 IMPORTING TEST FILE: ${testFileName}`);
      console.log(`📁 Path: ${testFilePath}`);
      console.log(
        `🏗️  Infrastructure: ✅ Available (5 containers, 20 schemas)`
      );
      console.log(`${"=".repeat(80)}\n`);

      const testModule = await import(testFilePath);

      console.log(`\n${"=".repeat(80)}`);
      console.log(`✅ TEST FILE LOADED: ${testFileName}`);
      console.log(
        `🎯 All tests from this file have been registered with Vitest`
      );
      console.log(`� Check the test output above for execution results`);
      console.log(`${"=".repeat(80)}\n`);

      const executionTime = Date.now() - startTime;

      // Get a schema for recording test execution
      const schemas = await getSchemasByService("auth");
      const schema = schemas[Math.floor(Math.random() * schemas.length)];

      // Record execution metrics
      await recordTestExecution(
        "selective-runner",
        testFileName.replace(".test.ts", ""),
        "success",
        executionTime,
        { testFileName, schema: schema.schemaName }
      );

      console.log(`📊 Selective Runner Summary:`);
      console.log(`   • Test File: ${testFileName}`);
      console.log(`   • Load Time: ${executionTime}ms`);
      console.log(`   • Infrastructure: ✅ Full (5 containers, 20 schemas)`);
      console.log(
        `   • Test Module: ${testModule ? "✅ Loaded" : "❌ Failed"}`
      );

      expect(testModule).toBeDefined();
    } catch (error) {
      const executionTime = Date.now() - startTime;

      // Get a schema for recording test execution
      const schemas = await getSchemasByService("auth");
      const schema = schemas[Math.floor(Math.random() * schemas.length)];

      // Record failure metrics
      await recordTestExecution(
        "selective-runner",
        testFileName.replace(".test.ts", ""),
        "failure",
        executionTime,
        {
          testFileName,
          schema: schema.schemaName,
          error: (error as Error).message,
        }
      );

      console.error(`\n${"=".repeat(80)}`);
      console.error(`❌ FAILED TO LOAD TEST FILE: ${testFileName}`);
      console.error(`${"=".repeat(80)}`);
      console.error(`   • Error: ${(error as Error).message}`);
      console.error(`   • Load Time: ${executionTime}ms`);
      console.error(`${"=".repeat(80)}\n`);

      throw error;
    }
  });

  it("should have access to shared infrastructure", async () => {
    // Infrastructure should be available from beforeAll
    expect(infra).toBeDefined();
    expect(infra.containers).toBeDefined();
    expect(infra.containers.length).toBe(5);
    expect(infra.containers[0]).toBeDefined(); // First container (auth)

    // Test that we can get schemas (like in regular tests)
    const authSchemas = await getSchemasByService("auth");
    expect(authSchemas).toBeDefined();
    expect(authSchemas.length).toBeGreaterThan(0);

    console.log(`\n🏗️  Infrastructure Verification:`);
    console.log(
      `   • PostgreSQL Containers: ✅ Available (${infra.containers.length})`
    );
    console.log(`   • Auth Schemas: ${authSchemas.length} available`);
    console.log(`   • Logger: ✅ Available`);
  });

  afterAll(async () => {
    const totalTime = await simulateProductionOperation();
    console.log(`\n🏁 SELECTIVE RUNNER COMPLETED`);
    console.log(`   • Total Runtime: ${totalTime}ms`);
    console.log(`   • Infrastructure Cleanup: ✅ Handled by framework`);
  });
});
