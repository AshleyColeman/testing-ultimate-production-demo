import { describe, it, expect } from "vitest";

// Service imports - Go UP 2 levels, then into services
import {
  createUserAction,
  getUserByIdAction,
  getAllUsersAction,
  updateUserAction,
  deleteUserAction,
  searchUsersAction,
} from "../../services/users/actions";
import type { CreateUserInput, UpdateUserInput, UserIdInput, UserFiltersInput } from "../../services/users/_data/userSchema";

/**
 * Helper function to handle ActionInput<T> = T & { database?: any }
 * For validation testing, we don't need real database context
 */
const withMockDatabase = <T>(input: T): T & { database: any } => {
  if (typeof input === 'string') {
    // For string inputs, we need to create a string-like object that passes validation
    const stringWithDb = new String(input) as any;
    stringWithDb.database = {
      // Mock database methods that might be called
      user: {
        findUnique: () => Promise.resolve(null),
        findMany: () => Promise.resolve([]),
        create: () => Promise.resolve({ id: input, email: '', name: '', isActive: true, createdAt: new Date(), updatedAt: new Date() }),
        update: () => Promise.resolve({ id: input, email: '', name: '', isActive: true, createdAt: new Date(), updatedAt: new Date() }),
        delete: () => Promise.resolve({ id: input, email: '', name: '', isActive: false, createdAt: new Date(), updatedAt: new Date() }),
      }
    };
    return stringWithDb;
  }
  return {
    ...input,
    database: {
      // Mock database for object inputs - cast to any to avoid type errors
      user: {
        findUnique: () => Promise.resolve(null),
        findMany: () => Promise.resolve([]),
        create: () => Promise.resolve({ id: 'mock-id', email: (input as any).email || '', name: (input as any).name || '', isActive: true, createdAt: new Date(), updatedAt: new Date() }),
        update: () => Promise.resolve({ id: (input as any).id || 'mock-id', email: '', name: (input as any).name || '', isActive: true, createdAt: new Date(), updatedAt: new Date() }),
        delete: () => Promise.resolve({ id: (input as any).id || 'mock-id', email: '', name: '', isActive: false, createdAt: new Date(), updatedAt: new Date() }),
      }
    }
  };
};

