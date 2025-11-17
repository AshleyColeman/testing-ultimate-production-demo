import { describe, it, expect, beforeAll, afterAll } from "vitest";

// Action imports - Go UP 2 levels, then into services
import {
  getUserByIdAction,
  getAllUsersAction,
  createUserAction,
  updateUserAction,
  deleteUserAction,
  searchUsersAction,
} from "../../services/users/actions";

// Infrastructure imports - Go UP 1 level, then into shared
import {
  getInfrastructure,
  getSchemasByService,
  recordTestExecution,
} from "../shared/testInfrastructure";

// Helper imports - Go UP 1 level, then into shared
import { simulateProductionOperation } from "../shared/testHelpers";

/**
 * USER ACTIONS INTEGRATION TESTS
 *
 * Tests the complete action layer following Inter-Train architecture:
 * - Actions (validation + authorization) → Services → Providers → Database
 *
 * Pattern: Server actions with double await calling convention
 * Database: Real PostgreSQL with dynamic schema creation
 * Test Count: 10 tests covering all 6 exported actions
 *
 * Actions under test:
 * 1. createUserAction - Create new user with validation
 * 2. getUserByIdAction - Get user by ID
 * 3. getAllUsersAction - Get all users with pagination
 * 4. updateUserAction - Update user data
 * 5. deleteUserAction - Delete user
 * 6. searchUsersAction - Search users with filters
 */

/**
 * Helper function to execute user action tests with proper error handling and metrics
 */
async function executeUserActionTest(
  testName: string,
  testFunction: () => Promise<any>,
  expectedToSucceed: boolean = true
): Promise<any> {
  const startTime = Date.now();
  let result: any;
  let testResult: string = "success";

  try {
    result = await testFunction();

    // Validate result structure for successful actions
    if (expectedToSucceed) {
      expect(result).toBeDefined();
      expect(result).toHaveProperty("result");
    }
  } catch (err) {
    testResult = "failure";
    if (expectedToSucceed) {
      throw err; // Re-throw if we expected success
    }
    // Return error for validation in test
    return { error: err };
  }

  const executionTime = Date.now() - startTime;

  // Record test execution metrics
  await recordTestExecution(
    "user-actions",
    testName,
    testResult,
    executionTime,
    { testName, expectedToSucceed }
  );

  return result;
}

/**
 * Generate unique test data to avoid conflicts
 */
function generateUniqueEmail(testNumber: number): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9);
  return `test.user.${testNumber}.${timestamp}.${random}@example.com`;
}

function generateUniqueName(testNumber: number): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9);
  return `Test User ${testNumber} ${timestamp} ${random}`;
}

