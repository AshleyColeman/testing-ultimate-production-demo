import { describe, it, expect, beforeEach } from "vitest";
import { deleteUserAction, createUserAction, getUserByIdAction } from "../actions";
import { createTestDatabase, setupTestSchemas, cleanupTestDatabase } from "../../../../src/__tests__/shared/testInfrastructure";

describe("deleteUserAction", () => {
  let testDb: any;
  let createdUserId: number;

  beforeEach(async () => {
    testDb = await createTestDatabase();
    await setupTestSchemas(testDb);
    const user = await createUserAction({
      name: "Test User",
      email: "delete.test@example.com",
      role: "user",
      status: "active",
      database: testDb
    });
    createdUserId = user.result.id;
  });

  it("deletes the user successfully", async () => {
    const result = await deleteUserAction({ userId: createdUserId });
    expect(result.result).toBe(true);
    expect(result.message).toBe("Successfully deleted user");
  });

  it("returns false when user ID does not exist", async () => {
    const result = await deleteUserAction({ userId: 99999 });
    expect(result.result).toBe(false);
  });

  it("validates user ID is required", async () => {
    await expect(deleteUserAction({})).rejects.toThrow();
  });

  it("validates user ID is a positive number", async () => {
    await expect(deleteUserAction({ userId: -1 })).rejects.toThrow();
  });

  it("validates user ID is a number", async () => {
    await expect(deleteUserAction({ userId: "invalid" })).rejects.toThrow();
  });

  it("validates user ID is not zero", async () => {
    await expect(deleteUserAction({ userId: 0 })).rejects.toThrow();
  });

  it("actually removes user from database", async () => {
    await deleteUserAction({ userId: createdUserId });
    const checkUser = await getUserByIdAction({ userId: createdUserId });
    expect(checkUser.result).toBeNull();
  });

  it("handles database connection errors gracefully", async () => {
    const invalidDb = { query: () => Promise.reject(new Error("Connection failed")) };
    await expect(deleteUserAction({ userId: createdUserId, database: invalidDb })).rejects.toThrow();
  });

  it("works with custom database instance", async () => {
    const result = await deleteUserAction({ userId: createdUserId, database: testDb });
    expect(result.result).toBe(true);
    expect(result.message).toBe("Successfully deleted user");
  });

  it("handles deleting already deleted user", async () => {
    await deleteUserAction({ userId: createdUserId });
    const secondDelete = await deleteUserAction({ userId: createdUserId });
    expect(secondDelete.result).toBe(false);
  });
});