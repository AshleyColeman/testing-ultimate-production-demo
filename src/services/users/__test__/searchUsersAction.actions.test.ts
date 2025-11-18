import { describe, it, expect, beforeEach } from "vitest";
import { searchUsersAction, createUserAction } from "../actions";
import { createTestDatabase, setupTestSchemas, cleanupTestDatabase } from "../../../../src/__tests__/shared/testInfrastructure";

describe("searchUsersAction", () => {
  let testDb: any;
  let testUserIds: number[] = [];

  beforeEach(async () => {
    testDb = await createTestDatabase();
    await setupTestSchemas(testDb);

    const users = [
      { name: "Alice Smith", email: "alice@example.com", role: "user", status: "active" },
      { name: "Bob Johnson", email: "bob@example.com", role: "admin", status: "active" },
      { name: "Alice Brown", email: "alice.brown@example.com", role: "user", status: "inactive" },
      { name: "Charlie Wilson", email: "charlie@example.com", role: "user", status: "active" }
    ];

    for (const user of users) {
      const result = await createUserAction({ ...user, database: testDb });
      testUserIds.push(result.result.id);
    }
  });

  it("returns all users when no filters are applied", async () => {
    const result = await searchUsersAction({});
    expect(result.result.users).toBeDefined();
    expect(Array.isArray(result.result.users)).toBe(true);
    expect(result.result.users.length).toBeGreaterThanOrEqual(4);
  });

  it("filters users by search term in name", async () => {
    const result = await searchUsersAction({ search: "Alice" });
    expect(result.result.users.every((user: any) =>
      user.name.toLowerCase().includes("alice".toLowerCase())
    )).toBe(true);
  });

  it("filters users by search term in email", async () => {
    const result = await searchUsersAction({ search: "bob@example.com" });
    expect(result.result.users.every((user: any) =>
      user.email.toLowerCase().includes("bob@example.com".toLowerCase())
    )).toBe(true);
  });

  it("filters users by status", async () => {
    const result = await searchUsersAction({ status: "active" });
    expect(result.result.users.every((user: any) => user.status === "active")).toBe(true);
  });

  it("filters users by role", async () => {
    const result = await searchUsersAction({ role: "admin" });
    expect(result.result.users.every((user: any) => user.role === "admin")).toBe(true);
  });

  it("applies pagination limit", async () => {
    const result = await searchUsersAction({ limit: 2 });
    expect(result.result.users.length).toBeLessThanOrEqual(2);
  });

  it("applies pagination offset", async () => {
    const firstPage = await searchUsersAction({ limit: 2, offset: 0 });
    const secondPage = await searchUsersAction({ limit: 2, offset: 2 });
    expect(firstPage.result.users).not.toEqual(secondPage.result.users);
  });

  it("applies multiple filters simultaneously", async () => {
    const result = await searchUsersAction({
      search: "Alice",
      status: "active",
      limit: 5
    });
    expect(result.result.users.every((user: any) =>
      user.name.toLowerCase().includes("alice".toLowerCase()) &&
      user.status === "active"
    )).toBe(true);
  });

  it("validates search term is a string", async () => {
    await expect(searchUsersAction({ search: 123 })).rejects.toThrow();
  });

  it("validates limit is positive", async () => {
    await expect(searchUsersAction({ limit: -1 })).rejects.toThrow();
  });

  it("validates offset is non-negative", async () => {
    await expect(searchUsersAction({ offset: -1 })).rejects.toThrow();
  });

  it("returns empty array for no matching results", async () => {
    const result = await searchUsersAction({ search: "nonexistentuser" });
    expect(result.result.users).toEqual([]);
  });

  it("returns pagination metadata", async () => {
    const result = await searchUsersAction({ limit: 5 });
    expect(result.result).toHaveProperty("hasMore");
    expect(result.result).toHaveProperty("total");
    expect(typeof result.result.hasMore).toBe("boolean");
    expect(typeof result.result.total).toBe("number");
  });

  it("works with custom database instance", async () => {
    const result = await searchUsersAction({ search: "Alice", database: testDb });
    expect(result.result.users).toBeDefined();
    expect(result.result.users.length).toBeGreaterThan(0);
  });
});