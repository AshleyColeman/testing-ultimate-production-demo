import { DatabaseService } from "../../../utils/DatabaseService";
import type { ServerCtxType } from "../../../lib/utils/types";

/**
 * User Provider
 *
 * Pure database operations layer for user management.
 * Contains no business logic - only database interactions.
 * Follows the Inter-Train provider pattern with context-based database initialization.
 */
export function userProvider(serverCtx: ServerCtxType) {
  // Use database from context (passed during service initialization)
  // Falls back to default DatabaseService instance if not provided
  const db = serverCtx.database?.client || DatabaseService.getInstance().client;

  // Helper to get table name (schema-qualified for testing)
  const getTableName = () =>
    serverCtx.database?.schemaName
      ? `"${serverCtx.database.schemaName}".user`
      : "User";

  async function getUserById(userId: string) {
    const tableName = getTableName();
    const id = parseInt(userId, 10);
    if (isNaN(id)) {
      return null; // Invalid ID
    }
    const result = await db.$queryRawUnsafe(`
      SELECT * FROM ${tableName}
      WHERE id = ${id}
      LIMIT 1
    `);
    const user = result && result.length > 0 ? result[0] : null;
    // Convert id to string for API consistency
    if (user && typeof user.id === "number") {
      user.id = String(user.id);
    }
    return user;
  }

  async function getUserByEmail(email: string) {
    const tableName = getTableName();
    const result = await db.$queryRawUnsafe(`
      SELECT * FROM ${tableName}
      WHERE email = '${email}'
      LIMIT 1
    `);
    return result && result.length > 0 ? result[0] : null;
  }

  async function getAllUsers(limit: number = 20, offset: number = 0) {
    const tableName = getTableName();
    const result = await db.$queryRawUnsafe(`
      SELECT * FROM ${tableName}
      ORDER BY "createdAt" DESC
      LIMIT ${limit} OFFSET ${offset}
    `);
    const users = result || [];
    // Convert id to string for API consistency
    return users.map((user: any) => ({
      ...user,
      id: typeof user.id === "number" ? String(user.id) : user.id,
    }));
  }

  async function getUserCount() {
    const tableName = getTableName();
    const result = await db.$queryRawUnsafe(`
      SELECT COUNT(*) as count FROM ${tableName}
    `);
    // Convert BigInt to number
    const count = result?.[0]?.count;
    return count ? Number(count) : 0;
  }

  async function createUser(input: { email: string; name: string }) {
    const tableName = getTableName();
    const result = await db.$queryRawUnsafe(`
      INSERT INTO ${tableName} (email, name, "isActive", "createdAt", "updatedAt")
      VALUES (
        '${input.email}',
        '${input.name}',
        true,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      )
      RETURNING *
    `);
    const user = result && result.length > 0 ? result[0] : null;
    // Convert id to string for API consistency
    if (user && typeof user.id === "number") {
      user.id = String(user.id);
    }
    return user;
  }

  async function updateUser(
    userId: string,
    input: { name?: string; isActive?: boolean }
  ) {
    const tableName = getTableName();
    const id = parseInt(userId, 10);
    if (isNaN(id)) {
      return null; // Invalid ID
    }
    const updates: string[] = [];
    if (input.name !== undefined) updates.push(`name = '${input.name}'`);
    if (input.isActive !== undefined)
      updates.push(`"isActive" = ${input.isActive}`);
    updates.push(`"updatedAt" = CURRENT_TIMESTAMP`);

    const result = await db.$queryRawUnsafe(`
      UPDATE ${tableName}
      SET ${updates.join(", ")}
      WHERE id = ${id}
      RETURNING *
    `);
    const user = result && result.length > 0 ? result[0] : null;
    // Convert id to string for API consistency
    if (user && typeof user.id === "number") {
      user.id = String(user.id);
    }
    return user;
  }
  async function deleteUser(userId: string) {
    const tableName = getTableName();
    const id = parseInt(userId, 10);
    if (isNaN(id)) {
      return null; // Invalid ID
    }
    const result = await db.$queryRawUnsafe(`
      DELETE FROM ${tableName}
      WHERE id = ${id}
      RETURNING *
    `);
    const user = result && result.length > 0 ? result[0] : null;
    // Convert id to string for API consistency
    if (user && typeof user.id === "number") {
      user.id = String(user.id);
    }
    return user;
  }

  async function softDeleteUser(userId: string) {
    const tableName = getTableName();
    const id = parseInt(userId, 10);
    if (isNaN(id)) {
      return null; // Invalid ID
    }
    const result = await db.$queryRawUnsafe(`
      UPDATE ${tableName}
      SET "isActive" = false, "updatedAt" = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `);
    const user = result && result.length > 0 ? result[0] : null;
    // Convert id to string for API consistency
    if (user && typeof user.id === "number") {
      user.id = String(user.id);
    }
    return user;
  }

  async function searchUsers(
    searchTerm: string,
    limit: number = 20,
    offset: number = 0
  ) {
    const tableName = getTableName();
    const result = await db.$queryRawUnsafe(`
      SELECT * FROM ${tableName}
      WHERE
        LOWER(email) LIKE LOWER('%${searchTerm}%') OR
        LOWER(name) LIKE LOWER('%${searchTerm}%')
      ORDER BY "createdAt" DESC
      LIMIT ${limit} OFFSET ${offset}
    `);
    const users = result || [];
    // Convert id to string for API consistency
    return users.map((user: any) => ({
      ...user,
      id: typeof user.id === "number" ? String(user.id) : user.id,
    }));
  }

  return {
    getUserById,
    getUserByEmail,
    getAllUsers,
    getUserCount,
    createUser,
    updateUser,
    deleteUser,
    softDeleteUser,
    searchUsers,
  };
}
