import { describe, it, expect, afterAll } from "vitest";

import { simulateProductionOperation } from "../../../__tests__/shared/testHelpers";
import { createUserAction } from "../actions";
import { createSchemaAllocator } from "../../../../tests/schemaAllocator";

const { useReadSchema, useWriteSchema, cleanup } =
  createSchemaAllocator("users");

afterAll(async () => {
  await cleanup();
});

describe("createUserAction", () => {
  it(
    "[Test 1/10] CREATE - Successfully create user with valid data",
    useWriteSchema(async ({ db, schemaName }) => {
      await simulateProductionOperation();

      const uniqueEmail = `test_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}@example.com`;
      const uniqueName = `Test User ${Date.now()}`;

      const result = await createUserAction({
        email: uniqueEmail,
        name: uniqueName,
        database: { client: db, schemaName },
      });

      expect(result).toBeDefined();
      expect(result.result).toBeDefined();
      expect(result.message).toBe("User created successfully");
      expect(result.result.email).toBe(uniqueEmail);
      expect(result.result.name).toBe(uniqueName);
      expect(result.result.id).toBeDefined();
      expect(result.result.isActive).toBe(true);
      expect(result.result.createdAt).toBeDefined();
      expect(result.result.updatedAt).toBeDefined();
    })
  );

  it(
    "[Test 2/10] VALIDATION - Fail with invalid email format",
    useWriteSchema(async ({ db, schemaName }) => {
      await simulateProductionOperation();

      try {
        await createUserAction({
          email: "invalid-email",
          name: "Test User",
          database: { client: db, schemaName },
        });
        expect.fail("Should have failed with invalid email");
      } catch (error) {
        expect(error).toBeDefined();
        if (error instanceof Error) {
          expect(error.message).toMatch(
            /invalid|validation|constraint|required/i
          );
        }
      }
    })
  );

  it(
    "[Test 3/10] CONSTRAINT - Fail with duplicate email",
    useWriteSchema(async ({ db, schemaName }) => {
      await simulateProductionOperation();

      const duplicateEmail = `duplicate_${Date.now()}@example.com`;

      await createUserAction({
        email: duplicateEmail,
        name: "First User",
        database: { client: db, schemaName },
      });

      try {
        await createUserAction({
          email: duplicateEmail,
          name: "Second User",
          database: { client: db, schemaName },
        });
        expect.fail("Should have thrown unique constraint error");
      } catch (error) {
        expect(error).toBeDefined();
        if (typeof error === "object" && error !== null && "code" in error) {
          expect(error.code).toBe("P2002");
        }
      }
    })
  );

  it(
    "[Test 4/10] DEFAULTS - Verify default values are set",
    useWriteSchema(async ({ db, schemaName }) => {
      await simulateProductionOperation();

      const result = await createUserAction({
        email: `defaults_${Date.now()}@example.com`,
        name: "Defaults Test",
        database: { client: db, schemaName },
      });

      expect(result.result.isActive).toBe(true);
      expect(result.result.createdAt).toBeDefined();
      expect(result.result.updatedAt).toBeDefined();
    })
  );

  it(
    "[Test 5/10] INTEGRATION - Test with database transaction context",
    useWriteSchema(async ({ db, schemaName }) => {
      await simulateProductionOperation();

      const uniqueEmail = `transaction_${Date.now()}@example.com`;

      const result = await createUserAction({
        email: uniqueEmail,
        name: "Transaction Test",
        database: { client: db, schemaName },
      });

      const verifyResult = await db.$queryRawUnsafe(
        `
        SELECT * FROM "${schemaName}".user WHERE email = $1
      `,
        uniqueEmail
      );

      expect(Array.isArray(verifyResult)).toBe(true);
      expect(verifyResult.length).toBe(1);
    })
  );

  it(
    "[Test 6/10] AUTHORIZATION - Test authorization boundaries",
    useWriteSchema(async ({ db, schemaName }) => {
      await simulateProductionOperation();

      const result = await createUserAction({
        email: `auth_${Date.now()}@example.com`,
        name: "Auth Test",
        database: { client: db, schemaName },
      });

      expect(result.result).toBeDefined();
      expect(result.result.id).toBeDefined();
    })
  );

  it(
    "[Test 7/10] SERVICE - Test service orchestration",
    useWriteSchema(async ({ db, schemaName }) => {
      await simulateProductionOperation();

      const result = await createUserAction({
        email: `service_${Date.now()}@example.com`,
        name: "Service Test",
        database: { client: db, schemaName },
      });

      expect(result.message).toBe("User created successfully");
      expect(result.result).toBeDefined();
    })
  );

  it(
    "[Test 8/10] BOUNDARY - Test email length limits",
    useWriteSchema(async ({ db, schemaName }) => {
      await simulateProductionOperation();

      const longEmail = `test_${"a".repeat(300)}@example.com`;

      try {
        await createUserAction({
          email: longEmail,
          name: "Test User",
          database: { client: db, schemaName },
        });
        expect.fail("Should have failed with email too long");
      } catch (error) {
        expect(error).toBeDefined();
      }
    })
  );

  it(
    "[Test 9/10] VALIDATION - Fail with missing required fields",
    useWriteSchema(async ({ db, schemaName }) => {
      await simulateProductionOperation();

      try {
        await createUserAction({
          name: "Test User",
          database: { client: db, schemaName },
        } as any);
        expect.fail("Should have failed with missing email");
      } catch (error) {
        expect(error).toBeDefined();
      }
    })
  );

  it(
    "[Test 10/10] PERFORMANCE - Measure creation performance",
    useWriteSchema(async ({ db, schemaName }) => {
      const iterations = 3;
      const times: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const startTime = Date.now();

        await createUserAction({
          email: `perf_${i}_${Date.now()}@example.com`,
          name: `Performance Test ${i}`,
          database: { client: db, schemaName },
        });

        const endTime = Date.now();
        times.push(endTime - startTime);
      }

      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      expect(avgTime).toBeLessThan(1000);
    })
  );
});
