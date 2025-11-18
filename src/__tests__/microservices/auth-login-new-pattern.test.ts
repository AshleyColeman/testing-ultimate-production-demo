/**
 * 🧪 Auth Service - Login Tests (CONVERTED TO SCHEMA ALLOCATOR PATTERN)
 *
 * This demonstrates the new schema allocation strategy:
 *
 * READ TESTS (no mutations):
 * - All read tests in this file share ONE schema
 * - Fast, efficient, no unnecessary isolation
 *
 * WRITE TESTS (mutations - add/update/delete):
 * - Each write test gets its OWN unique schema
 * - Full isolation between mutations
 * - No test pollutes another's data
 *
 * Example:
 * - 2 read tests → share schema 1
 * - 3 write tests → each gets schemas 2, 3, 4 respectively
 */

import { describe, expect, it } from "vitest";
import { createSchemaAllocator } from "../../../tests/schemaAllocator";
import {
  simulateProductionOperation,
  generateTestData,
  formatTestName,
} from "../shared/testHelpers";

// Create schema allocator for 'auth' service
// This automatically partitions schemas: 1 for reads, rest for writes
const { useReadSchema, useWriteSchema } = createSchemaAllocator("auth");

describe("Auth Service - Login (Schema Allocator Pattern)", () => {
  /**
   * ✅ READ TEST - Uses shared read schema
   * Multiple read tests can share one schema safely
   */
  it(
    "should get user login status (READ - shared schema)",
    useReadSchema(async ({ db, schema, schemaName }) => {
      const executionTime = await simulateProductionOperation();
      const testData = generateTestData("session");

      // Simulate reading login status (SELECT only)
      console.log(`📖 READ: Checking login status on schema: ${schemaName}`);

      // Query existing data
      const result = await db.$queryRawUnsafe(
        `SELECT * FROM "${schemaName}".test_data WHERE test_type = 'auth-login' LIMIT 5`
      );

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(executionTime).toBeGreaterThan(0);

      console.log(
        `✅ READ completed in ${executionTime}ms (schema: ${schemaName})`
      );
    })
  );

  /**
   * ✅ READ TEST - Uses SAME shared read schema as above
   * No mutations, so safe to share
   */
  it(
    "should list all active sessions (READ - shared schema)",
    useReadSchema(async ({ db, schema, schemaName }) => {
      const executionTime = await simulateProductionOperation();

      // Simulate reading sessions (SELECT only)
      console.log(`📖 READ: Listing active sessions on schema: ${schemaName}`);

      const result = await db.$queryRawUnsafe(
        `SELECT COUNT(*) as count FROM "${schemaName}".test_data`
      );

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);

      console.log(
        `✅ READ completed in ${executionTime}ms (schema: ${schemaName})`
      );
    })
  );

  /**
   * 🔄 WRITE TEST - Gets unique schema #1
   * Creates new data, needs isolation
   */
  it(
    "should create new login session (WRITE - unique schema)",
    useWriteSchema(async ({ db, schema, schemaName }) => {
      const executionTime = await simulateProductionOperation();
      const testData = generateTestData("session");

      // Simulate creating a login session (INSERT)
      console.log(`✏️  WRITE: Creating login session on schema: ${schemaName}`);

      await db.$executeRawUnsafe(`
        INSERT INTO "${schemaName}".test_data 
        (test_type, test_name, test_result, execution_time_ms, metadata)
        VALUES (
          'auth-login',
          'create-session',
          'success',
          ${executionTime},
          '${JSON.stringify(testData)}'::jsonb
        )
      `);

      // Verify insertion
      const result = await db.$queryRawUnsafe<Array<{ count: bigint }>>(
        `SELECT COUNT(*) as count FROM "${schemaName}".test_data WHERE test_name = 'create-session'`
      );

      expect(result[0].count).toBeGreaterThanOrEqual(1n);
      console.log(
        `✅ WRITE completed in ${executionTime}ms (schema: ${schemaName})`
      );
    })
  );

  /**
   * 🔄 WRITE TEST - Gets unique schema #2 (different from above)
   * Updates data, needs its own space
   */
  it(
    "should update user password (WRITE - unique schema)",
    useWriteSchema(async ({ db, schema, schemaName }) => {
      const executionTime = await simulateProductionOperation();

      console.log(`✏️  WRITE: Updating user password on schema: ${schemaName}`);

      // First insert a record to update
      await db.$executeRawUnsafe(`
        INSERT INTO "${schemaName}".test_data 
        (test_type, test_name, test_result, execution_time_ms)
        VALUES ('auth-login', 'password-update-target', 'pending', 0)
      `);

      // Then update it
      await db.$executeRawUnsafe(`
        UPDATE "${schemaName}".test_data 
        SET test_result = 'updated', execution_time_ms = ${executionTime}
        WHERE test_name = 'password-update-target'
      `);

      // Verify update
      const result = await db.$queryRawUnsafe<Array<{ test_result: string }>>(
        `SELECT test_result FROM "${schemaName}".test_data WHERE test_name = 'password-update-target'`
      );

      expect(result[0].test_result).toBe("updated");
      console.log(
        `✅ WRITE completed in ${executionTime}ms (schema: ${schemaName})`
      );
    })
  );

  /**
   * 🔄 WRITE TEST - Gets unique schema #3 (different from both above)
   * Deletes data, fully isolated
   */
  it(
    "should revoke login session (WRITE - unique schema)",
    useWriteSchema(async ({ db, schema, schemaName }) => {
      const executionTime = await simulateProductionOperation();

      console.log(`✏️  WRITE: Revoking login session on schema: ${schemaName}`);

      // Insert a record to delete
      await db.$executeRawUnsafe(`
        INSERT INTO "${schemaName}".test_data 
        (test_type, test_name, test_result, execution_time_ms)
        VALUES ('auth-login', 'session-to-revoke', 'active', ${executionTime})
      `);

      // Delete it
      await db.$executeRawUnsafe(`
        DELETE FROM "${schemaName}".test_data 
        WHERE test_name = 'session-to-revoke'
      `);

      // Verify deletion
      const result = await db.$queryRawUnsafe<Array<{ count: bigint }>>(
        `SELECT COUNT(*) as count FROM "${schemaName}".test_data WHERE test_name = 'session-to-revoke'`
      );

      expect(result[0].count).toBe(0n);
      console.log(
        `✅ WRITE completed in ${executionTime}ms (schema: ${schemaName})`
      );
    })
  );

  /**
   * ✅ READ TEST - Uses SAME shared read schema as first two reads
   * Verifies multiple reads can coexist
   */
  it(
    "should verify session token (READ - shared schema)",
    useReadSchema(async ({ db, schema, schemaName }) => {
      const executionTime = await simulateProductionOperation();

      console.log(`📖 READ: Verifying session token on schema: ${schemaName}`);

      const result = await db.$queryRawUnsafe(
        `SELECT * FROM "${schemaName}".test_data WHERE test_type = 'auth-login' ORDER BY timestamp DESC LIMIT 1`
      );

      expect(result).toBeDefined();
      console.log(
        `✅ READ completed in ${executionTime}ms (schema: ${schemaName})`
      );
    })
  );
});

/**
 * 📊 SUMMARY:
 *
 * This file has 6 tests:
 * - 3 READ tests → All share 1 schema (efficient!)
 * - 3 WRITE tests → Each gets its own schema (isolated!)
 *
 * Schema allocation:
 * 1. auth_schema_1 → Shared by all 3 read tests
 * 2. auth_schema_2 → Used by "create new login session"
 * 3. auth_schema_3 → Used by "update user password"
 * 4. auth_schema_4 → Used by "revoke login session"
 *
 * Benefits:
 * ✅ Reads are fast and don't need isolation
 * ✅ Writes can't interfere with each other
 * ✅ Clear, explicit test intent (read vs write)
 * ✅ Scales to any number of tests
 */
