import { DatabaseService } from '../../../utils/DatabaseService';
import type { ServerCtxType } from '../../../lib/utils/types';

/**
 * User Provider
 *
 * Pure database operations layer for user management.
 * Contains no business logic - only database interactions.
 * Follows the Inter-Train provider pattern.
 */
export function userProvider(serverCtx: ServerCtxType) {
  // Use passed database from context or fall back to default instance
  const db = serverCtx.database?.client || DatabaseService.getInstance().client;

  async function getUserById(userId: string) {
    const result = await db.$queryRaw`
      SELECT * FROM users
      WHERE id = ${userId}
      LIMIT 1
    `;
    return (result && result.length > 0) ? result[0] : null;
  }

  async function getUserByEmail(email: string) {
    const result = await db.$queryRaw`
      SELECT * FROM users
      WHERE email = ${email}
      LIMIT 1
    `;
    return (result && result.length > 0) ? result[0] : null;
  }

  async function getAllUsers(limit: number = 20, offset: number = 0) {
    const result = await db.$queryRaw`
      SELECT * FROM users
      ORDER BY "createdAt" DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
    return result || [];
  }

  async function getUserCount() {
    const result = await db.$queryRaw`
      SELECT COUNT(*) as count FROM users
    `;
    return result?.[0]?.count || 0;
  }

  async function createUser(input: { id: string; email: string; name: string }) {
    const result = await db.$queryRaw`
      INSERT INTO users (id, email, name, "isActive", "createdAt", "updatedAt")
      VALUES (
        ${input.id},
        ${input.email},
        ${input.name},
        true,
        NOW(),
        NOW()
      )
      RETURNING *
    `;
    return (result && result.length > 0) ? result[0] : null;
  }

  async function updateUser(userId: string, input: { name?: string; isActive?: boolean }) {
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

    updates.push(`"updatedAt" = NOW()`);

    const updateClause = updates.join(', ');
    const result = await db.$queryRawUnsafe(
      `UPDATE users SET ${updateClause} WHERE id = $${values.length + 1} RETURNING *`,
      ...values,
      userId
    );

    return (result && result.length > 0) ? result[0] : null;
  }

  async function deleteUser(userId: string) {
    const result = await db.$queryRaw`
      DELETE FROM users WHERE id = ${userId}
    `;
    return result;
  }

  async function softDeleteUser(userId: string) {
    const result = await db.$queryRaw`
      UPDATE users
      SET "isActive" = false, "updatedAt" = NOW()
      WHERE id = ${userId}
      RETURNING *
    `;
    return (result && result.length > 0) ? result[0] : null;
  }

  async function searchUsers(searchTerm: string, limit: number = 20, offset: number = 0) {
    const result = await db.$queryRaw`
      SELECT * FROM users
      WHERE
        email ILIKE ${'%' + searchTerm + '%'} OR
        name ILIKE ${'%' + searchTerm + '%'}
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