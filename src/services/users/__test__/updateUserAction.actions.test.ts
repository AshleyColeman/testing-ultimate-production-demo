import { describe, expect, it } from "vitest";
import { createSchemaAllocator } from "../../../tests/schemaAllocator";
import { simulateProductionOperation } from "../../../src/__tests__/shared/testHelpers";
import { updateUserAction, createUserAction } from "../actions";

const { useReadSchema, useWriteSchema } = createSchemaAllocator("users");

describe("updateUserAction", () => {
  it(
    "updates user successfully with valid input",
    useWriteSchema(async ({ db }) => {
      await simulateProductionOperation();

      const user = await createUserAction({
        name: "Test User",
        email: "update.test@example.com",
        role: "user",
        status: "active",
        database: db
      });
      const createdUserId = user.result.id;

      const updateData = {
        id: createdUserId,
        name: "Updated Name",
        email: "updated@example.com"
      };
      const result = await updateUserAction({ ...updateData, database: db });
      expect(result.success).toBe(true);
      expect(result.result.name).toBe(updateData.name);
      expect(result.result.email).toBe(updateData.email);
    })
  );

  it(
    "fails when user ID does not exist",
    useWriteSchema(async ({ db }) => {
      await simulateProductionOperation();

      const updateData = {
        id: 99999,
        name: "Non-existent User"
      };
      const result = await updateUserAction({ ...updateData, database: db });
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
    })
  );

  it(
    "validates user ID is required",
    useReadSchema(async () => {
      await simulateProductionOperation();

      const updateData = {
        name: "No ID User"
      };
      await expect(updateUserAction(updateData)).rejects.toThrow();
    })
  );

  it(
    "validates user ID is a positive number",
    useReadSchema(async () => {
      await simulateProductionOperation();

      const updateData = {
        id: -1,
        name: "Invalid ID User"
      };
      await expect(updateUserAction(updateData)).rejects.toThrow();
    })
  );

  it(
    "validates email format when provided",
    useReadSchema(async () => {
      await simulateProductionOperation();

      const updateData = {
        id: 1,
        email: "invalid-email-format"
      };
      const result = await updateUserAction(updateData);
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
    })
  );

  it(
    "validates role is a valid enum value when provided",
    useReadSchema(async () => {
      await simulateProductionOperation();

      const updateData = {
        id: 1,
        role: "invalid-role"
      };
      const result = await updateUserAction(updateData);
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
    })
  );

  it(
    "updates user with partial data",
    useWriteSchema(async ({ db }) => {
      await simulateProductionOperation();

      const user = await createUserAction({
        name: "Test User",
        email: "partial.test@example.com",
        role: "user",
        status: "active",
        database: db
      });
      const createdUserId = user.result.id;

      const updateData = {
        id: createdUserId,
        name: "Partial Update"
      };
      const result = await updateUserAction({ ...updateData, database: db });
      expect(result.success).toBe(true);
      expect(result.result.name).toBe(updateData.name);
      expect(result.result.email).toBeDefined();
    })
  );

  it(
    "returns appropriate success message",
    useWriteSchema(async ({ db }) => {
      await simulateProductionOperation();

      const user = await createUserAction({
        name: "Test User",
        email: "message.test@example.com",
        role: "user",
        status: "active",
        database: db
      });
      const createdUserId = user.result.id;

      const updateData = {
        id: createdUserId,
        name: "Message Test"
      };
      const result = await updateUserAction({ ...updateData, database: db });
      expect(result.message).toBe("Successfully updated user");
    })
  );

  it(
    "handles database errors gracefully",
    useWriteSchema(async () => {
      await simulateProductionOperation();

      const invalidDb = { $queryRaw: () => Promise.reject(new Error("Connection failed")) };
      const updateData = {
        id: 1,
        name: "Error Test"
      };
      await expect(updateUserAction({ ...updateData, database: invalidDb })).rejects.toThrow();
    })
  );
});