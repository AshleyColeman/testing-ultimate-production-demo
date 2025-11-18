import { describe, it, expect, beforeAll } from "vitest";

// Action imports - Using relative paths
import {
  getUserByIdAction,
  getAllUsersAction,
  createUserAction,
  updateUserAction,
  deleteUserAction,
  searchUsersAction,
} from "../../services/users/actions";

// Schema allocator - NEW PATTERN
import { createSchemaAllocator } from "../../../tests/schemaAllocator";

// Helper imports
import { simulateProductionOperation } from "../shared/testHelpers";

/**
 * 🧪 USER ACTIONS INTEGRATION TEST (Schema Allocator Pattern)
 *
 * Tests all 6 server actions with validation, authorization, and service orchestration.
 * Following Inter-Train pattern: Actions → Services → Providers → Database
 *
 * SCHEMA ALLOCATION STRATEGY:
 * - READ tests (fail scenarios only) → Share ONE schema (3 tests)
 * - WRITE tests (create, update, delete, list, search) → Each gets UNIQUE schema (7 tests)
 *
 * NOTE: Tests that create data before reading are classified as WRITE tests
 * to ensure proper isolation, even if they primarily perform read operations.
 *
 * Actions tested:
 * - createUserAction (CREATE - 2 tests: success + duplicate)
 * - getUserByIdAction (READ - 2 tests: success requires write, fail is pure read)
 * - updateUserAction (UPDATE - 2 tests: success is write, fail is pure read)
 * - deleteUserAction (DELETE - 2 tests: success is write, fail is pure read)
 * - getAllUsersAction (LIST - 1 test: requires write to create test data)
 * - searchUsersAction (SEARCH - 1 test: requires write to create test data)
 */

// Create schema allocator for 'users' service
const { useReadSchema, useWriteSchema } = createSchemaAllocator("users");

