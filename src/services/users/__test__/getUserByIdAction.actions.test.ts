import { describe, expect, it } from "vitest";
import { createSchemaAllocator } from "../../../tests/schemaAllocator";
import { simulateProductionOperation } from "../../../src/__tests__/shared/testHelpers";
import { getUserByIdAction, createUserAction } from "../actions";

const { useReadSchema, useWriteSchema } = createSchemaAllocator("users");

describe("getUserByIdAction", () => {
  it(
    "returns a user when given a valid user ID",
    useWriteSchema(async ({ db, schema, schemaName }) => {
      await simulateProductionOperation();

      await db.$executeRawUnsafe(`
        INSERT INTO "${schemaName}".users (id, name, email, role, status, created_at, updated_at)
        VALUES (1, 'Test User', 'test@example.com', 'user', 'active', NOW(), NOW())
      `);

      const result = await getUserByIdAction({ userId: 1, database: db });
      expect(result).toBeDefined();
      expect(result.result).toBeDefined();
      expect(result.result.id).toBe(1);
    })
  );

  it(
    "returns null when user ID does not exist",
    useReadSchema(async ({ db }) => {
      await simulateProductionOperation();

      const result = await getUserByIdAction({ userId: 99999, database: db });
      expect(result.result).toBeNull();
    })
  );

  it(
    "validates user ID is a positive integer",
    useReadSchema(async () => {
      await simulateProductionOperation();

      await expect(getUserByIdAction({ userId: -1 })).rejects.toThrow();
    })
  );

  it(
    "validates user ID is required",
    useReadSchema(async () => {
      await simulateProductionOperation();

      await expect(getUserByIdAction({})).rejects.toThrow();
    })
  );

  it(
    "validates user ID is a number",
    useReadSchema(async () => {
      await simulateProductionOperation();

      await expect(getUserByIdAction({ userId: "invalid" })).rejects.toThrow();
    })
  );

  it(
    "returns user with expected structure",
    useWriteSchema(async ({ db, schemaName }) => {
      await simulateProductionOperation();

      await db.$executeRawUnsafe(`
        INSERT INTO "${schemaName}".users (id, name, email, role, status, created_at, updated_at)
        VALUES (1, 'Test User', 'test@example.com', 'user', 'active', NOW(), NOW())
      `);

      const result = await getUserByIdAction({ userId: 1, database: db });
      expect(result.result).toHaveProperty("id");
      expect(result.result).toHaveProperty("email");
      expect(result.result).toHaveProperty("name");
    })
  );

  it(
    "returns consistent results for the same user ID",
    useWriteSchema(async ({ db, schemaName }) => {
      await simulateProductionOperation();

      await db.$executeRawUnsafe(`
        INSERT INTO "${schemaName}".users (id, name, email, role, status, created_at, updated_at)
        VALUES (1, 'Test User', 'test@example.com', 'user', 'active', NOW(), NOW())
      `);

      const result1 = await getUserByIdAction({ userId: 1, database: db });
      const result2 = await getUserByIdAction({ userId: 1, database: db });
      expect(result1.result).toEqual(result2.result);
    })
  );

  it(
    "handles zero user ID validation",
    useReadSchema(async () => {
      await simulateProductionOperation();

      await expect(getUserByIdAction({ userId: 0 })).rejects.toThrow();
    })
  );
});