import { describe, expect, it } from "vitest";
import { createSchemaAllocator } from "../../../tests/schemaAllocator";
import { simulateProductionOperation } from "../../../src/__tests__/shared/testHelpers";
import { createUserAction } from "../actions";

const { useReadSchema, useWriteSchema } = createSchemaAllocator("users");

describe("createUserAction", () => {
  it(
    "creates a user successfully with valid input",
    useWriteSchema(async ({ db }) => {
      await simulateProductionOperation();

      const userData = {
        name: "John Doe",
        email: "john.doe@example.com",
        role: "user",
        status: "active"
      };
      const result = await createUserAction({ ...userData, database: db });
      expect(result.success).toBe(true);
      expect(result.result).toBeDefined();
      expect(result.result.email).toBe(userData.email);
      expect(result.result.name).toBe(userData.name);
    })
  );

  it(
    "fails when email already exists",
    useWriteSchema(async ({ db, schemaName }) => {
      await simulateProductionOperation();

      await db.$executeRawUnsafe(`
        INSERT INTO "${schemaName}".users (id, name, email, role, status, created_at, updated_at)
        VALUES (1, 'Jane Doe', 'jane@example.com', 'user', 'active', NOW(), NOW())
      `);

      const userData = {
        name: "Jane Doe",
        email: "jane@example.com",
        role: "user",
        status: "active"
      };
      const duplicateResult = await createUserAction({ ...userData, database: db });
      expect(duplicateResult.success).toBe(false);
      expect(duplicateResult.errors).toBeDefined();
    })
  );

  it(
    "validates email is required",
    useReadSchema(async () => {
      await simulateProductionOperation();

      const userData = {
        name: "John Doe",
        role: "user"
      };
      const result = await createUserAction(userData);
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
    })
  );

  it(
    "validates email format",
    useReadSchema(async () => {
      await simulateProductionOperation();

      const userData = {
        name: "John Doe",
        email: "invalid-email",
        role: "user",
        status: "active"
      };
      const result = await createUserAction(userData);
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
    })
  );

  it(
    "validates name is required",
    useReadSchema(async () => {
      await simulateProductionOperation();

      const userData = {
        email: "test@example.com",
        role: "user"
      };
      const result = await createUserAction(userData);
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
    })
  );

  it(
    "validates role is a valid enum value",
    useReadSchema(async () => {
      await simulateProductionOperation();

      const userData = {
        name: "John Doe",
        email: "john@example.com",
        role: "invalid-role"
      };
      const result = await createUserAction(userData);
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
    })
  );

  it(
    "creates user with default status when not provided",
    useWriteSchema(async ({ db }) => {
      await simulateProductionOperation();

      const userData = {
        name: "Test User",
        email: "testuser@example.com",
        role: "user"
      };
      const result = await createUserAction({ ...userData, database: db });
      expect(result.success).toBe(true);
      expect(result.result.status).toBeDefined();
    })
  );

  it(
    "returns appropriate success message",
    useWriteSchema(async ({ db }) => {
      await simulateProductionOperation();

      const userData = {
        name: "Success Test",
        email: "success@example.com",
        role: "user"
      };
      const result = await createUserAction({ ...userData, database: db });
      expect(result.message).toBe("Successfully created user");
    })
  );

  it(
    "handles database errors gracefully",
    useWriteSchema(async () => {
      await simulateProductionOperation();

      const invalidDb = { $queryRaw: () => Promise.reject(new Error("Connection failed")) };
      const userData = {
        name: "Error Test",
        email: "error@example.com",
        role: "user"
      };
      await expect(createUserAction({ ...userData, database: invalidDb })).rejects.toThrow();
    })
  );
});