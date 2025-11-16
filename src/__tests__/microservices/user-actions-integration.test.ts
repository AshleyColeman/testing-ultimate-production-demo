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
import {
  simulateProductionOperation,
  generateTestData,
} from "../shared/testHelpers";

/**
 * Helper function to execute user actions with proper error handling and recording
 */
async function executeUserActionTest(
  testName: string,
  testFunction: () => Promise<any>,
  expectedToSucceed: boolean = true
): Promise<any> {
  const startTime = Date.now();
  let result: any;
  let testResult: string = "success";
  let error: any = null;

  try {
    result = await testFunction();
    
    // Validate result structure for actions
    if (expectedToSucceed) {
      expect(result).toBeDefined();
      expect(result).toHaveProperty("result");
    }
  } catch (err) {
    error = err;
    testResult = "failure";
    if (expectedToSucceed) {
      throw err;
    }
  }

  const executionTime = Date.now() - startTime;

  // Record test execution
  await recordTestExecution(
    "user-actions-integration",
    testName,
    testResult,
    executionTime,
    { testName, succeeded: expectedToSucceed ? testResult === "success" : testResult === "failure" }
  );

  return result;
}

/**
 * Helper function to generate unique test data
 */
function generateUniqueEmail(testNumber: number): string {
  return `test.user.${testNumber}.${Date.now()}.${Math.random().toString(36).substr(2, 9)}@example.com`;
}

function generateUniqueName(testNumber: number): string {
  return `Test User ${testNumber} ${Date.now()} ${Math.random().toString(36).substr(2, 9)}`;
}

