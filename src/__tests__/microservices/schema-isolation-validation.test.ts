/**
 * 🧪 SCHEMA ISOLATION VALIDATION TEST
 *
 * This test file validates that the schema allocation system provides proper isolation:
 *
 * 1. READ tests share ONE schema and don't interfere with each other
 * 2. WRITE tests each get UNIQUE schemas with full isolation
 * 3. READ and WRITE schemas are completely separate
 * 4. No cross-contamination occurs between tests
 *
 * This is a critical validation for the parallel testing POC.
 */

import { describe, expect, it } from "vitest";
import { createSchemaAllocator } from "../../../tests/schemaAllocator";
import { simulateProductionOperation } from "../shared/testHelpers";

// Use a dedicated service for isolation testing
const { useReadSchema, useWriteSchema } = createSchemaAllocator("audit");

describe("Schema Isolation Validation", () => {
  /**
   * READ TEST 1: Insert marker into read schema
   * This will help us verify that all read tests share the same schema
   */
  it(
    "[VALIDATION 1/10] READ - Insert read marker #1",
    useReadSchema(async ({ db, schemaName }) => {
      console.log(`📖 VALIDATION READ #1: Schema = ${schemaName}`);

      const marker = `read_marker_1_${Date.now()}`;

      await db.$executeRawUnsafe(`
        INSERT INTO "${schemaName}".test_data 
        (test_type, test_name, test_result, execution_time_ms, metadata)
        VALUES (
          'isolation-validation',
          '${marker}',
          'read-test-1',
          100,
          '{"test": "read-1"}'::jsonb
        )
      `);

      // Verify insertion
      const result = await db.$queryRawUnsafe<Array<{ count: bigint }>>(
        `SELECT COUNT(*) as count FROM "${schemaName}".test_data WHERE test_name = '${marker}'`
      );

      expect(result[0].count).toBe(1n);
      console.log(`✅ READ #1 completed - Marker inserted: ${marker}`);
    })
  );

  /**
   * READ TEST 2: Verify marker from READ TEST 1 exists
   * This proves read tests share the same schema
   */
  it(
    "[VALIDATION 2/10] READ - Verify read marker #1 exists (shared schema proof)",
    useReadSchema(async ({ db, schemaName }) => {
      console.log(`📖 VALIDATION READ #2: Schema = ${schemaName}`);

      // Query for markers from test 1
      const result = await db.$queryRawUnsafe<Array<{ count: bigint }>>(
        `SELECT COUNT(*) as count FROM "${schemaName}".test_data 
         WHERE test_result = 'read-test-1'`
      );

      // Should find marker from READ TEST 1
      expect(result[0].count).toBeGreaterThanOrEqual(1n);
      console.log(
        `✅ READ #2 completed - Found ${result[0].count} markers from READ #1`
      );
    })
  );

  /**
   * READ TEST 3: Insert another marker and verify both exist
   */
  it(
    "[VALIDATION 3/10] READ - Insert read marker #2 and verify both",
    useReadSchema(async ({ db, schemaName }) => {
      console.log(`📖 VALIDATION READ #3: Schema = ${schemaName}`);

      const marker = `read_marker_2_${Date.now()}`;

      await db.$executeRawUnsafe(`
        INSERT INTO "${schemaName}".test_data 
        (test_type, test_name, test_result, execution_time_ms)
        VALUES ('isolation-validation', '${marker}', 'read-test-3', 100)
      `);

      // Verify we can see markers from ALL read tests
      const result = await db.$queryRawUnsafe<Array<{ count: bigint }>>(
        `SELECT COUNT(*) as count FROM "${schemaName}".test_data 
         WHERE test_result IN ('read-test-1', 'read-test-3')`
      );

      expect(result[0].count).toBeGreaterThanOrEqual(2n);
      console.log(`✅ READ #3 completed - Total markers: ${result[0].count}`);
    })
  );

  /**
   * WRITE TEST 1: Insert unique marker - should NOT be visible to other write tests
   */
  it(
    "[VALIDATION 4/10] WRITE - Insert write marker #1 (isolated)",
    useWriteSchema(async ({ db, schemaName }) => {
      console.log(`✏️  VALIDATION WRITE #1: Schema = ${schemaName}`);

      const marker = `write_marker_1_${Date.now()}`;

      await db.$executeRawUnsafe(`
        INSERT INTO "${schemaName}".test_data 
        (test_type, test_name, test_result, execution_time_ms)
        VALUES ('isolation-validation', '${marker}', 'write-test-1', 100)
      `);

      // Verify insertion
      const result = await db.$queryRawUnsafe<Array<{ count: bigint }>>(
        `SELECT COUNT(*) as count FROM "${schemaName}".test_data WHERE test_name = '${marker}'`
      );

      expect(result[0].count).toBe(1n);

      // CRITICAL: Verify NO markers from other write tests exist
      const otherWriteMarkers = await db.$queryRawUnsafe<
        Array<{ count: bigint }>
      >(
        `SELECT COUNT(*) as count FROM "${schemaName}".test_data 
         WHERE test_result IN ('write-test-2', 'write-test-3')`
      );

      expect(otherWriteMarkers[0].count).toBe(0n);
      console.log(
        `✅ WRITE #1 completed - Isolated (no other write markers found)`
      );
    })
  );

  /**
   * WRITE TEST 2: Insert unique marker - should NOT see WRITE TEST 1's marker
   */
  it(
    "[VALIDATION 5/10] WRITE - Insert write marker #2 (isolated from #1)",
    useWriteSchema(async ({ db, schemaName }) => {
      console.log(`✏️  VALIDATION WRITE #2: Schema = ${schemaName}`);

      const marker = `write_marker_2_${Date.now()}`;

      await db.$executeRawUnsafe(`
        INSERT INTO "${schemaName}".test_data 
        (test_type, test_name, test_result, execution_time_ms)
        VALUES ('isolation-validation', '${marker}', 'write-test-2', 100)
      `);

      // Verify only OUR marker exists
      const result = await db.$queryRawUnsafe<Array<{ count: bigint }>>(
        `SELECT COUNT(*) as count FROM "${schemaName}".test_data 
         WHERE test_result = 'write-test-2'`
      );

      expect(result[0].count).toBe(1n);

      // CRITICAL: Should NOT see write-test-1's marker (different schema)
      const test1Markers = await db.$queryRawUnsafe<Array<{ count: bigint }>>(
        `SELECT COUNT(*) as count FROM "${schemaName}".test_data 
         WHERE test_result = 'write-test-1'`
      );

      expect(test1Markers[0].count).toBe(0n);
      console.log(
        `✅ WRITE #2 completed - Isolated (WRITE #1 marker not visible)`
      );
    })
  );

  /**
   * WRITE TEST 3: Verify isolation from WRITE TEST 1 and 2
   */
  it(
    "[VALIDATION 6/10] WRITE - Verify isolation from previous writes",
    useWriteSchema(async ({ db, schemaName }) => {
      console.log(`✏️  VALIDATION WRITE #3: Schema = ${schemaName}`);

      const marker = `write_marker_3_${Date.now()}`;

      await db.$executeRawUnsafe(`
        INSERT INTO "${schemaName}".test_data 
        (test_type, test_name, test_result, execution_time_ms)
        VALUES ('isolation-validation', '${marker}', 'write-test-3', 100)
      `);

      // Should only see OUR marker
      const ourMarkers = await db.$queryRawUnsafe<Array<{ count: bigint }>>(
        `SELECT COUNT(*) as count FROM "${schemaName}".test_data 
         WHERE test_result = 'write-test-3'`
      );

      expect(ourMarkers[0].count).toBe(1n);

      // Should NOT see any markers from write-test-1 or write-test-2
      const otherMarkers = await db.$queryRawUnsafe<Array<{ count: bigint }>>(
        `SELECT COUNT(*) as count FROM "${schemaName}".test_data 
         WHERE test_result IN ('write-test-1', 'write-test-2')`
      );

      expect(otherMarkers[0].count).toBe(0n);
      console.log(
        `✅ WRITE #3 completed - Fully isolated from WRITE #1 and #2`
      );
    })
  );

  /**
   * WRITE TEST 4: Verify read schema markers are NOT visible in write schema
   */
  it(
    "[VALIDATION 7/10] WRITE - Verify no read markers (schema separation)",
    useWriteSchema(async ({ db, schemaName }) => {
      console.log(`✏️  VALIDATION WRITE #4: Schema = ${schemaName}`);

      // Should NOT see any markers from read tests (different schema)
      const readMarkers = await db.$queryRawUnsafe<Array<{ count: bigint }>>(
        `SELECT COUNT(*) as count FROM "${schemaName}".test_data 
         WHERE test_result IN ('read-test-1', 'read-test-3')`
      );

      expect(readMarkers[0].count).toBe(0n);
      console.log(
        `✅ WRITE #4 completed - No read markers visible (proper separation)`
      );
    })
  );

  /**
   * READ TEST 4: Verify write markers are NOT visible in read schema
   */
  it(
    "[VALIDATION 8/10] READ - Verify no write markers (schema separation)",
    useReadSchema(async ({ db, schemaName }) => {
      console.log(`📖 VALIDATION READ #4: Schema = ${schemaName}`);

      // Should NOT see any markers from write tests (different schemas)
      const writeMarkers = await db.$queryRawUnsafe<Array<{ count: bigint }>>(
        `SELECT COUNT(*) as count FROM "${schemaName}".test_data 
         WHERE test_result IN ('write-test-1', 'write-test-2', 'write-test-3')`
      );

      expect(writeMarkers[0].count).toBe(0n);
      console.log(
        `✅ READ #4 completed - No write markers visible (proper separation)`
      );
    })
  );

  /**
   * READ TEST 5: Verify all read markers are still visible (cumulative)
   */
  it(
    "[VALIDATION 9/10] READ - Verify all read markers cumulative",
    useReadSchema(async ({ db, schemaName }) => {
      console.log(`📖 VALIDATION READ #5: Schema = ${schemaName}`);

      // Should see markers from ALL previous read tests
      const result = await db.$queryRawUnsafe<Array<{ count: bigint }>>(
        `SELECT COUNT(*) as count FROM "${schemaName}".test_data 
         WHERE test_result IN ('read-test-1', 'read-test-3')`
      );

      // Should have at least 2 markers (from READ tests 1 and 3)
      expect(result[0].count).toBeGreaterThanOrEqual(2n);
      console.log(
        `✅ READ #5 completed - All read markers visible: ${result[0].count}`
      );
    })
  );

  /**
   * FINAL VALIDATION: Summary test
   */
  it(
    "[VALIDATION 10/10] Summary - Validate complete isolation model",
    useReadSchema(async ({ db, schemaName }) => {
      console.log(`📖 VALIDATION SUMMARY: Schema = ${schemaName}`);

      const executionTime = await simulateProductionOperation();

      // Count all read markers in read schema
      const readCount = await db.$queryRawUnsafe<Array<{ count: bigint }>>(
        `SELECT COUNT(*) as count FROM "${schemaName}".test_data 
         WHERE test_type = 'isolation-validation' AND test_result LIKE 'read-test-%'`
      );

      // Verify no write markers in read schema
      const writeCount = await db.$queryRawUnsafe<Array<{ count: bigint }>>(
        `SELECT COUNT(*) as count FROM "${schemaName}".test_data 
         WHERE test_type = 'isolation-validation' AND test_result LIKE 'write-test-%'`
      );

      console.log(`\n${"=".repeat(60)}`);
      console.log(`🎯 SCHEMA ISOLATION VALIDATION RESULTS`);
      console.log(`${"=".repeat(60)}`);
      console.log(`📊 Read Schema: ${schemaName}`);
      console.log(
        `   ✅ Read markers found: ${readCount[0].count} (expected ≥2)`
      );
      console.log(
        `   ✅ Write markers found: ${writeCount[0].count} (expected 0)`
      );
      console.log(`\n💡 Validation Status:`);
      console.log(
        `   • READ tests share same schema: ${
          readCount[0].count >= 2n ? "PASS ✅" : "FAIL ❌"
        }`
      );
      console.log(
        `   • READ/WRITE schemas separated: ${
          writeCount[0].count === 0n ? "PASS ✅" : "FAIL ❌"
        }`
      );
      console.log(`   • WRITE tests isolated: VERIFIED IN TESTS 4-7 ✅`);
      console.log(`${"=".repeat(60)}\n`);

      // Assertions
      expect(readCount[0].count).toBeGreaterThanOrEqual(2n);
      expect(writeCount[0].count).toBe(0n);
      expect(executionTime).toBeGreaterThan(0);

      console.log(`✅ ISOLATION VALIDATION COMPLETE - ALL CHECKS PASSED`);
    })
  );
});

/**
 * 📊 EXPECTED BEHAVIOR:
 *
 * READ SCHEMA (shared by tests 1, 2, 3, 4, 5, 9, 10):
 * - Contains markers from ALL read tests
 * - Tests can see each other's data
 * - NO markers from write tests visible
 *
 * WRITE SCHEMAS (tests 4, 5, 6, 7 each get unique schema):
 * - Test 4: Only contains write-test-1 marker
 * - Test 5: Only contains write-test-2 marker
 * - Test 6: Only contains write-test-3 marker
 * - Test 7: Empty (no markers from other write or read tests)
 * - Each is completely isolated
 *
 * This proves:
 * ✅ Read tests share schemas efficiently
 * ✅ Write tests are fully isolated
 * ✅ Read and write schemas are separate
 * ✅ No cross-contamination occurs
 */
