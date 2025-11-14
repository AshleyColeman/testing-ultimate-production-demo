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
import {
  simulateProductionOperation,
} from "./shared/testHelpers";

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

describe("🎯 SELECTIVE TEST RUNNER", () => {
  let infra: any;
  let testFilePath: string | null = null;
  let testFileName: string | null = null;

  beforeAll(async () => {
    // Get test file from environment variable (most reliable approach)
    testFileName = process.env.TEST_FILE || null;

    if (testFileName) {
      testFilePath = path.join(process.cwd(), 'src', '__tests__', 'microservices', testFileName);

      console.log(`\n🎯 SELECTIVE RUNNER: Loading test file: ${testFileName}`);
      console.log(`📁 Full path: ${testFilePath}`);

      // Verify file exists
      if (!fs.existsSync(testFilePath)) {
        throw new Error(`❌ Test file not found: ${testFilePath}`);
      }

      console.log(`✅ Test file found, proceeding with infrastructure setup...\n`);
    } else {
      console.log(`\n❌ No test file specified.`);
      console.log(`\n📋 Usage Examples:`);
      console.log(`   npx vitest run src/__tests__/selectiveTestRunner.test.ts -- user-actions.test.ts`);
      console.log(`   npx vitest run src/__tests__/selectiveTestRunner.test.ts -- auth-login.test.ts`);
      console.log(`   npx vitest run src/__tests__/selectiveTestRunner.test.ts -- payment-process.test.ts`);
      console.log(`   npm run test:selective user-actions.test.ts`);
      console.log(`\n📁 Available test files in src/__tests__/microservices/:`);

      // List available test files
      try {
        const testDir = path.join(process.cwd(), 'src', '__tests__', 'microservices');
        const files = fs.readdirSync(testDir).filter(file => file.endsWith('.test.ts'));
        files.forEach(file => console.log(`   • ${file}`));
      } catch (err) {
        console.log(`   (Unable to list test files)`);
      }

      throw new Error(`\n💡 Please specify a test file to run.\n`);
    }

    // Initialize infrastructure (same as main orchestrator)
    infra = await getInfrastructure();
  });

  it("should run the specified test file with full infrastructure", async () => {
    if (!testFilePath || !testFileName) {
      throw new Error("No test file specified");
    }

    const startTime = Date.now();

    try {
      // Dynamic import of the test file
      console.log(`🚀 Loading test file: ${testFileName}`);
      const testModule = await import(testFilePath);

      console.log(`✅ Test file loaded successfully`);
      console.log(`🎯 Running tests from ${testFileName}...`);

      // Get test file name for metrics (remove .test.ts extension)
      const baseTestName = testFileName.replace('.test.ts', '');

      // Execute the test file by running vitest on the specific file
      const { exec } = require('child_process');
      const { promisify } = require('util');
      const execAsync = promisify(exec);

      // Set environment variable for the test file and run vitest
      const testCommand = process.platform === 'win32'
        ? `set TEST_FILE=${testFileName}&& npx vitest run "${testFilePath}"`
        : `TEST_FILE="${testFileName}" npx vitest run "${testFilePath}"`;

      console.log(`🔧 Executing: ${testCommand}`);

      const { stdout, stderr } = await execAsync(testCommand, {
        cwd: process.cwd(),
        env: { ...process.env, TEST_FILE: testFileName }
      });

      // Output the test results
      if (stdout) {
        console.log('\n📋 Test Results:');
        console.log(stdout);
      }

      if (stderr && !stderr.includes('WARN')) {
        console.error('\n⚠️ Test Warnings/Errors:');
        console.error(stderr);
      }

      const executionTime = Date.now() - startTime;

      // Get a schema for recording test execution (following pattern from other tests)
      const schemas = await getSchemasByService("auth");
      const schema = schemas[Math.floor(Math.random() * schemas.length)];

      // Record execution metrics following the same pattern as working tests
      await recordTestExecution(
        "selective-runner",
        baseTestName,
        "success",
        executionTime,
        { testNumber: 1, schema: schema.schemaName }
      );

      console.log(`\n📊 Test Execution Summary:`);
      console.log(`   • Test File: ${testFileName}`);
      console.log(`   • Execution Time: ${executionTime}ms`);
      console.log(`   • Status: ✅ SUCCESS`);
      console.log(`   • Infrastructure: Full (5 containers, 20 schemas)`);

      expect(true).toBe(true); // Test passed if we got here without errors

    } catch (error) {
      const executionTime = Date.now() - startTime;

      // Get a schema for recording test execution (following pattern from other tests)
      const schemas = await getSchemasByService("auth");
      const schema = schemas[Math.floor(Math.random() * schemas.length)];

      // Record failure metrics following the same pattern as working tests
      await recordTestExecution(
        "selective-runner",
        testFileName.replace('.test.ts', ''),
        "failure",
        executionTime,
        { testNumber: 1, schema: schema.schemaName }
      );

      console.error(`\n❌ Test Execution Failed:`);
      console.error(`   • Test File: ${testFileName}`);
      console.error(`   • Error: ${(error as Error).message}`);
      console.error(`   • Execution Time: ${executionTime}ms`);

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
    console.log(`   • PostgreSQL Containers: ✅ Available (${infra.containers.length})`);
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