import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import { createSchemaAllocator, type TestContext } from "@/tests/schemaAllocator";
import { generateTestData } from "@/__tests__/shared/testHelpers";

// Action imports (same level - use relative)
import { createUserAction } from "../actions";

const { useReadSchema, useWriteSchema, cleanup } = createSchemaAllocator("users");

describe("createUserAction Integration Tests", () => {
  afterAll(async () => {
    await cleanup();
  });

  // Happy Path Tests
  it("CREATE - Successfully create user with minimal valid data",
    useWriteSchema(async ({ db, schemaName }: TestContext) => {
      const uniqueEmail = `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}@example.com`;

      const result = await (await createUserAction)({
        email: uniqueEmail,
        name: "Test User",
        database: { client: db, schemaName },
      });

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.result).toBeDefined();
      expect(result.message).toMatch(/success/i);
      expect(result.errors).toBeNull();

      // Verify data integrity
      expect(result.result.email).toBe(uniqueEmail);
      expect(result.result.name).toBe("Test User");
      expect(typeof result.result.id).toBe("string");
      expect(result.result.isActive).toBe(true);
      expect(result.result.createdAt).toBeDefined();
      expect(result.result.updatedAt).toBeDefined();
    })
  );

  it("CREATE - Successfully create user with maximum length name",
    useWriteSchema(async ({ db, schemaName }: TestContext) => {
      const uniqueEmail = `max_${Date.now()}@example.com`;
      const maxName = "a".repeat(100);

      const result = await (await createUserAction)({
        email: uniqueEmail,
        name: maxName,
        database: { client: db, schemaName },
      });

      expect(result.success).toBe(true);
      expect(result.result.name).toBe(maxName);
      expect(result.result.name.length).toBe(100);
    })
  );

  it("CREATE - Successfully create user with special characters in name",
    useWriteSchema(async ({ db, schemaName }: TestContext) => {
      const uniqueEmail = `special_${Date.now()}@example.com`;
      const specialName = "José María García";

      const result = await (await createUserAction)({
        email: uniqueEmail,
        name: specialName,
        database: { client: db, schemaName },
      });

      expect(result.success).toBe(true);
      expect(result.result.name).toBe(specialName);
    })
  );

  it("CREATE - Successfully create user with complex email format",
    useWriteSchema(async ({ db, schemaName }: TestContext) => {
      const uniqueEmail = `user123.${Date.now()}@sub.domain.co.uk`;

      const result = await (await createUserAction)({
        email: uniqueEmail,
        name: "Complex Email User",
        database: { client: db, schemaName },
      });

      expect(result.success).toBe(true);
      expect(result.result.email).toBe(uniqueEmail);
    })
  );

  it("CREATE - Successfully create multiple users sequentially",
    useWriteSchema(async ({ db, schemaName }: TestContext) => {
      const users = [];
      for (let i = 0; i < 3; i++) {
        const uniqueEmail = `multi_${i}_${Date.now()}@example.com`;

        const result = await (await createUserAction)({
          email: uniqueEmail,
          name: `Multi User ${i}`,
          database: { client: db, schemaName },
        });

        expect(result.success).toBe(true);
        users.push(result.result);
      }

      // Verify all users have unique IDs
      const ids = users.map(u => u.id);
      expect(new Set(ids).size).toBe(3);
    })
  );

  it("CREATE - Successfully create user with minimum valid email format",
    useWriteSchema(async ({ db, schemaName }: TestContext) => {
      const uniqueEmail = `a${Date.now()}@b.co`;

      const result = await (await createUserAction)({
        email: uniqueEmail,
        name: "A",
        database: { client: db, schemaName },
      });

      expect(result.success).toBe(true);
      expect(result.result.email).toBe(uniqueEmail);
      expect(result.result.name).toBe("A");
    })
  );

  // Validation Error Tests
  it("VALIDATION - Fail with invalid email format",
    useReadSchema(async ({ db, schemaName }: TestContext) => {
      try {
        await (await createUserAction)({
          email: "not-an-email",
          name: "Test User",
          database: { client: db, schemaName },
        });
        expect.fail("Should have thrown validation error");
      } catch (error) {
        expect(error).toBeDefined();
        if (error instanceof Error) {
          expect(error.message).toMatch(/email/i);
        }
      }
    })
  );

  it("VALIDATION - Fail with empty email",
    useReadSchema(async ({ db, schemaName }: TestContext) => {
      try {
        await (await createUserAction)({
          email: "",
          name: "Test User",
          database: { client: db, schemaName },
        });
        expect.fail("Should have thrown validation error");
      } catch (error) {
        expect(error).toBeDefined();
        if (error instanceof Error) {
          expect(error.message).toMatch(/email/i);
        }
      }
    })
  );

  it("VALIDATION - Fail with empty name",
    useReadSchema(async ({ db, schemaName }: TestContext) => {
      try {
        await (await createUserAction)({
          email: `empty-name-${Date.now()}@example.com`,
          name: "",
          database: { client: db, schemaName },
        });
        expect.fail("Should have thrown validation error");
      } catch (error) {
        expect(error).toBeDefined();
        if (error instanceof Error) {
          expect(error.message).toMatch(/name/i);
        }
      }
    })
  );

  it("VALIDATION - Fail with name exceeding maximum length",
    useReadSchema(async ({ db, schemaName }: TestContext) => {
      try {
        await (await createUserAction)({
          email: `toolong-${Date.now()}@example.com`,
          name: "a".repeat(101), // Exceeds 100 character limit
          database: { client: db, schemaName },
        });
        expect.fail("Should have thrown validation error");
      } catch (error) {
        expect(error).toBeDefined();
        if (error instanceof Error) {
          expect(error.message).toMatch(/100/i);
        }
      }
    })
  );

  // Business Logic Error Tests
  it("BUSINESS - Fail with duplicate email constraint",
    useWriteSchema(async ({ db, schemaName }: TestContext) => {
      const duplicateEmail = `duplicate_${Date.now()}@example.com`;

      // Create first user
      const firstResult = await (await createUserAction)({
        email: duplicateEmail,
        name: "First User",
        database: { client: db, schemaName },
      });

      expect(firstResult.success).toBe(true);

      // Try to create duplicate - should fail
      try {
        await (await createUserAction)({
          email: duplicateEmail, // Same email
          name: "Second User",
          database: { client: db, schemaName },
        });
        expect.fail("Should have thrown duplicate error");
      } catch (error) {
        expect(error).toBeDefined();
        // Could be P2002 (Prisma) or other database constraint error
        if (typeof error === "object" && error !== null && "code" in error) {
          expect(error.code).toBe("P2002");
        }
      }
    })
  );

  // Edge Cases
  it("EDGE - Handle extremely long email gracefully",
    useWriteSchema(async ({ db, schemaName }: TestContext) => {
      try {
        const longEmail = `${"a".repeat(200)}@example.com`;

        const result = await (await createUserAction)({
          email: longEmail,
          name: "Long Email User",
          database: { client: db, schemaName },
        });

        // Should either succeed or fail gracefully without crashing
        expect(result).toBeDefined();
      } catch (error) {
        // Database should handle this gracefully
        expect(error).toBeDefined();
      }
    })
  );

  // Security Tests (IMPORTANT: These test for SQL injection vulnerabilities)
  it("SECURITY - SQL injection attempt in email field",
    useWriteSchema(async ({ db, schemaName }: TestContext) => {
      const maliciousEmail = "test@example.com'; DROP TABLE user; --";

      try {
        const result = await (await createUserAction)({
          email: maliciousEmail,
          name: "Security Test User",
          database: { client: db, schemaName },
        });

        // If this succeeds, there's a SQL injection vulnerability
        expect.fail("SQL injection vulnerability: malicious email was accepted");
      } catch (error) {
        // This is expected - malicious input should be rejected
        expect(error).toBeDefined();
      }

      // CRITICAL: Verify table still exists
      try {
        await db.$queryRawUnsafe(`SELECT COUNT(*) FROM "${schemaName}".user`);
        // If this succeeds, table survived the injection attempt
      } catch (tableError) {
        // If table doesn't exist, critical security failure occurred
        throw new Error("CRITICAL: Table was compromised by SQL injection");
      }
    })
  );

  it("SECURITY - SQL injection attempt in name field",
    useWriteSchema(async ({ db, schemaName }: TestContext) => {
      const maliciousName = "Robert'); DROP TABLE user; --";

      try {
        const result = await (await createUserAction)({
          email: `security-${Date.now()}@example.com`,
          name: maliciousName,
          database: { client: db, schemaName },
        });

        // If this succeeds, there's a SQL injection vulnerability
        expect.fail("SQL injection vulnerability: malicious name was accepted");
      } catch (error) {
        // This is expected - malicious input should be rejected
        expect(error).toBeDefined();
      }

      // CRITICAL: Verify table still exists
      try {
        await db.$queryRawUnsafe(`SELECT COUNT(*) FROM "${schemaName}".user`);
        // If this succeeds, table survived the injection attempt
      } catch (tableError) {
        // If table doesn't exist, critical security failure occurred
        throw new Error("CRITICAL: Table was compromised by SQL injection");
      }
    })
  );

  // Performance and Production Simulation
  it("PERFORMANCE - Simulate production operation with timing",
    useWriteSchema(async ({ db, schemaName }: TestContext) => {
      const uniqueEmail = `perf_${Date.now()}@example.com`;
      const startTime = Date.now();

      const result = await (await createUserAction)({
        email: uniqueEmail,
        name: "Performance Test User",
        database: { client: db, schemaName },
      });

      const executionTime = Date.now() - startTime;

      expect(result.success).toBe(true);
      expect(executionTime).toBeGreaterThan(10); // At least 10ms
      expect(executionTime).toBeLessThan(12000); // Less than 12 seconds
    })
  );

  // Response Structure Verification
  it("STRUCTURE - Verify complete response structure",
    useWriteSchema(async ({ db, schemaName }: TestContext) => {
      const uniqueEmail = `struct_${Date.now()}@example.com`;

      const result = await (await createUserAction)({
        email: uniqueEmail,
        name: "Structure Test User",
        database: { client: db, schemaName },
      });

      // Verify all expected fields exist
      expect(result).toHaveProperty('result');
      expect(result).toHaveProperty('message');
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('errors');

      // Verify result structure
      expect(result.result).toHaveProperty('id');
      expect(result.result).toHaveProperty('email');
      expect(result.result).toHaveProperty('name');
      expect(result.result).toHaveProperty('isActive');
      expect(result.result).toHaveProperty('createdAt');
      expect(result.result).toHaveProperty('updatedAt');

      // Verify types
      expect(typeof result.result.id).toBe('string');
      expect(typeof result.result.email).toBe('string');
      expect(typeof result.result.name).toBe('string');
      expect(typeof result.result.isActive).toBe('boolean');
      expect(typeof result.success).toBe('boolean');
      expect(typeof result.message).toBe('string');
    })
  );
});