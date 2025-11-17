import { describe, it, expect, beforeAll, afterAll } from "vitest";

// Service imports - Go UP 2 levels, then into services
import { userService } from "../../services/UserService";
import type {
  CreateUserInput,
  UpdateUserInput,
} from "../../services/UserService";

// Infrastructure imports - Go UP 1 level, then into shared
import {
  getInfrastructure,
  getSchemasByService,
  recordTestExecution,
} from "../shared/testInfrastructure";

// Helper imports - Go UP 1 level, then into shared
import { simulateProductionOperation } from "../shared/testHelpers";

describe("UserService Integration Tests", () => {
  let schema: any;

  beforeAll(async () => {
    // Initialize infrastructure
    await getInfrastructure();

    // Get auth schemas (UserService uses auth database)
    const schemas = await getSchemasByService("auth");
    schema = schemas[Math.floor(Math.random() * schemas.length)];

    // Create users table for raw SQL service
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
  });

  // Helper function to generate unique test data
  const generateUniqueEmail = (testNumber: number) =>
    `test${testNumber}_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 6)}@example.com`;

  const generateUniqueName = (testNumber: number) =>
    `Test User ${testNumber} ${Date.now()}`;

  // Helper wrapper for test execution with timing and recording
  const executeUserTest = async (
    testName: string,
    testFn: () => Promise<any>
  ) => {
    const startTime = Date.now();
    try {
      const result = await testFn();
      const executionTime = Date.now() - startTime;
      await recordTestExecution(
        "user-service",
        testName,
        "success",
        executionTime,
        {
          schema: schema.schemaName,
        }
      );
      return result;
    } catch (error) {
      const executionTime = Date.now() - startTime;
      await recordTestExecution(
        "user-service",
        testName,
        "failure",
        executionTime,
        {
          schema: schema.schemaName,
          error: (error as Error).message,
        }
      );
      throw error;
    }
  };

  it.only("[Test 1/10] Create user successfully", async () => {
    await executeUserTest("Create user successfully", async () => {
      const userData: CreateUserInput = {
        email: generateUniqueEmail(1),
        name: generateUniqueName(1),
      };

      const user = await userService.createUser(userData);

      expect(user).toBeDefined();
      expect(user.email).toBe(userData.email);
      expect(user.name).toBe(userData.name);
      expect(user.isActive).toBe(true);
      expect(user.id).toMatch(/^usr_\d+_[a-z0-9]+$/);
      expect(user.createdAt).toBeInstanceOf(Date);
      expect(user.updatedAt).toBeInstanceOf(Date);

      const executionTime = await simulateProductionOperation();
      expect(executionTime).toBeGreaterThan(0);
      expect(executionTime).toBeLessThan(12000);

      return user;
    });
  });

  it("[Test 2/10] Get user by ID successfully", async () => {
    await executeUserTest("Get user by ID successfully", async () => {
      // First create a user
      const userData: CreateUserInput = {
        email: generateUniqueEmail(2),
        name: generateUniqueName(2),
      };
      const createdUser = await userService.createUser(userData);

      // Then retrieve by ID
      const retrievedUser = await userService.getUserById(createdUser.id);

      expect(retrievedUser).toBeDefined();
      expect(retrievedUser?.id).toBe(createdUser.id);
      expect(retrievedUser?.email).toBe(userData.email);
      expect(retrievedUser?.name).toBe(userData.name);

      const executionTime = await simulateProductionOperation();
      expect(executionTime).toBeGreaterThan(0);
      expect(executionTime).toBeLessThan(12000);

      return retrievedUser;
    });
  });

  it("[Test 3/10] Get user by email successfully", async () => {
    await executeUserTest("Get user by email successfully", async () => {
      const userData: CreateUserInput = {
        email: generateUniqueEmail(3),
        name: generateUniqueName(3),
      };
      const createdUser = await userService.createUser(userData);

      const retrievedUser = await userService.getUserByEmail(userData.email);

      expect(retrievedUser).toBeDefined();
      expect(retrievedUser?.id).toBe(createdUser.id);
      expect(retrievedUser?.email).toBe(userData.email);
      expect(retrievedUser?.name).toBe(userData.name);

      const executionTime = await simulateProductionOperation();
      expect(executionTime).toBeGreaterThan(0);
      expect(executionTime).toBeLessThan(12000);

      return retrievedUser;
    });
  });

  it("[Test 4/10] Update user successfully", async () => {
    await executeUserTest("Update user successfully", async () => {
      // Create user first
      const userData: CreateUserInput = {
        email: generateUniqueEmail(4),
        name: generateUniqueName(4),
      };
      const createdUser = await userService.createUser(userData);

      // Update user
      const updateData: UpdateUserInput = {
        name: "Updated Name",
        isActive: false,
      };
      const updatedUser = await userService.updateUser(
        createdUser.id,
        updateData
      );

      expect(updatedUser).toBeDefined();
      expect(updatedUser.id).toBe(createdUser.id);
      expect(updatedUser.email).toBe(userData.email);
      expect(updatedUser.name).toBe(updateData.name);
      expect(updatedUser.isActive).toBe(updateData.isActive);
      expect(updatedUser.updatedAt.getTime()).toBeGreaterThan(
        createdUser.updatedAt.getTime()
      );

      const executionTime = await simulateProductionOperation();
      expect(executionTime).toBeGreaterThan(0);
      expect(executionTime).toBeLessThan(12000);

      return updatedUser;
    });
  });

  it("[Test 5/10] Get all users successfully", async () => {
    await executeUserTest("Get all users successfully", async () => {
      // Create multiple users
      const users = [];
      for (let i = 0; i < 3; i++) {
        const userData: CreateUserInput = {
          email: generateUniqueEmail(50 + i),
          name: generateUniqueName(50 + i),
        };
        users.push(await userService.createUser(userData));
      }

      // Get all users
      const allUsers = await userService.getAllUsers();

      expect(allUsers).toBeDefined();
      expect(Array.isArray(allUsers)).toBe(true);
      expect(allUsers.length).toBeGreaterThanOrEqual(3);

      // Verify our created users are in the list
      users.forEach((createdUser) => {
        const found = allUsers.find((u) => u.id === createdUser.id);
        expect(found).toBeDefined();
        expect(found?.email).toBe(createdUser.email);
      });

      const executionTime = await simulateProductionOperation();
      expect(executionTime).toBeGreaterThan(0);
      expect(executionTime).toBeLessThan(12000);

      return allUsers;
    });
  });

  it("[Test 6/10] Get user count successfully", async () => {
    await executeUserTest("Get user count successfully", async () => {
      // Create a user to ensure count > 0
      const userData: CreateUserInput = {
        email: generateUniqueEmail(6),
        name: generateUniqueName(6),
      };
      await userService.createUser(userData);

      const count = await userService.getUserCount();

      expect(count).toBeDefined();
      expect(typeof count).toBe("number");
      expect(count).toBeGreaterThan(0);

      const executionTime = await simulateProductionOperation();
      expect(executionTime).toBeGreaterThan(0);
      expect(executionTime).toBeLessThan(12000);

      return count;
    });
  });

  it("[Test 7/10] Create user with duplicate email should fail", async () => {
    await executeUserTest(
      "Create user with duplicate email should fail",
      async () => {
        const email = generateUniqueEmail(7);
        const userData1: CreateUserInput = {
          email,
          name: generateUniqueName(7),
        };
        const userData2: CreateUserInput = {
          email, // Same email
          name: "Another Name",
        };

        // First user should succeed
        await userService.createUser(userData1);

        // Second user with same email should fail
        try {
          await userService.createUser(userData2);
          expect.fail("Should have thrown an error for duplicate email");
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
          expect((error as Error).message).toContain("already exists");
        }

        const executionTime = await simulateProductionOperation();
        expect(executionTime).toBeGreaterThan(0);
        expect(executionTime).toBeLessThan(12000);
      }
    );
  });

  it("[Test 8/10] Create user with invalid email should fail", async () => {
    await executeUserTest(
      "Create user with invalid email should fail",
      async () => {
        const userData: CreateUserInput = {
          email: "invalid-email", // Invalid format
          name: generateUniqueName(8),
        };

        try {
          await userService.createUser(userData);
          expect.fail("Should have thrown an error for invalid email");
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
          expect((error as Error).message).toContain("Invalid email format");
        }

        const executionTime = await simulateProductionOperation();
        expect(executionTime).toBeGreaterThan(0);
        expect(executionTime).toBeLessThan(12000);
      }
    );
  });

  it("[Test 9/10] Get user by non-existent ID should return null", async () => {
    await executeUserTest(
      "Get user by non-existent ID should return null",
      async () => {
        const nonExistentId = "usr_non_existent_12345";
        const user = await userService.getUserById(nonExistentId);

        expect(user).toBeNull();

        const executionTime = await simulateProductionOperation();
        expect(executionTime).toBeGreaterThan(0);
        expect(executionTime).toBeLessThan(12000);
      }
    );
  });

  it("[Test 10/30] Delete user successfully", async () => {
    await executeUserTest("Delete user successfully", async () => {
      // Create user first
      const userData: CreateUserInput = {
        email: generateUniqueEmail(10),
        name: generateUniqueName(10),
      };
      const createdUser = await userService.createUser(userData);

      // Verify user exists
      const beforeDelete = await userService.getUserById(createdUser.id);
      expect(beforeDelete).toBeDefined();

      // Delete user
      const deletedCount = await userService.deleteUser(createdUser.id);

      expect(deletedCount).toBe(1);

      // Verify user is gone
      const afterDelete = await userService.getUserById(createdUser.id);
      expect(afterDelete).toBeNull();

      const executionTime = await simulateProductionOperation();
      expect(executionTime).toBeGreaterThan(0);
      expect(executionTime).toBeLessThan(12000);

      return deletedCount;
    });
  });

  // ========== ADVANCED TESTS (11-30) ==========

  it("[Test 11/30] Create user with missing email should fail", async () => {
    await executeUserTest(
      "Create user with missing email should fail",
      async () => {
        const userData = {
          name: generateUniqueName(11),
          // Missing email
        } as CreateUserInput;

        try {
          await userService.createUser(userData);
          expect.fail("Should have thrown an error for missing email");
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
          expect((error as Error).message).toContain(
            "Email and name are required"
          );
        }

        const executionTime = await simulateProductionOperation();
        expect(executionTime).toBeGreaterThan(0);
        expect(executionTime).toBeLessThan(12000);
      }
    );
  });

  it("[Test 12/30] Create user with missing name should fail", async () => {
    await executeUserTest(
      "Create user with missing name should fail",
      async () => {
        const userData = {
          email: generateUniqueEmail(12),
          // Missing name
        } as CreateUserInput;

        try {
          await userService.createUser(userData);
          expect.fail("Should have thrown an error for missing name");
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
          expect((error as Error).message).toContain(
            "Email and name are required"
          );
        }

        const executionTime = await simulateProductionOperation();
        expect(executionTime).toBeGreaterThan(0);
        expect(executionTime).toBeLessThan(12000);
      }
    );
  });

  it("[Test 13/30] Create user with empty email should fail", async () => {
    await executeUserTest(
      "Create user with empty email should fail",
      async () => {
        const userData: CreateUserInput = {
          email: "",
          name: generateUniqueName(13),
        };

        try {
          await userService.createUser(userData);
          expect.fail("Should have thrown an error for empty email");
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
          expect((error as Error).message).toContain(
            "Email and name are required"
          );
        }

        const executionTime = await simulateProductionOperation();
        expect(executionTime).toBeGreaterThan(0);
        expect(executionTime).toBeLessThan(12000);
      }
    );
  });

  it("[Test 14/30] Update non-existent user should fail", async () => {
    await executeUserTest("Update non-existent user should fail", async () => {
      const nonExistentId = "usr_non_existent_update_12345";
      const updateData: UpdateUserInput = {
        name: "Updated Name",
      };

      try {
        await userService.updateUser(nonExistentId, updateData);
        expect.fail("Should have thrown an error for non-existent user");
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain("not found");
      }

      const executionTime = await simulateProductionOperation();
      expect(executionTime).toBeGreaterThan(0);
      expect(executionTime).toBeLessThan(12000);
    });
  });

  it("[Test 15/30] Update user with empty ID should fail", async () => {
    await executeUserTest("Update user with empty ID should fail", async () => {
      const updateData: UpdateUserInput = {
        name: "Updated Name",
      };

      try {
        await userService.updateUser("", updateData);
        expect.fail("Should have thrown an error for empty ID");
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain("User ID is required");
      }

      const executionTime = await simulateProductionOperation();
      expect(executionTime).toBeGreaterThan(0);
      expect(executionTime).toBeLessThan(12000);
    });
  });

  it("[Test 16/30] Get user by empty ID should fail", async () => {
    await executeUserTest("Get user by empty ID should fail", async () => {
      try {
        await userService.getUserById("");
        expect.fail("Should have thrown an error for empty ID");
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain("User ID is required");
      }

      const executionTime = await simulateProductionOperation();
      expect(executionTime).toBeGreaterThan(0);
      expect(executionTime).toBeLessThan(12000);
    });
  });

  it("[Test 17/30] Get user by empty email should fail", async () => {
    await executeUserTest("Get user by empty email should fail", async () => {
      try {
        await userService.getUserByEmail("");
        expect.fail("Should have thrown an error for empty email");
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain("Email is required");
      }

      const executionTime = await simulateProductionOperation();
      expect(executionTime).toBeGreaterThan(0);
      expect(executionTime).toBeLessThan(12000);
    });
  });

  it("[Test 18/30] Update user with no changes should return unchanged user", async () => {
    await executeUserTest(
      "Update user with no changes should return unchanged user",
      async () => {
        // Create user first
        const userData: CreateUserInput = {
          email: generateUniqueEmail(18),
          name: generateUniqueName(18),
        };
        const createdUser = await userService.createUser(userData);

        // Update with empty data (no changes)
        const updateData: UpdateUserInput = {};
        const updatedUser = await userService.updateUser(
          createdUser.id,
          updateData
        );

        expect(updatedUser).toBeDefined();
        expect(updatedUser.id).toBe(createdUser.id);
        expect(updatedUser.email).toBe(createdUser.email);
        expect(updatedUser.name).toBe(createdUser.name);
        expect(updatedUser.isActive).toBe(createdUser.isActive);

        const executionTime = await simulateProductionOperation();
        expect(executionTime).toBeGreaterThan(0);
        expect(executionTime).toBeLessThan(12000);

        return updatedUser;
      }
    );
  });

  it("[Test 19/30] Update user name only", async () => {
    await executeUserTest("Update user name only", async () => {
      // Create user first
      const userData: CreateUserInput = {
        email: generateUniqueEmail(19),
        name: generateUniqueName(19),
      };
      const createdUser = await userService.createUser(userData);

      // Update only name
      const updateData: UpdateUserInput = {
        name: "New Name Only",
      };
      const updatedUser = await userService.updateUser(
        createdUser.id,
        updateData
      );

      expect(updatedUser).toBeDefined();
      expect(updatedUser.id).toBe(createdUser.id);
      expect(updatedUser.email).toBe(createdUser.email);
      expect(updatedUser.name).toBe("New Name Only");
      expect(updatedUser.isActive).toBe(createdUser.isActive); // Should remain unchanged

      const executionTime = await simulateProductionOperation();
      expect(executionTime).toBeGreaterThan(0);
      expect(executionTime).toBeLessThan(12000);

      return updatedUser;
    });
  });

  it("[Test 20/30] Update user status only", async () => {
    await executeUserTest("Update user status only", async () => {
      // Create user first
      const userData: CreateUserInput = {
        email: generateUniqueEmail(20),
        name: generateUniqueName(20),
      };
      const createdUser = await userService.createUser(userData);

      // Update only status
      const updateData: UpdateUserInput = {
        isActive: false,
      };
      const updatedUser = await userService.updateUser(
        createdUser.id,
        updateData
      );

      expect(updatedUser).toBeDefined();
      expect(updatedUser.id).toBe(createdUser.id);
      expect(updatedUser.email).toBe(createdUser.email);
      expect(updatedUser.name).toBe(createdUser.name); // Should remain unchanged
      expect(updatedUser.isActive).toBe(false);

      const executionTime = await simulateProductionOperation();
      expect(executionTime).toBeGreaterThan(0);
      expect(executionTime).toBeLessThan(12000);

      return updatedUser;
    });
  });

  it("[Test 21/30] Create user with special characters in name", async () => {
    await executeUserTest(
      "Create user with special characters in name",
      async () => {
        const userData: CreateUserInput = {
          email: generateUniqueEmail(21),
          name: "José María O'Donnell-Smith (测试)",
        };

        const user = await userService.createUser(userData);

        expect(user).toBeDefined();
        expect(user.email).toBe(userData.email);
        expect(user.name).toBe(userData.name);
        expect(user.isActive).toBe(true);

        const executionTime = await simulateProductionOperation();
        expect(executionTime).toBeGreaterThan(0);
        expect(executionTime).toBeLessThan(12000);

        return user;
      }
    );
  });

  it("[Test 22/30] Create user with very long name", async () => {
    await executeUserTest("Create user with very long name", async () => {
      const longName = "A".repeat(250); // Test long name handling
      const userData: CreateUserInput = {
        email: generateUniqueEmail(22),
        name: longName,
      };

      const user = await userService.createUser(userData);

      expect(user).toBeDefined();
      expect(user.email).toBe(userData.email);
      expect(user.name).toBe(longName);
      expect(user.name.length).toBe(250);

      const executionTime = await simulateProductionOperation();
      expect(executionTime).toBeGreaterThan(0);
      expect(executionTime).toBeLessThan(12000);

      return user;
    });
  });

  it("[Test 23/30] Delete non-existent user should return 0", async () => {
    await executeUserTest(
      "Delete non-existent user should return 0",
      async () => {
        const nonExistentId = "usr_non_existent_delete_12345";
        const deletedCount = await userService.deleteUser(nonExistentId);

        expect(deletedCount).toBe(0);

        const executionTime = await simulateProductionOperation();
        expect(executionTime).toBeGreaterThan(0);
        expect(executionTime).toBeLessThan(12000);

        return deletedCount;
      }
    );
  });

  it("[Test 24/30] Delete user with empty ID should fail", async () => {
    await executeUserTest("Delete user with empty ID should fail", async () => {
      try {
        await userService.deleteUser("");
        expect.fail("Should have thrown an error for empty ID");
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain("User ID is required");
      }

      const executionTime = await simulateProductionOperation();
      expect(executionTime).toBeGreaterThan(0);
      expect(executionTime).toBeLessThan(12000);
    });
  });

  it("[Test 25/30] Get user by non-existent email should return null", async () => {
    await executeUserTest(
      "Get user by non-existent email should return null",
      async () => {
        const nonExistentEmail = `nonexistent${Date.now()}@example.com`;
        const user = await userService.getUserByEmail(nonExistentEmail);

        expect(user).toBeNull();

        const executionTime = await simulateProductionOperation();
        expect(executionTime).toBeGreaterThan(0);
        expect(executionTime).toBeLessThan(12000);
      }
    );
  });

  it("[Test 26/30] Get all users when empty should return empty array", async () => {
    await executeUserTest(
      "Get all users when empty should return empty array",
      async () => {
        // Clean up all users first
        await userService.deleteAllUsers();

        const allUsers = await userService.getAllUsers();

        expect(allUsers).toBeDefined();
        expect(Array.isArray(allUsers)).toBe(true);
        expect(allUsers.length).toBe(0);

        const executionTime = await simulateProductionOperation();
        expect(executionTime).toBeGreaterThan(0);
        expect(executionTime).toBeLessThan(12000);

        return allUsers;
      }
    );
  });

  it("[Test 27/30] Create multiple users and verify ordering by createdAt", async () => {
    await executeUserTest(
      "Create multiple users and verify ordering by createdAt",
      async () => {
        // Clean up first
        await userService.deleteAllUsers();

        const users = [];
        const startTime = Date.now();

        // Create users with delays to ensure different timestamps
        for (let i = 0; i < 3; i++) {
          await new Promise((resolve) => setTimeout(resolve, 50)); // Small delay
          const userData: CreateUserInput = {
            email: generateUniqueEmail(27 + i),
            name: `User ${i + 1}`,
          };
          users.push(await userService.createUser(userData));
        }

        const allUsers = await userService.getAllUsers();

        expect(allUsers.length).toBe(3);

        // Verify ordering (should be descending by createdAt)
        for (let i = 0; i < allUsers.length - 1; i++) {
          const currentTime = allUsers[i].createdAt.getTime();
          const nextTime = allUsers[i + 1].createdAt.getTime();
          expect(currentTime).toBeGreaterThanOrEqual(nextTime);
        }

        const executionTime = await simulateProductionOperation();
        expect(executionTime).toBeGreaterThan(0);
        expect(executionTime).toBeLessThan(12000);

        return allUsers;
      }
    );
  });

  it("[Test 28/30] Reactivate deactivated user", async () => {
    await executeUserTest("Reactivate deactivated user", async () => {
      // Create user
      const userData: CreateUserInput = {
        email: generateUniqueEmail(28),
        name: generateUniqueName(28),
      };
      const createdUser = await userService.createUser(userData);

      // Deactivate user
      const deactivatedUser = await userService.updateUser(createdUser.id, {
        isActive: false,
      });
      expect(deactivatedUser.isActive).toBe(false);

      // Reactivate user
      const reactivatedUser = await userService.updateUser(createdUser.id, {
        isActive: true,
      });
      expect(reactivatedUser.isActive).toBe(true);
      expect(reactivatedUser.id).toBe(createdUser.id);
      expect(reactivatedUser.email).toBe(createdUser.email);
      expect(reactivatedUser.name).toBe(createdUser.name);

      const executionTime = await simulateProductionOperation();
      expect(executionTime).toBeGreaterThan(0);
      expect(executionTime).toBeLessThan(12000);

      return reactivatedUser;
    });
  });

  it("[Test 29/30] User email case sensitivity test", async () => {
    await executeUserTest("User email case sensitivity test", async () => {
      const emailBase = generateUniqueEmail(29).toLowerCase();
      const userData1: CreateUserInput = {
        email: emailBase,
        name: "User 1",
      };

      // Create first user
      const user1 = await userService.createUser(userData1);

      // Try to create user with same email but different case
      const userData2: CreateUserInput = {
        email: emailBase.toUpperCase(),
        name: "User 2",
      };

      try {
        await userService.createUser(userData2);
        expect.fail(
          "Should have thrown an error for case-insensitive duplicate email"
        );
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain("already exists");
      }

      const executionTime = await simulateProductionOperation();
      expect(executionTime).toBeGreaterThan(0);
      expect(executionTime).toBeLessThan(12000);

      return user1;
    });
  });

  it("[Test 30/30] Performance test: Create and retrieve 10 users", async () => {
    await executeUserTest(
      "Performance test: Create and retrieve 10 users",
      async () => {
        const users = [];
        const startTime = Date.now();

        // Create 10 users rapidly
        for (let i = 0; i < 10; i++) {
          const userData: CreateUserInput = {
            email: generateUniqueEmail(30 + i),
            name: `Performance User ${i + 1}`,
          };
          users.push(await userService.createUser(userData));
        }

        const createTime = Date.now() - startTime;

        // Retrieve all 10 users
        const retrieveStartTime = Date.now();
        const retrievedUsers = [];

        for (const user of users) {
          const retrieved = await userService.getUserById(user.id);
          expect(retrieved).toBeDefined();
          expect(retrieved?.id).toBe(user.id);
          retrievedUsers.push(retrieved);
        }

        const retrieveTime = Date.now() - retrieveStartTime;

        // Verify performance expectations
        expect(createTime).toBeLessThan(5000); // Should create 10 users in under 5 seconds
        expect(retrieveTime).toBeLessThan(3000); // Should retrieve 10 users in under 3 seconds
        expect(retrievedUsers.length).toBe(10);

        // Verify count matches
        const count = await userService.getUserCount();
        expect(count).toBeGreaterThanOrEqual(10);

        const executionTime = await simulateProductionOperation();
        expect(executionTime).toBeGreaterThan(0);
        expect(executionTime).toBeLessThan(12000);

        return { createTime, retrieveTime, userCount: count };
      }
    );
  });
});