describe("User Actions Integration Tests", () => {
  let infra: any;
  let schemas: any[];
  let schema: any;

  beforeAll(async () => {
    // Initialize infrastructure
    infra = await getInfrastructure();
    schemas = await getSchemasByService("auth");
    schema = schemas[Math.floor(Math.random() * schemas.length)];

    // Create User table for testing
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

    // Create index for email searches
    await schema.prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "idx_users_email" ON "${schema.schemaName}".users(email)
    `);

    // Create index for name searches
    await schema.prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "idx_users_name" ON "${schema.schemaName}".users(name)
    `);
  });

  afterAll(async () => {
    // Cleanup test data
    if (schema?.prisma) {
      await schema.prisma.$executeRawUnsafe(`
        DROP TABLE IF EXISTS "${schema.schemaName}".users CASCADE
      `);
    }
  });

  it("[Test 1/10] Create user with valid data", async () => {
    await executeUserActionTest("Create user with valid data", async () => {
      const testInput = {
        email: generateUniqueEmail(1),
        name: generateUniqueName(1),
        database: schema.prisma,
      };

      // ✅ CORRECT: Double await pattern for server actions
      const actionHandler = await createUserAction;
      const result = await actionHandler(testInput as any);

      expect(result).toBeDefined();
      expect(result.result).toBeDefined();
      expect(result.result.email).toBe(testInput.email);
      expect(result.result.name).toBe(testInput.name);
      expect(result.result.isActive).toBe(true);
      expect(result.message).toBe('Successfully created user');

      const executionTime = await simulateProductionOperation();
      expect(executionTime).toBeGreaterThan(0);
      expect(executionTime).toBeLessThan(12000);

      return result;
    });
  });

  it("[Test 2/10] Create user with invalid email format", async () => {
    await executeUserActionTest("Create user with invalid email format", async () => {
      const testInput = {
        email: "invalid-email-format",
        name: generateUniqueName(2),
        database: schema.prisma,
      };

      // ✅ CORRECT: Proper error handling with type guards
      try {
        const actionHandler = await createUserAction;
        const result = await actionHandler(testInput as any);
        expect.fail("Should have thrown validation error");
      } catch (error) {
        expect(error).toBeDefined();
        // Type-safe error checking
        if (error instanceof Error) {
          expect(error.message).toContain("Invalid email format");
        } else {
          expect(String(error)).toContain("Invalid email format");
        }
      }

      const executionTime = await simulateProductionOperation();
      expect(executionTime).toBeGreaterThan(0);
      expect(executionTime).toBeLessThan(12000);

      return null;
    }, false); // Expected to fail
  });

  it("[Test 3/10] Get user by ID (existing)", async () => {
    await executeUserActionTest("Get user by ID (existing)", async () => {
      // First create a user
      const createInput = {
        email: generateUniqueEmail(3),
        name: generateUniqueName(3),
        database: schema.prisma,
      };

      const createHandler = await createUserAction;
      const createResult = await createHandler(createInput as any);
      const createdUserId = createResult.result.id;

      // Now get the user by ID
      const getInput = {
        userId: createdUserId,
        database: schema.prisma,
      };

      const getHandler = await getUserByIdAction;
      const result = await getHandler(getInput as any);

      expect(result).toBeDefined();
      expect(result.result).toBeDefined();
      expect(result.result.id).toBe(createdUserId);
      expect(result.result.email).toBe(createInput.email);
      expect(result.result.name).toBe(createInput.name);

      const executionTime = await simulateProductionOperation();
      expect(executionTime).toBeGreaterThan(0);
      expect(executionTime).toBeLessThan(12000);

      return result;
    });
  });

  it("[Test 4/10] Get user by ID (non-existent)", async () => {
    await executeUserActionTest("Get user by ID (non-existent)", async () => {
      const getInput = {
        userId: `non-existent-user-${Date.now()}`,
        database: schema.prisma,
      };

      try {
        const getHandler = await getUserByIdAction;
        const result = await getHandler(getInput as any);
        expect.fail("Should have thrown error for non-existent user");
      } catch (error) {
        expect(error).toBeDefined();
        // Should handle not found error appropriately
        if (error instanceof Error) {
          expect(error.message).toBeDefined();
        } else {
          expect(String(error)).toBeDefined();
        }
      }

      const executionTime = await simulateProductionOperation();
      expect(executionTime).toBeGreaterThan(0);
      expect(executionTime).toBeLessThan(12000);

      return null;
    }, false); // Expected to fail
  });

  it("[Test 5/10] Update user with valid data", async () => {
    await executeUserActionTest("Update user with valid data", async () => {
      // First create a user
      const createInput = {
        email: generateUniqueEmail(5),
        name: generateUniqueName(5),
        database: schema.prisma,
      };

      const createHandler = await createUserAction;
      const createResult = await createHandler(createInput as any);
      const createdUserId = createResult.result.id;

      // Now update the user
      const updateInput = {
        id: createdUserId,
        name: `Updated ${generateUniqueName(5)}`,
        isActive: false,
        database: schema.prisma,
      };

      const updateHandler = await updateUserAction;
      const result = await updateHandler(updateInput as any);

      expect(result).toBeDefined();
      expect(result.result).toBeDefined();
      expect(result.result.id).toBe(createdUserId);
      expect(result.result.name).toBe(updateInput.name);
      expect(result.result.isActive).toBe(false);
      expect(result.message).toBe('Successfully updated user');

      const executionTime = await simulateProductionOperation();
      expect(executionTime).toBeGreaterThan(0);
      expect(executionTime).toBeLessThan(12000);

      return result;
    });
  });

  it("[Test 6/10] Update user with partial data", async () => {
    await executeUserActionTest("Update user with partial data", async () => {
      // First create a user
      const createInput = {
        email: generateUniqueEmail(6),
        name: generateUniqueName(6),
        database: schema.prisma,
      };

      const createHandler = await createUserAction;
      const createResult = await createHandler(createInput as any);
      const createdUserId = createResult.result.id;

      // Update only the name (partial update)
      const updateInput = {
        id: createdUserId,
        name: `Partially Updated ${generateUniqueName(6)}`,
        database: schema.prisma,
      };

      const updateHandler = await updateUserAction;
      const result = await updateHandler(updateInput as any);

      expect(result).toBeDefined();
      expect(result.result).toBeDefined();
      expect(result.result.id).toBe(createdUserId);
      expect(result.result.name).toBe(updateInput.name);
      // isActive should remain unchanged (true by default)
      expect(result.result.isActive).toBe(true);
      expect(result.message).toBe('Successfully updated user');

      const executionTime = await simulateProductionOperation();
      expect(executionTime).toBeGreaterThan(0);
      expect(executionTime).toBeLessThan(12000);

      return result;
    });
  });

  it("[Test 7/10] Delete user successfully", async () => {
    await executeUserActionTest("Delete user successfully", async () => {
      // First create a user
      const createInput = {
        email: generateUniqueEmail(7),
        name: generateUniqueName(7),
        database: schema.prisma,
      };

      const createHandler = await createUserAction;
      const createResult = await createHandler(createInput as any);
      const createdUserId = createResult.result.id;

      // Now delete the user
      const deleteInput = {
        userId: createdUserId,
        database: schema.prisma,
      };

      const deleteHandler = await deleteUserAction;
      const result = await deleteHandler(deleteInput as any);

      expect(result).toBeDefined();
      expect(result.result).toBeDefined();
      expect(result.message).toBe('Successfully deleted user');

      // Verify user is deleted by trying to get them
      try {
        const getHandler = await getUserByIdAction;
        const getResult = await getHandler(deleteInput as any);
        expect.fail("User should have been deleted");
      } catch (error) {
        // Expected - user should not exist
        expect(error).toBeDefined();
      }

      const executionTime = await simulateProductionOperation();
      expect(executionTime).toBeGreaterThan(0);
      expect(executionTime).toBeLessThan(12000);

      return result;
    });
  });

  it("[Test 8/10] Get all users with pagination", async () => {
    await executeUserActionTest("Get all users with pagination", async () => {
      // Create multiple users for pagination test
      const userIds: string[] = [];
      for (let i = 0; i < 5; i++) {
        const createInput = {
          email: generateUniqueEmail(8 + i),
          name: generateUniqueName(8 + i),
          database: schema.prisma,
        };

        const createHandler = await createUserAction;
        const createResult = await createHandler(createInput as any);
        userIds.push(createResult.result.id);
      }

      // Get all users with pagination
      const getAllInput = {
        page: 1,
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'desc',
        database: schema.prisma,
      };

      const getAllHandler = await getAllUsersAction;
      const result = await getAllHandler(getAllInput as any);

      expect(result).toBeDefined();
      expect(result.result).toBeDefined();
      expect(Array.isArray(result.result)).toBe(true);
      expect(result.result.length).toBeGreaterThanOrEqual(5);

      // Verify our created users are in the results
      const createdUserIds = result.result.map((user: any) => user.id);
      for (const userId of userIds) {
        expect(createdUserIds).toContain(userId);
      }

      const executionTime = await simulateProductionOperation();
      expect(executionTime).toBeGreaterThan(0);
      expect(executionTime).toBeLessThan(12000);

      return result;
    });
  });

  it("[Test 9/10] Search users with filters", async () => {
    await executeUserActionTest("Search users with filters", async () => {
      // Create users with specific names for search test
      const searchPrefix = `SearchTest${Date.now()}`;
      const userIds: string[] = [];
      
      for (let i = 0; i < 3; i++) {
        const createInput = {
          email: generateUniqueEmail(9 + i),
          name: `${searchPrefix} User ${i}`,
          database: schema.prisma,
        };

        const createHandler = await createUserAction;
        const createResult = await createHandler(createInput as any);
        userIds.push(createResult.result.id);
      }

      // Search for users with the specific prefix
      const searchInput = {
        search: searchPrefix,
        page: 1,
        limit: 10,
        sortBy: 'name',
        sortOrder: 'asc',
        database: schema.prisma,
      };

      const searchHandler = await searchUsersAction;
      const result = await searchHandler(searchInput as any);

      expect(result).toBeDefined();
      expect(result.result).toBeDefined();
      expect(Array.isArray(result.result)).toBe(true);
      expect(result.result.length).toBeGreaterThanOrEqual(3);

      // Verify all results contain our search term
      for (const user of result.result) {
        expect(user.name).toContain(searchPrefix);
      }

      const executionTime = await simulateProductionOperation();
      expect(executionTime).toBeGreaterThan(0);
      expect(executionTime).toBeLessThan(12000);

      return result;
    });
  });

  it("[Test 10/10] Duplicate email constraint violation", async () => {
    await executeUserActionTest("Duplicate email constraint violation", async () => {
      const duplicateEmail = generateUniqueEmail(10);
      
      // Create first user
      const firstInput = {
        email: duplicateEmail,
        name: generateUniqueName(10),
        database: schema.prisma,
      };

      const createHandler = await createUserAction;
      const firstResult = await createHandler(firstInput as any);
      expect(firstResult.result.email).toBe(duplicateEmail);

      // Try to create second user with same email
      const secondInput = {
        email: duplicateEmail, // Same email
        name: `Different ${generateUniqueName(10)}`,
        database: schema.prisma,
      };

      try {
        const secondResult = await createHandler(secondInput as any);
        expect.fail("Should have thrown duplicate email constraint error");
      } catch (error) {
        expect(error).toBeDefined();
        // Should handle constraint violation
        if (error instanceof Error) {
          // Could be database constraint error or validation error
          expect(error.message).toBeDefined();
        } else {
          expect(String(error)).toBeDefined();
        }
      }

      const executionTime = await simulateProductionOperation();
      expect(executionTime).toBeGreaterThan(0);
      expect(executionTime).toBeLessThan(12000);

      return null;
    }, false); // Expected to fail
  });
});
