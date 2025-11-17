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

  async function getUserById(userId: string) {
    const result = await db.$queryRaw`
      SELECT * FROM User
      WHERE id = ${parseInt(userId, 10)}
      LIMIT 1
    `;
    return result && result.length > 0 ? result[0] : null;
  }

  async function getUserByEmail(email: string) {
    const result = await db.$queryRaw`
      SELECT * FROM User
      WHERE email = ${email}
      LIMIT 1
    `;
    return result && result.length > 0 ? result[0] : null;
  }

  async function getAllUsers(limit: number = 20, offset: number = 0) {
    const result = await db.$queryRaw`
      SELECT * FROM User
      ORDER BY "createdAt" DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
    return result || [];
  }

  async function getUserCount() {
    const result = await db.$queryRaw`
      SELECT COUNT(*) as count FROM User
    `;
    // Convert BigInt to number
    const count = result?.[0]?.count;
    return count ? Number(count) : 0;
  }

  async function createUser(input: { email: string; name: string }) {
    const result = await db.$queryRaw`
      INSERT INTO User (email, name, "isActive", "createdAt", "updatedAt")
      VALUES (
        ${input.email},
        ${input.name},
        true,
        datetime('now'),
        datetime('now')
      )
      RETURNING *
    `;
    return result && result.length > 0 ? result[0] : null;
  }

  async function updateUser(
    userId: string,
    input: { name?: string; isActive?: boolean }
  ) {
    const updates: string[] = [];
    const values: any[] = [];

    if (input.name !== undefined) {
      updates.push(`name = $${updates.length + 1}`);
      values.push(input.name);
    }

    if (input.isActive !== undefined) {
      updates.push(`"isActive" = $${updates.length + 1}`);
      values.push(input.isActive);
    }

    if (updates.length === 0) {
      return getUserById(userId);
    }

    updates.push(`"updatedAt" = datetime('now')`);

    const updateClause = updates.join(", ");
    const result = await db.$queryRawUnsafe(
      `UPDATE User SET ${updateClause} WHERE id = $${
        values.length + 1
      } RETURNING *`,
      ...values,
      parseInt(userId, 10)
    );

    return result && result.length > 0 ? result[0] : null;
  }

  async function deleteUser(userId: string) {
    const result = await db.$queryRaw`
      DELETE FROM User WHERE id = ${parseInt(userId, 10)}
    `;
    return result;
  }

  async function softDeleteUser(userId: string) {
    const result = await db.$queryRaw`
      UPDATE User
      SET "isActive" = false, "updatedAt" = datetime('now')
      WHERE id = ${parseInt(userId, 10)}
      RETURNING *
    `;
    return result && result.length > 0 ? result[0] : null;
  }

  async function searchUsers(
    searchTerm: string,
    limit: number = 20,
    offset: number = 0
  ) {
    const result = await db.$queryRaw`
      SELECT * FROM User
      WHERE
        LOWER(email) LIKE LOWER(${"%" + searchTerm + "%"}) OR
        LOWER(name) LIKE LOWER(${"%" + searchTerm + "%"})
      ORDER BY "createdAt" DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
    return result || [];
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