describe("User Actions Integration Tests", () => {
  // Setup users table in all schemas before tests run
  beforeAll(async () => {
    // This will be handled per-test by the schema allocator
    // Each test gets its schema via useReadSchema or useWriteSchema
  });

  it(
    "[Test 1/10] CREATE - Successfully create user with valid data",
    useWriteSchema(async ({ db, schemaName }) => {
      console.log(`✏️  WRITE: Creating user on schema: ${schemaName}`);

      // Ensure users table exists
      await db.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "${schemaName}".user (
          id SERIAL PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          name VARCHAR(100) NOT NULL,
          "isActive" BOOLEAN DEFAULT true,
          "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // DEBUG: Verify search_path and table
      const searchPathCheck = await db.$queryRaw`SHOW search_path`;
      console.log(`🔍 TEST: search_path:`, searchPathCheck);
      const tableCheck = await db.$queryRawUnsafe(`
        SELECT COUNT(*) FROM information_schema.tables 
        WHERE table_schema = '${schemaName}' AND table_name = 'user'
      `);
      console.log(`🔍 TEST: Table 'user' in ${schemaName}:`, tableCheck);
      console.log(
        `🔍 TEST: Passing db to action, db is PrismaClient:`,
        db.constructor.name
      );

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
        database: { client: db, schemaName },
      });

      // Verify result structure
      expect(result).toBeDefined();
      expect(result.result).toBeDefined();
      expect(result.message).toBe("User created successfully");

      // Verify user data
      expect(result.result.email).toBe(uniqueEmail);
      expect(result.result.name).toBe(uniqueName);
      expect(result.result.id).toBeDefined();
      expect(result.result.isActive).toBe(true);

      // Verify timing
      expect(executionTime).toBeGreaterThan(0);
      expect(executionTime).toBeLessThan(12000);

      console.log(
        `✅ WRITE completed in ${executionTime}ms (schema: ${schemaName})`
      );
    })
  );

  it(
    "[Test 2/10] CREATE - Fail with duplicate email constraint",
    useWriteSchema(async ({ db, schemaName }) => {
      console.log(
        `✏️  WRITE: Testing duplicate email on schema: ${schemaName}`
      );

      // Ensure users table exists
      await db.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "${schemaName}".user (
          id SERIAL PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          name VARCHAR(100) NOT NULL,
          "isActive" BOOLEAN DEFAULT true,
          "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create first user
      const uniqueEmail = `duplicate_${Date.now()}@example.com`;

      await (
        await createUserAction
      )({
        email: uniqueEmail,
        name: "First User",
        database: { client: db, schemaName },
      });

      // Simulate production delay
      const executionTime = await simulateProductionOperation();

      // Attempt to create duplicate user
      try {
        await (
          await createUserAction
        )({
          email: uniqueEmail,
          name: "Second User",
          database: { client: db, schemaName },
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

      console.log(
        `✅ WRITE completed in ${executionTime}ms (schema: ${schemaName})`
      );
    })
  );

  it(
    "[Test 3/10] READ - Get user by ID successfully",
    useWriteSchema(async ({ db, schemaName }) => {
      console.log(`✏️  WRITE: Getting user by ID on schema: ${schemaName}`);

      // Ensure users table exists
      await db.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "${schemaName}".user (
          id SERIAL PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          name VARCHAR(100) NOT NULL,
          "isActive" BOOLEAN DEFAULT true,
          "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create test user first
      const uniqueEmail = `get_by_id_${Date.now()}@example.com`;
      const created = await (
        await createUserAction
      )({
        email: uniqueEmail,
        name: "Get By ID Test",
        database: { client: db, schemaName },
      });

      const userId = created.result.id;

      // Simulate production delay
      const executionTime = await simulateProductionOperation();

      // Get user by ID
      const result = await (
        await getUserByIdAction
      )({
        userId,
        database: { client: db, schemaName },
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

      console.log(
        `✅ WRITE completed in ${executionTime}ms (schema: ${schemaName})`
      );
    })
  );

  it(
    "[Test 4/10] READ - Fail to get non-existent user (P2025)",
    useReadSchema(async ({ db, schemaName }) => {
      console.log(
        `📖 READ: Testing non-existent user on schema: ${schemaName}`
      );

      const nonExistentId = `usr_nonexistent_${Date.now()}`;

      // Simulate production delay
      const executionTime = await simulateProductionOperation();

      // Attempt to get non-existent user
      try {
        await (
          await getUserByIdAction
        )({
          userId: nonExistentId,
          database: { client: db, schemaName },
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

      console.log(
        `✅ READ completed in ${executionTime}ms (schema: ${schemaName})`
      );
    })
  );

  it(
    "[Test 5/10] UPDATE - Successfully update user with valid data",
    useWriteSchema(async ({ db, schemaName }) => {
      console.log(`✏️  WRITE: Updating user on schema: ${schemaName}`);

      // Ensure users table exists
      await db.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "${schemaName}".user (
          id SERIAL PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          name VARCHAR(100) NOT NULL,
          "isActive" BOOLEAN DEFAULT true,
          "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create test user first
      const uniqueEmail = `update_${Date.now()}@example.com`;
      const created = await (
        await createUserAction
      )({
        email: uniqueEmail,
        name: "Original Name",
        database: { client: db, schemaName },
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
        database: { client: db, schemaName },
      } as any);

      // Verify result
      expect(result).toBeDefined();
      expect(result.result).toBeDefined();
      expect(result.message).toBe("User updated successfully");
      expect(result.result.id).toBe(userId);
      expect(result.result.name).toBe(updatedName);
      expect(result.result.isActive).toBe(false);

      // Verify timing
      expect(executionTime).toBeGreaterThan(0);
      expect(executionTime).toBeLessThan(12000);

      console.log(
        `✅ WRITE completed in ${executionTime}ms (schema: ${schemaName})`
      );
    })
  );

  it(
    "[Test 6/10] UPDATE - Fail to update non-existent user (P2025)",
    useReadSchema(async ({ db, schemaName }) => {
      console.log(
        `📖 READ: Testing update non-existent user on schema: ${schemaName}`
      );

      const nonExistentId = `usr_nonexistent_${Date.now()}`;

      // Simulate production delay
      const executionTime = await simulateProductionOperation();

      // Attempt to update non-existent user
      try {
        await (
          await updateUserAction
        )({
          id: nonExistentId,
          name: "Should Fail",
          database: { client: db, schemaName },
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

      console.log(
        `✅ READ completed in ${executionTime}ms (schema: ${schemaName})`
      );
    })
  );

  it(
    "[Test 7/10] DELETE - Successfully delete user",
    useWriteSchema(async ({ db, schemaName }) => {
      console.log(`✏️  WRITE: Deleting user on schema: ${schemaName}`);

      // Ensure users table exists (matching Prisma schema)
      await db.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "${schemaName}".user (
          id SERIAL PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          name VARCHAR(100) NOT NULL,
          "isActive" BOOLEAN DEFAULT true,
          "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Generate unique test data to avoid conflicts
      const uniqueEmail = `soft_delete_${Date.now()}@example.com`;
      const created = await (
        await createUserAction
      )({
        email: uniqueEmail,
        name: "To Be Deleted",
        database: { client: db, schemaName },
      });

      const userId = created.result.id;

      // Simulate production delay
      const executionTime = await simulateProductionOperation();

      // Delete user
      const result = await (
        await deleteUserAction
      )({
        userId,
        database: { client: db, schemaName },
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
          database: { client: db, schemaName },
        } as any);
        expect.fail("User should have been deleted");
      } catch (error) {
        // Expected - user not found
        expect(error).toBeDefined();
      }

      // Verify timing
      expect(executionTime).toBeGreaterThan(0);
      expect(executionTime).toBeLessThan(12000);

      console.log(
        `✅ WRITE completed in ${executionTime}ms (schema: ${schemaName})`
      );
    })
  );

  it(
    "[Test 8/10] DELETE - Fail to delete non-existent user (P2025)",
    useReadSchema(async ({ db, schemaName }) => {
      console.log(
        `📖 READ: Testing delete non-existent user on schema: ${schemaName}`
      );

      const nonExistentId = `usr_nonexistent_${Date.now()}`;

      // Simulate production delay
      const executionTime = await simulateProductionOperation();

      // Attempt to delete non-existent user
      try {
        await (
          await deleteUserAction
        )({
          userId: nonExistentId,
          database: { client: db, schemaName },
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

      console.log(
        `✅ READ completed in ${executionTime}ms (schema: ${schemaName})`
      );
    })
  );

  it(
    "[Test 9/10] LIST - Get all users with pagination",
    useWriteSchema(async ({ db, schemaName }) => {
      console.log(
        `✏️  WRITE: Listing users with pagination on schema: ${schemaName}`
      );

      // Ensure users table exists
      await db.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "${schemaName}".user (
          id SERIAL PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          name VARCHAR(100) NOT NULL,
          "isActive" BOOLEAN DEFAULT true,
          "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create multiple test users
      const baseEmail = `list_${Date.now()}`;
      await (
        await createUserAction
      )({
        email: `${baseEmail}_1@example.com`,
        name: "User 1",
        database: { client: db, schemaName },
      });
      await (
        await createUserAction
      )({
        email: `${baseEmail}_2@example.com`,
        name: "User 2",
        database: { client: db, schemaName },
      });
      await (
        await createUserAction
      )({
        email: `${baseEmail}_3@example.com`,
        name: "User 3",
        database: { client: db, schemaName },
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
        database: { client: db, schemaName },
      } as any);

      // Verify result (getAllUsers returns PaginatedResponse)
      expect(result).toBeDefined();
      expect(result.result).toBeDefined();
      expect(result.result.data).toBeDefined();
      expect(Array.isArray(result.result.data)).toBe(true);
      expect(result.result.data.length).toBeGreaterThanOrEqual(3);

      // Verify timing
      expect(executionTime).toBeGreaterThan(0);
      expect(executionTime).toBeLessThan(12000);

      console.log(
        `✅ WRITE completed in ${executionTime}ms (schema: ${schemaName})`
      );
    })
  );

  it(
    "[Test 10/10] SEARCH - Search users with filters",
    useWriteSchema(async ({ db, schemaName }) => {
      console.log(`✏️  WRITE: Searching users on schema: ${schemaName}`);

      // Ensure users table exists
      await db.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "${schemaName}".user (
          id SERIAL PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          name VARCHAR(100) NOT NULL,
          "isActive" BOOLEAN DEFAULT true,
          "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create test users with searchable data
      const searchTerm = `search_${Date.now()}`;
      await (
        await createUserAction
      )({
        email: `${searchTerm}_alpha@example.com`,
        name: `${searchTerm} Alpha User`,
        database: { client: db, schemaName },
      });
      await (
        await createUserAction
      )({
        email: `${searchTerm}_beta@example.com`,
        name: `${searchTerm} Beta User`,
        database: { client: db, schemaName },
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
        database: { client: db, schemaName },
      } as any);

      // Verify result (searchUsers returns PaginatedResponse)
      expect(result).toBeDefined();
      expect(result.result).toBeDefined();
      expect(result.result.data).toBeDefined();
      expect(Array.isArray(result.result.data)).toBe(true);
      expect(result.result.data.length).toBeGreaterThanOrEqual(2);

      // Verify search filtering worked
      result.result.data.forEach((user: any) => {
        const matchesSearch =
          user.email.includes(searchTerm) || user.name.includes(searchTerm);
        expect(matchesSearch).toBe(true);
      });

      // Verify timing
      expect(executionTime).toBeGreaterThan(0);
      expect(executionTime).toBeLessThan(12000);

      console.log(
        `✅ WRITE completed in ${executionTime}ms (schema: ${schemaName})`
      );
    })
  );
});
