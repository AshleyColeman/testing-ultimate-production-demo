import { describe, expect, it } from "vitest";
import { createSchemaAllocator } from "../../../tests/schemaAllocator";
import { simulateProductionOperation } from "../../../src/__tests__/shared/testHelpers";
import { getAllUsersAction } from "../actions";

const { useReadSchema, useWriteSchema } = createSchemaAllocator("users");

describe("getAllUsersAction", () => {
  it(
    "returns all users with default pagination",
    useReadSchema(async ({ db }) => {
      await simulateProductionOperation();

      const result = await getAllUsersAction({ database: db });
      expect(result).toBeDefined();
      expect(result.result).toBeDefined();
      expect(Array.isArray(result.result.users)).toBe(true);
    })
  );

  it(
    "applies pagination limit correctly",
    useWriteSchema(async ({ db, schemaName }) => {
      await simulateProductionOperation();

      await db.$executeRawUnsafe(`
        INSERT INTO "${schemaName}".users (id, name, email, role, status, created_at, updated_at)
        VALUES
          (1, 'User 1', 'user1@example.com', 'user', 'active', NOW(), NOW()),
          (2, 'User 2', 'user2@example.com', 'user', 'active', NOW(), NOW()),
          (3, 'User 3', 'user3@example.com', 'user', 'active', NOW(), NOW())
      `);

      const filters = { limit: 2, offset: 0 };
      const result = await getAllUsersAction({ ...filters, database: db });
      expect(result.result.users.length).toBeLessThanOrEqual(2);
    })
  );

  it(
    "applies pagination offset correctly",
    useWriteSchema(async ({ db, schemaName }) => {
      await simulateProductionOperation();

      await db.$executeRawUnsafe(`
        INSERT INTO "${schemaName}".users (id, name, email, role, status, created_at, updated_at)
        VALUES
          (1, 'User 1', 'user1@example.com', 'user', 'active', NOW(), NOW()),
          (2, 'User 2', 'user2@example.com', 'user', 'active', NOW(), NOW()),
          (3, 'User 3', 'user3@example.com', 'user', 'active', NOW(), NOW()),
          (4, 'User 4', 'user4@example.com', 'user', 'active', NOW(), NOW())
      `);

      const firstPage = await getAllUsersAction({ limit: 2, offset: 0, database: db });
      const secondPage = await getAllUsersAction({ limit: 2, offset: 2, database: db });
      expect(firstPage.result.users).not.toEqual(secondPage.result.users);
    })
  );

  it(
    "returns correct pagination metadata",
    useWriteSchema(async ({ db, schemaName }) => {
      await simulateProductionOperation();

      await db.$executeRawUnsafe(`
        INSERT INTO "${schemaName}".users (id, name, email, role, status, created_at, updated_at)
        VALUES (1, 'Test User', 'test@example.com', 'user', 'active', NOW(), NOW())
      `);

      const result = await getAllUsersAction({ limit: 5, database: db });
      expect(result.result).toHaveProperty("hasMore");
      expect(result.result).toHaveProperty("total");
      expect(typeof result.result.hasMore).toBe("boolean");
      expect(typeof result.result.total).toBe("number");
    })
  );

  it(
    "filters by status correctly",
    useWriteSchema(async ({ db, schemaName }) => {
      await simulateProductionOperation();

      await db.$executeRawUnsafe(`
        INSERT INTO "${schemaName}".users (id, name, email, role, status, created_at, updated_at)
        VALUES
          (1, 'Active User', 'active@example.com', 'user', 'active', NOW(), NOW()),
          (2, 'Inactive User', 'inactive@example.com', 'user', 'inactive', NOW(), NOW())
      `);

      const result = await getAllUsersAction({ status: "active", database: db });
      expect(result.result.users.every((user: any) => user.status === "active")).toBe(true);
    })
  );

  it(
    "filters by role correctly",
    useWriteSchema(async ({ db, schemaName }) => {
      await simulateProductionOperation();

      await db.$executeRawUnsafe(`
        INSERT INTO "${schemaName}".users (id, name, email, role, status, created_at, updated_at)
        VALUES
          (1, 'Admin User', 'admin@example.com', 'admin', 'active', NOW(), NOW()),
          (2, 'Regular User', 'user@example.com', 'user', 'active', NOW(), NOW())
      `);

      const result = await getAllUsersAction({ role: "user", database: db });
      expect(result.result.users.every((user: any) => user.role === "user")).toBe(true);
    })
  );

  it(
    "applies multiple filters simultaneously",
    useWriteSchema(async ({ db, schemaName }) => {
      await simulateProductionOperation();

      await db.$executeRawUnsafe(`
        INSERT INTO "${schemaName}".users (id, name, email, role, status, created_at, updated_at)
        VALUES
          (1, 'Active User', 'active@example.com', 'user', 'active', NOW(), NOW()),
          (2, 'Inactive User', 'inactive@example.com', 'user', 'inactive', NOW(), NOW()),
          (3, 'Admin User', 'admin@example.com', 'admin', 'active', NOW(), NOW())
      `);

      const result = await getAllUsersAction({ status: "active", role: "user", limit: 10, database: db });
      expect(result.result.users.every((user: any) =>
        user.status === "active" && user.role === "user"
      )).toBe(true);
    })
  );

  it(
    "validates limit is a positive number",
    useReadSchema(async () => {
      await simulateProductionOperation();

      await expect(getAllUsersAction({ limit: -1 })).rejects.toThrow();
    })
  );

  it(
    "validates offset is a non-negative number",
    useReadSchema(async () => {
      await simulateProductionOperation();

      await expect(getAllUsersAction({ offset: -1 })).rejects.toThrow();
    })
  );
});