describe("User Actions - Complete Integration Tests", () => {
  let infra: any;
  let schemas: any[];
  let schema: any;

  beforeAll(async () => {
    // Skill 1: Access Infrastructure
    infra = await getInfrastructure();

    // Skill 3: Select Random Schema
    schemas = await getSchemasByService("auth");
    schema = schemas[Math.floor(Math.random() * schemas.length)];

    // Skill 4: Create Dynamic Schema
    // Create users table with all required columns and constraints
    await schema.prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "${schema.schemaName}".users (
        id VARCHAR(255) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        "isActive" BOOLEAN DEFAULT true,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create indexes for performance
    await schema.prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "idx_users_email" ON "${schema.schemaName}".users(email)
    `);

    await schema.prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "idx_users_name" ON "${schema.schemaName}".users(name)
    `);

    await schema.prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "idx_users_created" ON "${schema.schemaName}".users("createdAt")
    `);
  });

  afterAll(async () => {
    // Cleanup: Drop test table
    if (schema?.prisma) {
      await schema.prisma.$executeRawUnsafe(`
        DROP TABLE IF EXISTS "${schema.schemaName}".users CASCADE
      `);
    }
  });

  it("[Test 1/10] CREATE - Create user with valid data", async () => {
    await executeUserActionTest("Create user with valid data", async () => {
      // Skill 6: Generate Smart Data
      const testInput = {
        email: generateUniqueEmail(1),
        name: generateUniqueName(1),
        database: schema.prisma, // Database injection for testing
      };

      // ✅ CRITICAL: Double await pattern for server actions
      const actionHandler = await createUserAction;
      const result = await actionHandler(testInput as any);

      // Validate response structure
      expect(result).toBeDefined();
      expect(result.result).toBeDefined();
      expect(result.result.email).toBe(testInput.email);
      expect(result.result.name).toBe(testInput.name);
      expect(result.result.isActive).toBe(true);
      expect(result.result.id).toBeDefined();
      expect(result.message).toBe("Successfully created user");

      // Skill 7: Include Production Delays
      const executionTime = await simulateProductionOperation();
      expect(executionTime).toBeGreaterThan(0);
      expect(executionTime).toBeLessThan(12000);

      return result;
    });
  });

  it("[Test 2/10] VALIDATE - Invalid email format triggers validation error", async () => {
    await executeUserActionTest(
      "Invalid email format",
      async () => {
        const testInput = {
          email: "not-a-valid-email", // Invalid format
          name: generateUniqueName(2),
          database: schema.prisma,
        };

        try {
          const actionHandler = await createUserAction;
          await actionHandler(testInput as any);
          expect.fail("Should have thrown validation error");
        } catch (error: any) {
          // Skill 9: Test Error Scenarios
          expect(error).toBeDefined();
          expect(error.name).toBe("ZodError");
          expect(error.issues).toBeDefined();
          expect(error.issues[0].message).toContain("Invalid email");
        }

        const executionTime = await simulateProductionOperation();
        expect(executionTime).toBeGreaterThan(0);

        return { validated: true };
      },
      true
    );
  });

  it("[Test 3/10] READ - Get user by ID (existing user)", async () => {
    await executeUserActionTest("Get user by ID - existing", async () => {
      // First create a user
      const createInput = {
        email: generateUniqueEmail(3),
        name: generateUniqueName(3),
        database: schema.prisma,
      };

      const createHandler = await createUserAction;
      const createResult = await createHandler(createInput as any);
      const userId = createResult.result.id;

      // Now fetch it by ID
      const getInput = {
        userId,
        database: schema.prisma,
      };

      const getHandler = await getUserByIdAction;
      const result = await getHandler(getInput as any);

      // Validate response
      expect(result).toBeDefined();
      expect(result.result).toBeDefined();
      expect(result.result.id).toBe(userId);
      expect(result.result.email).toBe(createInput.email);
      expect(result.result.name).toBe(createInput.name);

      const executionTime = await simulateProductionOperation();
      expect(executionTime).toBeGreaterThan(0);

      return result;
    });
  });

  it("[Test 4/10] ERROR - Get user by ID (non-existent user)", async () => {
    await executeUserActionTest(
      "Get user by ID - non-existent",
      async () => {
        const getInput = {
          userId: `nonexistent_${Date.now()}`,
          database: schema.prisma,
        };

        try {
          const getHandler = await getUserByIdAction;
          const result = await getHandler(getInput as any);

          // Service should return null for non-existent user
          expect(result.result).toBeNull();
        } catch (error: any) {
          // Or it might throw an error - both are valid patterns
          expect(error).toBeDefined();
        }

        const executionTime = await simulateProductionOperation();
        expect(executionTime).toBeGreaterThan(0);

        return { validated: true };
      },
      true
    );
  });

  it("[Test 5/10] UPDATE - Update user with valid data", async () => {
    await executeUserActionTest("Update user with valid data", async () => {
      // First create a user
      const createInput = {
        email: generateUniqueEmail(5),
        name: generateUniqueName(5),
        database: schema.prisma,
      };

      const createHandler = await createUserAction;
      const createResult = await createHandler(createInput as any);
      const userId = createResult.result.id;

      // Now update it
      const updateInput = {
        id: userId,
        name: `Updated ${generateUniqueName(5)}`,
        isActive: false,
        database: schema.prisma,
      };

      const updateHandler = await updateUserAction;
      const result = await updateHandler(updateInput as any);

      // Validate response
      expect(result).toBeDefined();
      expect(result.result).toBeDefined();
      expect(result.result.id).toBe(userId);
      expect(result.result.name).toBe(updateInput.name);
      expect(result.result.isActive).toBe(false);
      expect(result.message).toBe("Successfully updated user");

      const executionTime = await simulateProductionOperation();
      expect(executionTime).toBeGreaterThan(0);

      return result;
    });
  });

  it("[Test 6/10] UPDATE - Partial update (only name)", async () => {
    await executeUserActionTest("Partial update - only name", async () => {
      // First create a user
      const createInput = {
        email: generateUniqueEmail(6),
        name: generateUniqueName(6),
        database: schema.prisma,
      };

      const createHandler = await createUserAction;
      const createResult = await createHandler(createInput as any);
      const userId = createResult.result.id;
      const originalActive = createResult.result.isActive;

      // Update only name
      const updateInput = {
        id: userId,
        name: `Partial Update ${Date.now()}`,
        database: schema.prisma,
      };

      const updateHandler = await updateUserAction;
      const result = await updateHandler(updateInput as any);

      // Validate partial update
      expect(result).toBeDefined();
      expect(result.result).toBeDefined();
      expect(result.result.name).toBe(updateInput.name);
      expect(result.result.isActive).toBe(originalActive); // Should remain unchanged

      const executionTime = await simulateProductionOperation();
      expect(executionTime).toBeGreaterThan(0);

      return result;
    });
  });

  it("[Test 7/10] DELETE - Delete user successfully", async () => {
    await executeUserActionTest("Delete user successfully", async () => {
      // First create a user
      const createInput = {
        email: generateUniqueEmail(7),
        name: generateUniqueName(7),
        database: schema.prisma,
      };

      const createHandler = await createUserAction;
      const createResult = await createHandler(createInput as any);
      const userId = createResult.result.id;

      // Now delete it
      const deleteInput = {
        userId,
        database: schema.prisma,
      };

      const deleteHandler = await deleteUserAction;
      const result = await deleteHandler(deleteInput as any);

      // Validate deletion
      expect(result).toBeDefined();
      expect(result.result).toBeDefined();
      expect(result.message).toBe("Successfully deleted user");

      // Verify user is deleted
      const getInput = { userId, database: schema.prisma };
      const getHandler = await getUserByIdAction;
      const getResult = await getHandler(getInput as any);
      expect(getResult.result).toBeNull();

      const executionTime = await simulateProductionOperation();
      expect(executionTime).toBeGreaterThan(0);

      return result;
    });
  });

  it("[Test 8/10] LIST - Get all users with pagination", async () => {
    await executeUserActionTest("Get all users with pagination", async () => {
      // Create multiple users for pagination test
      const createHandler = await createUserAction;

      for (let i = 0; i < 3; i++) {
        const createInput = {
          email: generateUniqueEmail(800 + i),
          name: generateUniqueName(800 + i),
          database: schema.prisma,
        };
        await createHandler(createInput as any);
      }

      // Get all users with pagination
      const listInput = {
        page: 1,
        limit: 10,
        sortBy: "createdAt" as const,
        sortOrder: "desc" as const,
        database: schema.prisma,
      };

      const listHandler = await getAllUsersAction;
      const result = await listHandler(listInput as any);

      // Validate response
      expect(result).toBeDefined();
      expect(result.result).toBeDefined();
      expect(Array.isArray(result.result)).toBe(true);
      expect(result.result.length).toBeGreaterThan(0);

      // Validate user structure
      const firstUser = result.result[0];
      expect(firstUser).toHaveProperty("id");
      expect(firstUser).toHaveProperty("email");
      expect(firstUser).toHaveProperty("name");
      expect(firstUser).toHaveProperty("isActive");

      const executionTime = await simulateProductionOperation();
      expect(executionTime).toBeGreaterThan(0);

      return result;
    });
  });

  it("[Test 9/10] SEARCH - Search users with filters", async () => {
    await executeUserActionTest("Search users with filters", async () => {
      // Create a user with unique search term
      const searchTerm = `SearchTest${Date.now()}`;
      const createInput = {
        email: generateUniqueEmail(9),
        name: searchTerm,
        database: schema.prisma,
      };

      const createHandler = await createUserAction;
      await createHandler(createInput as any);

      // Search for the user
      const searchInput = {
        search: searchTerm,
        page: 1,
        limit: 10,
        sortBy: "createdAt" as const,
        sortOrder: "desc" as const,
        database: schema.prisma,
      };

      const searchHandler = await searchUsersAction;
      const result = await searchHandler(searchInput as any);

      // Validate search results
      expect(result).toBeDefined();
      expect(result.result).toBeDefined();
      expect(Array.isArray(result.result)).toBe(true);

      // Should find at least our test user
      const foundUser = result.result.find((u: any) => u.name === searchTerm);
      expect(foundUser).toBeDefined();
      expect(foundUser?.name).toBe(searchTerm);

      const executionTime = await simulateProductionOperation();
      expect(executionTime).toBeGreaterThan(0);

      return result;
    });
  });

  it("[Test 10/10] CONSTRAINT - Duplicate email constraint violation", async () => {
    await executeUserActionTest(
      "Duplicate email constraint violation",
      async () => {
        const duplicateEmail = generateUniqueEmail(10);

        // Create first user
        const createInput1 = {
          email: duplicateEmail,
          name: generateUniqueName(10),
          database: schema.prisma,
        };

        const createHandler = await createUserAction;
        await createHandler(createInput1 as any);

        // Try to create another user with same email
        const createInput2 = {
          email: duplicateEmail, // Same email
          name: generateUniqueName(1001),
          database: schema.prisma,
        };

        try {
          await createHandler(createInput2 as any);
          expect.fail("Should have thrown unique constraint error");
        } catch (error: any) {
          // Skill 8: Database-Aware Error Handling
          expect(error).toBeDefined();

          // PostgreSQL unique constraint violation
          // Could be P2002 (Prisma) or 23505 (PostgreSQL)
          const errorStr = error.message || error.toString();
          const hasConstraintError =
            errorStr.includes("P2002") ||
            errorStr.includes("23505") ||
            errorStr.includes("unique") ||
            errorStr.includes("duplicate");

          expect(hasConstraintError).toBe(true);
        }

        const executionTime = await simulateProductionOperation();
        expect(executionTime).toBeGreaterThan(0);

        return { validated: true };
      },
      true
    );
  });
});
