/**
 * Integration Tests for UserService
 *
 * Tests CRUD operations for user management using raw SQL queries.
 * Follows Enhanced Integration Test Agent patterns.
 *
 * Service Pattern: Raw SQL via $queryRaw/$queryRawUnsafe
 * Database: PostgreSQL (real database, no mocks)
 * Infrastructure: Shared containers, schemas, logger
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { userService } from "../../services/UserService";
import type {
  User,
  CreateUserInput,
  UpdateUserInput,
} from "../../services/UserService";
import {
  getInfrastructure,
  getSchemasByService,
  recordTestExecution,
} from "../shared/testInfrastructure";
import { simulateProductionOperation } from "../shared/testHelpers";

describe("UserService Integration Tests", () => {
  let infra: Awaited<ReturnType<typeof getInfrastructure>>;
  let schema: Awaited<ReturnType<typeof getSchemasByService>>[0];
  let testUserId: string;
  const testFileName = "user-service";

  beforeAll(async () => {
    // Skill 1: Access Infrastructure
    infra = await getInfrastructure();

    // Skill 3: Select Schema (using auth schemas since users are auth-related)
    const schemas = await getSchemasByService("auth");
    schema = schemas[Math.floor(Math.random() * schemas.length)];

    infra.logger.info(
      `🧪 Starting UserService tests on schema: ${schema.schemaName}`
    );

    // Skill 5: Create Dynamic Schema - Create users table
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

    infra.logger.info("✅ Users table created successfully");
  });

  afterAll(async () => {
    // Cleanup: Drop test table
    try {
      await schema.prisma.$executeRawUnsafe(`
        DROP TABLE IF EXISTS "${schema.schemaName}".users CASCADE
      `);
      infra.logger.info("🧹 Cleanup completed");
    } catch (error) {
      infra.logger.warn("Cleanup warning:", error);
    }
  });

  it("[Test 1/10] should create a new user successfully", async () => {
    const startTime = Date.now();

    // Skill 7: Generate Intelligent Test Data
    const uniqueEmail = `user_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}@example.com`;
    const userInput: CreateUserInput = {
      email: uniqueEmail,
      name: "Test User One",
    };

    // Skill 6: Perform Database Operations (via service)
    const user = await userService.createUser(userInput);
    testUserId = user.id; // Save for other tests

    // Assertions
    expect(user).toBeDefined();
    expect(user.id).toMatch(/^usr_/);
    expect(user.email).toBe(uniqueEmail);
    expect(user.name).toBe("Test User One");
    expect(user.isActive).toBe(true);
    expect(user.createdAt).toBeInstanceOf(Date);
    expect(user.updatedAt).toBeInstanceOf(Date);

    // Skill 8: Include Realistic Delays
    const executionTime = await simulateProductionOperation();
    expect(executionTime).toBeGreaterThan(0);
    expect(executionTime).toBeLessThan(12000);

    const duration = Date.now() - startTime;
    infra.logger.info(`✅ [Test 1/10] Create user: ${duration}ms`);

    // Skill 14: Record Test Metrics
    await recordTestExecution(
      testFileName,
      "Create user successfully",
      "success",
      duration,
      { testNumber: 1, schema: schema.schemaName }
    );
  });

  it("[Test 2/10] should get user by ID", async () => {
    const startTime = Date.now();

    // Use the user created in Test 1
    const user = await userService.getUserById(testUserId);

    // Assertions
    expect(user).not.toBeNull();
    expect(user?.id).toBe(testUserId);
    expect(user?.email).toContain("@example.com");
    expect(user?.name).toBeDefined();
    expect(user?.isActive).toBe(true);

    // Skill 8: Include Realistic Delays
    const executionTime = await simulateProductionOperation();
    expect(executionTime).toBeGreaterThan(0);
    expect(executionTime).toBeLessThan(12000);

    const duration = Date.now() - startTime;
    infra.logger.info(`✅ [Test 2/10] Get user by ID: ${duration}ms`);

    // Skill 14: Record Test Metrics
    await recordTestExecution(
      testFileName,
      "Get user by ID",
      "success",
      duration,
      {
        testNumber: 2,
        schema: schema.schemaName,
      }
    );
  });

  it("[Test 3/10] should get user by email", async () => {
    const startTime = Date.now();

    // First create a user with known email
    const uniqueEmail = `test3_${Date.now()}@example.com`;
    const created = await userService.createUser({
      email: uniqueEmail,
      name: "Test User Three",
    });

    // Now get by email
    const user = await userService.getUserByEmail(uniqueEmail);

    // Assertions
    expect(user).not.toBeNull();
    expect(user?.email).toBe(uniqueEmail);
    expect(user?.name).toBe("Test User Three");
    expect(user?.id).toBe(created.id);

    // Skill 8: Include Realistic Delays
    const executionTime = await simulateProductionOperation();
    expect(executionTime).toBeGreaterThan(0);
    expect(executionTime).toBeLessThan(12000);

    const duration = Date.now() - startTime;
    infra.logger.info(`✅ [Test 3/10] Get user by email: ${duration}ms`);

    // Skill 14: Record Test Metrics
    await recordTestExecution(
      testFileName,
      "Get user by email",
      "success",
      duration,
      { testNumber: 3, schema: schema.schemaName }
    );
  });

  it("[Test 4/10] should get all users", async () => {
    const startTime = Date.now();

    // Create a few users first
    const user1Email = `allusers1_${Date.now()}@example.com`;
    const user2Email = `allusers2_${Date.now()}@example.com`;

    await userService.createUser({ email: user1Email, name: "User One" });
    await userService.createUser({ email: user2Email, name: "User Two" });

    // Get all users
    const users = await userService.getAllUsers();

    // Assertions
    expect(users).toBeInstanceOf(Array);
    expect(users.length).toBeGreaterThanOrEqual(2);
    expect(users[0]).toHaveProperty("id");
    expect(users[0]).toHaveProperty("email");
    expect(users[0]).toHaveProperty("name");
    expect(users[0]).toHaveProperty("isActive");

    // Skill 8: Include Realistic Delays
    const executionTime = await simulateProductionOperation();
    expect(executionTime).toBeGreaterThan(0);
    expect(executionTime).toBeLessThan(12000);

    const duration = Date.now() - startTime;
    infra.logger.info(
      `✅ [Test 4/10] Get all users (${users.length} users): ${duration}ms`
    );

    // Skill 14: Record Test Metrics
    await recordTestExecution(
      testFileName,
      "Get all users",
      "success",
      duration,
      {
        testNumber: 4,
        schema: schema.schemaName,
        userCount: users.length,
      }
    );
  });

  it("[Test 5/10] should update user name", async () => {
    const startTime = Date.now();

    // Create a user to update
    const uniqueEmail = `updatetest_${Date.now()}@example.com`;
    const created = await userService.createUser({
      email: uniqueEmail,
      name: "Original Name",
    });

    // Update the name
    const updateInput: UpdateUserInput = {
      name: "Updated Name",
    };
    const updated = await userService.updateUser(created.id, updateInput);

    // Assertions
    expect(updated).toBeDefined();
    expect(updated.id).toBe(created.id);
    expect(updated.name).toBe("Updated Name");
    expect(updated.email).toBe(uniqueEmail);
    expect(updated.updatedAt.getTime()).toBeGreaterThan(
      created.updatedAt.getTime()
    );

    // Skill 8: Include Realistic Delays
    const executionTime = await simulateProductionOperation();
    expect(executionTime).toBeGreaterThan(0);
    expect(executionTime).toBeLessThan(12000);

    const duration = Date.now() - startTime;
    infra.logger.info(`✅ [Test 5/10] Update user name: ${duration}ms`);

    // Skill 14: Record Test Metrics
    await recordTestExecution(
      testFileName,
      "Update user name",
      "success",
      duration,
      { testNumber: 5, schema: schema.schemaName }
    );
  });

  it("[Test 6/10] should update user isActive status", async () => {
    const startTime = Date.now();

    // Create a user to update
    const uniqueEmail = `activestatus_${Date.now()}@example.com`;
    const created = await userService.createUser({
      email: uniqueEmail,
      name: "Active Test User",
    });

    // Deactivate the user
    const updateInput: UpdateUserInput = {
      isActive: false,
    };
    const updated = await userService.updateUser(created.id, updateInput);

    // Assertions
    expect(updated).toBeDefined();
    expect(updated.id).toBe(created.id);
    expect(updated.isActive).toBe(false);
    expect(updated.name).toBe("Active Test User");

    // Skill 8: Include Realistic Delays
    const executionTime = await simulateProductionOperation();
    expect(executionTime).toBeGreaterThan(0);
    expect(executionTime).toBeLessThan(12000);

    const duration = Date.now() - startTime;
    infra.logger.info(`✅ [Test 6/10] Update user status: ${duration}ms`);

    // Skill 14: Record Test Metrics
    await recordTestExecution(
      testFileName,
      "Update user isActive status",
      "success",
      duration,
      { testNumber: 6, schema: schema.schemaName }
    );
  });

  it("[Test 7/10] should get user count", async () => {
    const startTime = Date.now();

    // Get count before
    const countBefore = await userService.getUserCount();

    // Create a new user
    const uniqueEmail = `counttest_${Date.now()}@example.com`;
    await userService.createUser({
      email: uniqueEmail,
      name: "Count Test User",
    });

    // Get count after
    const countAfter = await userService.getUserCount();

    // Assertions
    expect(countAfter).toBe(countBefore + 1);
    expect(countAfter).toBeGreaterThan(0);

    // Skill 8: Include Realistic Delays
    const executionTime = await simulateProductionOperation();
    expect(executionTime).toBeGreaterThan(0);
    expect(executionTime).toBeLessThan(12000);

    const duration = Date.now() - startTime;
    infra.logger.info(`✅ [Test 7/10] Get user count: ${duration}ms`);

    // Skill 14: Record Test Metrics
    await recordTestExecution(
      testFileName,
      "Get user count",
      "success",
      duration,
      {
        testNumber: 7,
        schema: schema.schemaName,
        count: countAfter,
      }
    );
  });

  it("[Test 8/10] should throw error when creating user with duplicate email", async () => {
    const startTime = Date.now();

    // Skill 10: Test Error Scenarios - Duplicate email
    const uniqueEmail = `duplicate_${Date.now()}@example.com`;

    // Create first user
    await userService.createUser({
      email: uniqueEmail,
      name: "First User",
    });

    // Skill 9: Database-Aware Error Handling
    try {
      // Try to create second user with same email
      await userService.createUser({
        email: uniqueEmail,
        name: "Second User",
      });

      // Should not reach here
      expect.fail("Should have thrown error for duplicate email");
    } catch (error) {
      // Assertions
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toContain("already exists");
      infra.logger.info("✅ Correctly caught duplicate email error");
    }

    // Skill 8: Include Realistic Delays
    const executionTime = await simulateProductionOperation();
    expect(executionTime).toBeGreaterThan(0);
    expect(executionTime).toBeLessThan(12000);

    const duration = Date.now() - startTime;
    infra.logger.info(`✅ [Test 8/10] Duplicate email error: ${duration}ms`);

    // Skill 14: Record Test Metrics
    await recordTestExecution(
      testFileName,
      "Duplicate email error",
      "success",
      duration,
      { testNumber: 8, schema: schema.schemaName, errorType: "duplicate" }
    );
  });

  it("[Test 9/10] should return null when getting non-existent user by ID", async () => {
    const startTime = Date.now();

    // Skill 10: Test Error Scenarios - Not found
    const nonExistentId = `usr_nonexistent_${Date.now()}`;

    const user = await userService.getUserById(nonExistentId);

    // Assertions
    expect(user).toBeNull();
    infra.logger.info("✅ Correctly returned null for non-existent user");

    // Skill 8: Include Realistic Delays
    const executionTime = await simulateProductionOperation();
    expect(executionTime).toBeGreaterThan(0);
    expect(executionTime).toBeLessThan(12000);

    const duration = Date.now() - startTime;
    infra.logger.info(`✅ [Test 9/10] Non-existent user: ${duration}ms`);

    // Skill 14: Record Test Metrics
    await recordTestExecution(
      testFileName,
      "Non-existent user returns null",
      "success",
      duration,
      { testNumber: 9, schema: schema.schemaName, errorType: "not_found" }
    );
  });

  it("[Test 10/10] should throw error when updating non-existent user", async () => {
    const startTime = Date.now();

    // Skill 10: Test Error Scenarios - Update non-existent
    const nonExistentId = `usr_update_nonexistent_${Date.now()}`;

    // Skill 9: Database-Aware Error Handling
    try {
      await userService.updateUser(nonExistentId, { name: "New Name" });

      // Should not reach here
      expect.fail("Should have thrown error for non-existent user");
    } catch (error) {
      // Assertions
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toContain("not found");
      infra.logger.info("✅ Correctly caught non-existent user error");
    }

    // Skill 8: Include Realistic Delays
    const executionTime = await simulateProductionOperation();
    expect(executionTime).toBeGreaterThan(0);
    expect(executionTime).toBeLessThan(12000);

    const duration = Date.now() - startTime;
    infra.logger.info(
      `✅ [Test 10/10] Update non-existent user error: ${duration}ms`
    );

    // Skill 14: Record Test Metrics
    await recordTestExecution(
      testFileName,
      "Update non-existent user error",
      "success",
      duration,
      {
        testNumber: 10,
        schema: schema.schemaName,
        errorType: "update_not_found",
      }
    );
  });
});