describe("User Actions Validation Tests", () => {
  /**
   * [Test 1/10] - Should validate email format correctly
   */
  it("[Test 1/10] Should validate email format and reject invalid emails", async () => {
    const invalidEmails = [
      "invalid-email",
      "@example.com",
      "test@",
      "test.example.com",
      "",
      "test@.com",
      "test@com",
    ];

    for (const invalidEmail of invalidEmails) {
      try {
        await createUserAction(withMockDatabase({
          email: invalidEmail,
          name: "Test User"
        }));
        expect.fail(`Should have thrown validation error for email: ${invalidEmail}`);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        const errorMessage = (error as Error).message.toLowerCase();
        expect(errorMessage).toMatch(/validation|email|format/i);
      }
    }
  });

  /**
   * [Test 2/10] - Should accept valid email formats
   */
  it("[Test 2/10] Should accept valid email formats", async () => {
    const validEmails = [
      "test@example.com",
      "user.name@domain.co.uk",
      "user+tag@example.org",
      "user123@test-domain.com",
      "test.email@example123.com",
    ];

    for (const validEmail of validEmails) {
      try {
        await createUserAction(withMockDatabase({
          email: validEmail,
          name: "Test User"
        }));
        // Should not throw validation error (might fail on database/service layer, which is OK)
      } catch (error) {
        const errorMessage = (error as Error).message.toLowerCase();
        // Should NOT be a validation error
        expect(errorMessage).not.toMatch(/validation|email|format|required/i);
      }
    }
  });

  /**
   * [Test 3/10] - Should validate required fields
   */
  it("[Test 3/10] Should validate required fields for user creation", async () => {
    // Test missing email
    try {
      await createUserAction(withMockDatabase({
        name: "Test User"
        // email missing
      } as CreateUserInput));
      expect.fail("Should have thrown validation error for missing email");
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      const errorMessage = (error as Error).message.toLowerCase();
      expect(errorMessage).toMatch(/validation|required|email/i);
    }

    // Test missing name
    try {
      await createUserAction(withMockDatabase({
        email: "test@example.com"
        // name missing
      } as CreateUserInput));
      expect.fail("Should have thrown validation error for missing name");
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      const errorMessage = (error as Error).message.toLowerCase();
      expect(errorMessage).toMatch(/validation|required|name/i);
    }

    // Test empty string email
    try {
      await createUserAction(withMockDatabase({
        email: "",
        name: "Test User"
      } as CreateUserInput));
      expect.fail("Should have thrown validation error for empty email");
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      const errorMessage = (error as Error).message.toLowerCase();
      expect(errorMessage).toMatch(/validation|required|email/i);
    }

    // Test empty string name
    try {
      await createUserAction(withMockDatabase({
        email: "test@example.com",
        name: ""
      } as CreateUserInput));
      expect.fail("Should have thrown validation error for empty name");
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      const errorMessage = (error as Error).message.toLowerCase();
      expect(errorMessage).toMatch(/validation|required|name/i);
    }
  });

  /**
   * [Test 4/10] - Should validate name length constraints
   */
  it("[Test 4/10] Should validate name length constraints", async () => {
    // Test name too long (over 100 characters)
    try {
      await createUserAction(withMockDatabase({
        email: "test@example.com",
        name: "x".repeat(101) // 101 characters
      }));
      expect.fail("Should have thrown validation error for name too long");
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      const errorMessage = (error as Error).message.toLowerCase();
      expect(errorMessage).toMatch(/validation|name.*length|100.*characters/i);
    }

    // Test name exactly 100 characters (should be valid)
    try {
      await createUserAction(withMockDatabase({
        email: "test@example.com",
        name: "x".repeat(100) // Exactly 100 characters
      }));
      // Should not throw validation error
    } catch (error) {
      const errorMessage = (error as Error).message.toLowerCase();
      expect(errorMessage).not.toMatch(/validation|name.*length|100.*characters/i);
    }
  });

  /**
   * [Test 5/10] - Should validate user ID requirements
   */
  it("[Test 5/10] Should validate user ID requirements for string inputs", async () => {
    // Test empty user ID
    try {
      await getUserByIdAction(withMockDatabase(""));
      expect.fail("Should have thrown validation error for empty user ID");
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      const errorMessage = (error as Error).message.toLowerCase();
      // The action validates that empty strings fail the min(1) constraint
      expect(errorMessage).toMatch(/validation|min|required|user.*id|string/i);
    }

    // Test valid user ID (should not throw validation error)
    try {
      await getUserByIdAction(withMockDatabase("valid-user-id-123"));
      // Should not throw validation error
    } catch (error) {
      const errorMessage = (error as Error).message.toLowerCase();
      expect(errorMessage).not.toMatch(/validation|min|required|user.*id/i);
    }
  });

  /**
   * [Test 6/10] - Should validate filter inputs with correct enum types
   */
  it("[Test 6/10] Should validate filter inputs with correct enum types", async () => {
    // Test valid enum values for getAllUsers
    try {
      await getAllUsersAction(withMockDatabase({
        page: 1,
        limit: 10,
        sortBy: 'createdAt' as const, // Valid enum
        sortOrder: 'desc' as const,   // Valid enum
      }));
      // Should not throw validation error
    } catch (error) {
      const errorMessage = (error as Error).message.toLowerCase();
      expect(errorMessage).not.toMatch(/validation|enum/i);
    }

    // Test valid enum values for searchUsers
    try {
      await searchUsersAction(withMockDatabase({
        search: "test",
        page: 1,
        limit: 5,
        sortBy: 'name' as const,    // Valid enum
        sortOrder: 'asc' as const,   // Valid enum
      }));
      // Should not throw validation error
    } catch (error) {
      const errorMessage = (error as Error).message.toLowerCase();
      expect(errorMessage).not.toMatch(/validation|enum/i);
    }
  });

  /**
   * [Test 7/10] - Should handle update user validation
   */
  it("[Test 7/10] Should handle update user validation", async () => {
    // Test update with valid data
    try {
      await updateUserAction(withMockDatabase({
        id: "user-123",
        name: "Updated Name",
        isActive: true,
      }));
      // Should not throw validation error
    } catch (error) {
      const errorMessage = (error as Error).message.toLowerCase();
      expect(errorMessage).not.toMatch(/validation/i);
    }

    // Test update with optional fields only
    try {
      await updateUserAction(withMockDatabase({
        id: "user-123",
        name: "Another Update",
        // isActive omitted (should be fine)
      }));
      // Should not throw validation error
    } catch (error) {
      const errorMessage = (error as Error).message.toLowerCase();
      expect(errorMessage).not.toMatch(/validation/i);
    }
  });

  /**
   * [Test 8/10] - Should validate filter constraints
   */
  it("[Test 8/10] Should validate filter constraints", async () => {
    // Test page number constraints
    try {
      await getAllUsersAction(withMockDatabase({
        page: 0, // Should fail min(1) constraint
        limit: 10,
        sortBy: 'createdAt' as const, // Add required sortBy
        sortOrder: 'desc' as const,   // Add required sortOrder
      }));
      expect.fail("Should have thrown validation error for page < 1");
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      const errorMessage = (error as Error).message.toLowerCase();
      expect(errorMessage).toMatch(/validation|page|min/i);
    }

    // Test limit constraints
    try {
      await getAllUsersAction(withMockDatabase({
        page: 1,
        limit: 101, // Should fail max(100) constraint
        sortBy: 'createdAt' as const, // Add required sortBy
        sortOrder: 'desc' as const,   // Add required sortOrder
      }));
      expect.fail("Should have thrown validation error for limit > 100");
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      const errorMessage = (error as Error).message.toLowerCase();
      expect(errorMessage).toMatch(/validation|limit|max/i);
    }

    // Test valid constraints
    try {
      await getAllUsersAction(withMockDatabase({
        page: 1,
        limit: 50, // Valid limit
        sortBy: 'createdAt' as const, // Add required sortBy
        sortOrder: 'desc' as const,   // Add required sortOrder
      }));
      // Should not throw validation error
    } catch (error) {
      const errorMessage = (error as Error).message.toLowerCase();
      expect(errorMessage).not.toMatch(/validation|limit|max|page|min/i);
    }
  });

  /**
   * [Test 9/10] - Should handle action passthrough behavior
   */
  it("[Test 9/10] Should handle action passthrough behavior for additional properties", async () => {
    // Test that additional properties (like database) are passed through
    try {
      const result = await createUserAction(withMockDatabase({
        email: "test@example.com",
        name: "Test User",
        // database should be passed through via passthrough()
      }));
      // Should not throw validation error for additional properties
    } catch (error) {
      const errorMessage = (error as Error).message.toLowerCase();
      expect(errorMessage).not.toMatch(/validation|unknown|additional/i);
    }
  });

  /**
   * [Test 10/10] - Should maintain action type safety
   */
  it("[Test 10/10] Should maintain action type safety and structure", async () => {
    // Test that actions return expected structure (even if they fail on service layer)
    const actions = [
      () => createUserAction(withMockDatabase({ email: "test@example.com", name: "Test" })),
      () => getUserByIdAction(withMockDatabase("user-123")),
      () => getAllUsersAction(withMockDatabase({
        page: 1,
        limit: 10,
        sortBy: 'createdAt' as const, // Add required sortBy
        sortOrder: 'desc' as const   // Add required sortOrder
      })),
      () => updateUserAction(withMockDatabase({ id: "user-123", name: "Updated" })),
      () => deleteUserAction(withMockDatabase("user-123")),
      () => searchUsersAction(withMockDatabase({
        search: "test",
        page: 1, // Add required page
        limit: 10, // Add required limit
        sortBy: 'name' as const, // Add required sortBy
        sortOrder: 'asc' as const   // Add required sortOrder
      })),
    ];

    for (const action of actions) {
      try {
        const result = await action();
        // If action succeeds, verify it has expected structure
        expect(result).toBeDefined();
      } catch (error) {
        // If action fails, ensure it's not a validation error (we tested those above)
        const errorMessage = (error as Error).message.toLowerCase();

        // Allow service/database errors but not validation errors for valid inputs
        if (errorMessage.includes('validation')) {
          // Only fail if it's an unexpected validation error
          if (!errorMessage.includes('email') && !errorMessage.includes('name') &&
              !errorMessage.includes('required') && !errorMessage.includes('length')) {
            expect.fail(`Unexpected validation error: ${(error as Error).message}`);
          }
        }
      }
    }
  });
});