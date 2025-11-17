import { describe, it, expect, beforeAll, afterAll } from "vitest";

// Action imports - Using relative paths
import {
  getUserByIdAction,
  getAllUsersAction,
  createUserAction,
  updateUserAction,
  deleteUserAction,
  searchUsersAction,
} from "../../services/users/actions";

// Infrastructure imports
import {
  getInfrastructure,
  getSchemasByService,
  recordTestExecution,
} from "../shared/testInfrastructure";

// Helper imports
import { simulateProductionOperation } from "../shared/testHelpers";

import type { PrismaClient } from "@prisma/client";

/**
 * 🧪 USER ACTIONS INTEGRATION TEST
 *
 * Tests all 6 server actions with validation, authorization, and service orchestration.
 * Following Inter-Train pattern: Actions → Services → Providers → Database
 *
 * Actions tested:
 * - getUserByIdAction (READ single)
 * - getAllUsersAction (READ all with pagination)
 * - createUserAction (CREATE)
 * - updateUserAction (UPDATE)
 * - deleteUserAction (DELETE)
 * - searchUsersAction (SEARCH with filters)
 */

describe("User Actions Integration Tests", () => {
  let testSchema: { prisma: PrismaClient; schemaName: string };
  let infra: any;

  beforeAll(async () => {
    // Get shared infrastructure
    infra = await getInfrastructure();

    // Select random schema for this test
    const schemas = await getSchemasByService("auth");
    testSchema = schemas[Math.floor(Math.random() * schemas.length)];

    // Ensure users table exists with correct schema
    await testSchema.prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "${testSchema.schemaName}".users (
        id VARCHAR(255) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(100) NOT NULL,
        "isActive" BOOLEAN DEFAULT true,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    infra.logger.log(
      `[User Actions Test] Using schema: ${testSchema.schemaName}`
    );
  });

  afterAll(async () => {
    // Cleanup: Remove test data
    if (testSchema?.prisma) {
      await testSchema.prisma.$executeRawUnsafe(
        `TRUNCATE TABLE "${testSchema.schemaName}".users CASCADE`
      );
    }
  });

  /**
   * Helper function to execute user action tests with proper error handling and metrics
   */
  async function executeUserActionTest(
    testName: string,
    testFn: () => Promise<void>
  ): Promise<void> {
    const startTime = Date.now();

    try {
      await testFn();

      const duration = Date.now() - startTime;
      await recordTestExecution("user-actions", testName, "success", duration, {
        schema: testSchema.schemaName,
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      await recordTestExecution("user-actions", testName, "failure", duration, {
        schema: testSchema.schemaName,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  it("[Test 1/10] CREATE - Successfully create user with valid data", async () => {
    await executeUserActionTest("Create user with valid data", async () => {
      // Generate unique test data to avoid conflicts
      const uniqueEmail = `test_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}@example.com`;
      const uniqueName = `Test User ${Date.now()}`;

      // Simulate production operation delay
      const executionTime = await simulateProductionOperation();

      // Call action with database injection (double await pattern)
      const result = await (
        await createUserAction
      )({
        email: uniqueEmail,
        name: uniqueName,
        database: testSchema.prisma,
      });

      // Verify result structure
      expect(result).toBeDefined();
      expect(result.result).toBeDefined();
      expect(result.message).toBe("Successfully created user");

      // Verify user data
      expect(result.result.email).toBe(uniqueEmail);
      expect(result.result.name).toBe(uniqueName);
      expect(result.result.id).toBeDefined();
      expect(result.result.isActive).toBe(true);

      // Verify timing
      expect(executionTime).toBeGreaterThan(0);
      expect(executionTime).toBeLessThan(12000);
    });
  });

  it("[Test 2/10] CREATE - Fail with duplicate email constraint", async () => {
    await executeUserActionTest(
      "Create user with duplicate email",
      async () => {
        // Create first user
        const uniqueEmail = `duplicate_${Date.now()}@example.com`;

        await (
          await createUserAction
        )({
          email: uniqueEmail,
          name: "First User",
          database: testSchema.prisma,
        });

        // Simulate production delay
        await simulateProductionOperation();

        // Attempt to create duplicate user
        try {
          await (
            await createUserAction
          )({
            email: uniqueEmail,
            name: "Second User",
            database: testSchema.prisma,
          });

          expect.fail("Should have thrown unique constraint error");
        } catch (error) {
          expect(error).toBeDefined();

          // PostgreSQL unique constraint violation (P2002)
          if (typeof error === "object" && error !== null && "code" in error) {
            expect(error.code).toBe("P2002");
          } else if (error instanceof Error) {
            expect(error.message).toMatch(/unique|duplicate|constraint/i);
          }
        }
      }
    );
  });

  it("[Test 3/10] READ - Get user by ID successfully", async () => {
    await executeUserActionTest("Get user by ID", async () => {
      // Create test user first
      const uniqueEmail = `get_by_id_${Date.now()}@example.com`;
      const created = await (
        await createUserAction
      )({
        email: uniqueEmail,
        name: "Get By ID Test",
        database: testSchema.prisma,
      });

      const userId = created.result.id;

      // Simulate production delay
      const executionTime = await simulateProductionOperation();

      // Get user by ID
      const result = await (
        await getUserByIdAction
      )({
        userId,
        database: testSchema.prisma,
      } as any);

      // Verify result
      expect(result).toBeDefined();
      expect(result.result).toBeDefined();
      expect(result.result.id).toBe(userId);
      expect(result.result.email).toBe(uniqueEmail);
      expect(result.result.name).toBe("Get By ID Test");

      // Verify timing
      expect(executionTime).toBeGreaterThan(0);
      expect(executionTime).toBeLessThan(12000);
    });
  });

  it("[Test 4/10] READ - Fail to get non-existent user (P2025)", async () => {
    await executeUserActionTest("Get non-existent user", async () => {
      const nonExistentId = `usr_nonexistent_${Date.now()}`;

      // Simulate production delay
      await simulateProductionOperation();

      // Attempt to get non-existent user
      try {
        await (
          await getUserByIdAction
        )({
          userId: nonExistentId,
          database: testSchema.prisma,
        } as any);

        expect.fail("Should have thrown not found error");
      } catch (error) {
        expect(error).toBeDefined();

        // PostgreSQL not found error (P2025) or standard error
        if (typeof error === "object" && error !== null && "code" in error) {
          expect(error.code).toBe("P2025");
        } else if (error instanceof Error) {
          expect(error.message).toMatch(/not found|doesn't exist/i);
        }
      }
    });
  });

  it("[Test 5/10] UPDATE - Successfully update user with valid data", async () => {
    await executeUserActionTest("Update user with valid data", async () => {
      // Create test user first
      const uniqueEmail = `update_${Date.now()}@example.com`;
      const created = await (
        await createUserAction
      )({
        email: uniqueEmail,
        name: "Original Name",
        database: testSchema.prisma,
      });

      const userId = created.result.id;

      // Simulate production delay
      const executionTime = await simulateProductionOperation();

      // Update user
      const updatedName = `Updated Name ${Date.now()}`;
      const result = await (
        await updateUserAction
      )({
        id: userId,
        name: updatedName,
        isActive: false,
        database: testSchema.prisma,
      } as any);

      // Verify result
      expect(result).toBeDefined();
      expect(result.result).toBeDefined();
      expect(result.message).toBe("Successfully updated user");
      expect(result.result.id).toBe(userId);
      expect(result.result.name).toBe(updatedName);
      expect(result.result.isActive).toBe(false);

      // Verify timing
      expect(executionTime).toBeGreaterThan(0);
      expect(executionTime).toBeLessThan(12000);
    });
  });

  it("[Test 6/10] UPDATE - Fail to update non-existent user (P2025)", async () => {
    await executeUserActionTest("Update non-existent user", async () => {
      const nonExistentId = `usr_nonexistent_${Date.now()}`;

      // Simulate production delay
      await simulateProductionOperation();

      // Attempt to update non-existent user
      try {
        await (
          await updateUserAction
        )({
          id: nonExistentId,
          name: "Should Fail",
          database: testSchema.prisma,
        } as any);

        expect.fail("Should have thrown not found error");
      } catch (error) {
        expect(error).toBeDefined();

        // PostgreSQL not found error (P2025) or standard error
        if (typeof error === "object" && error !== null && "code" in error) {
          expect(error.code).toBe("P2025");
        } else if (error instanceof Error) {
          expect(error.message).toMatch(/not found|doesn't exist/i);
        }
      }
    });
  });

  it("[Test 7/10] DELETE - Successfully delete user", async () => {
    await executeUserActionTest("Delete user successfully", async () => {
      // Create test user first
      const uniqueEmail = `delete_${Date.now()}@example.com`;
      const created = await (
        await createUserAction
      )({
        email: uniqueEmail,
        name: "To Be Deleted",
        database: testSchema.prisma,
      });

      const userId = created.result.id;

      // Simulate production delay
      const executionTime = await simulateProductionOperation();

      // Delete user
      const result = await (
        await deleteUserAction
      )({
        userId,
        database: testSchema.prisma,
      } as any);

      // Verify result
      expect(result).toBeDefined();
      expect(result.result).toBeDefined();
      expect(result.message).toBe("Successfully deleted user");

      // Verify user is actually deleted
      try {
        await (
          await getUserByIdAction
        )({
          userId,
          database: testSchema.prisma,
        } as any);
        expect.fail("User should have been deleted");
      } catch (error) {
        // Expected - user not found
        expect(error).toBeDefined();
      }

      // Verify timing
      expect(executionTime).toBeGreaterThan(0);
      expect(executionTime).toBeLessThan(12000);
    });
  });

  it("[Test 8/10] DELETE - Fail to delete non-existent user (P2025)", async () => {
    await executeUserActionTest("Delete non-existent user", async () => {
      const nonExistentId = `usr_nonexistent_${Date.now()}`;

      // Simulate production delay
      await simulateProductionOperation();

      // Attempt to delete non-existent user
      try {
        await (
          await deleteUserAction
        )({
          userId: nonExistentId,
          database: testSchema.prisma,
        } as any);

        expect.fail("Should have thrown not found error");
      } catch (error) {
        expect(error).toBeDefined();

        // PostgreSQL not found error (P2025) or standard error
        if (typeof error === "object" && error !== null && "code" in error) {
          expect(error.code).toBe("P2025");
        } else if (error instanceof Error) {
          expect(error.message).toMatch(/not found|doesn't exist/i);
        }
      }
    });
  });

  it("[Test 9/10] LIST - Get all users with pagination", async () => {
    await executeUserActionTest("Get all users with pagination", async () => {
      // Create multiple test users
      const baseEmail = `list_${Date.now()}`;
      await (
        await createUserAction
      )({
        email: `${baseEmail}_1@example.com`,
        name: "User 1",
        database: testSchema.prisma,
      });
      await (
        await createUserAction
      )({
        email: `${baseEmail}_2@example.com`,
        name: "User 2",
        database: testSchema.prisma,
      });
      await (
        await createUserAction
      )({
        email: `${baseEmail}_3@example.com`,
        name: "User 3",
        database: testSchema.prisma,
      });

      // Simulate production delay
      const executionTime = await simulateProductionOperation();

      // Get all users with pagination
      const result = await (
        await getAllUsersAction
      )({
        page: 1,
        limit: 10,
        sortBy: "createdAt",
        sortOrder: "desc",
        database: testSchema.prisma,
      } as any);

      // Verify result
      expect(result).toBeDefined();
      expect(result.result).toBeDefined();
      expect(Array.isArray(result.result)).toBe(true);
      expect(result.result.length).toBeGreaterThanOrEqual(3);

      // Verify timing
      expect(executionTime).toBeGreaterThan(0);
      expect(executionTime).toBeLessThan(12000);
    });
  });

  it("[Test 10/10] SEARCH - Search users with filters", async () => {
    await executeUserActionTest("Search users with filters", async () => {
      // Create test users with searchable data
      const searchTerm = `search_${Date.now()}`;
      await (
        await createUserAction
      )({
        email: `${searchTerm}_alpha@example.com`,
        name: `${searchTerm} Alpha User`,
        database: testSchema.prisma,
      });
      await (
        await createUserAction
      )({
        email: `${searchTerm}_beta@example.com`,
        name: `${searchTerm} Beta User`,
        database: testSchema.prisma,
      });

      // Simulate production delay
      const executionTime = await simulateProductionOperation();

      // Search users
      const result = await (
        await searchUsersAction
      )({
        search: searchTerm,
        page: 1,
        limit: 10,
        sortBy: "name",
        sortOrder: "asc",
        database: testSchema.prisma,
      } as any);

      // Verify result
      expect(result).toBeDefined();
      expect(result.result).toBeDefined();
      expect(Array.isArray(result.result)).toBe(true);
      expect(result.result.length).toBeGreaterThanOrEqual(2);

      // Verify search filtering worked
      result.result.forEach((user: any) => {
        const matchesSearch =
          user.email.includes(searchTerm) || user.name.includes(searchTerm);
        expect(matchesSearch).toBe(true);
      });

      // Verify timing
      expect(executionTime).toBeGreaterThan(0);
      expect(executionTime).toBeLessThan(12000);
    });
  });
});
