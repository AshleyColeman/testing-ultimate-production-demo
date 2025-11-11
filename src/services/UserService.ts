import { databaseService } from "@/utils/DatabaseService";
import { Logger } from "@/utils/Logger";

/**
 * UserService
 *
 * Proof of concept service for managing users.
 * Demonstrates basic CRUD operations using Prisma and the DatabaseService.
 *
 * This service is used to test the integration test agent's ability to generate
 * comprehensive integration tests for real database operations.
 *
 * Operations:
 * - createUser: Create a new user with email and name
 * - getUserById: Retrieve user by ID
 * - getUserByEmail: Retrieve user by email address
 * - getAllUsers: Get all users
 * - updateUser: Update user information
 * - deleteUser: Delete user by ID
 */

export interface User {
  id: string;
  email: string;
  name: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserInput {
  email: string;
  name: string;
}

export interface UpdateUserInput {
  name?: string;
  isActive?: boolean;
}

class UserService {
  private logger: Logger;

  constructor() {
    this.logger = new Logger("UserService");
  }

  /**
   * Create a new user
   *
   * @param input - User creation data (email, name)
   * @returns Created user
   * @throws Error if email already exists or database operation fails
   */
  async createUser(input: CreateUserInput): Promise<User> {
    const startTime = Date.now();

    try {
      // Validate input
      if (!input.email || !input.name) {
        throw new Error("Email and name are required");
      }

      if (!this._isValidEmail(input.email)) {
        throw new Error("Invalid email format");
      }

      // Check if user already exists
      const existingUser = await this.getUserByEmail(input.email);
      if (existingUser) {
        throw new Error(`User with email ${input.email} already exists`);
      }

      // Insert into database
      const result = await databaseService.client.$queryRaw<User[]>`
        INSERT INTO ${this._table()}
        (id, email, name, "isActive", "createdAt", "updatedAt")
        VALUES (
          ${this._generateId()},
          ${input.email},
          ${input.name},
          true,
          NOW(),
          NOW()
        )
        RETURNING *
      `;

      if (!result || result.length === 0) {
        throw new Error("Failed to create user");
      }

      const duration = Date.now() - startTime;
      this.logger.info(`✅ User created: ${input.email} (${duration}ms)`);

      return result[0];
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to create user: ${message}`);
      throw error;
    }
  }

  /**
   * Get user by ID
   *
   * @param userId - User ID
   * @returns User object if found, null otherwise
   * @throws Error if database operation fails
   */
  async getUserById(userId: string): Promise<User | null> {
    const startTime = Date.now();

    try {
      if (!userId) {
        throw new Error("User ID is required");
      }

      const result = await databaseService.client.$queryRaw<User[]>`
        SELECT * FROM ${this._table()}
        WHERE id = ${userId}
        LIMIT 1
      `;

      const duration = Date.now() - startTime;

      if (result && result.length > 0) {
        this.logger.debug(`✅ Retrieved user ${userId} (${duration}ms)`);
        return result[0];
      }

      this.logger.debug(`User ${userId} not found (${duration}ms)`);
      return null;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to get user by ID: ${message}`);
      throw error;
    }
  }

  /**
   * Get user by email
   *
   * @param email - User email
   * @returns User object if found, null otherwise
   * @throws Error if database operation fails
   */
  async getUserByEmail(email: string): Promise<User | null> {
    const startTime = Date.now();

    try {
      if (!email) {
        throw new Error("Email is required");
      }

      const result = await databaseService.client.$queryRaw<User[]>`
        SELECT * FROM ${this._table()}
        WHERE email = ${email}
        LIMIT 1
      `;

      const duration = Date.now() - startTime;

      if (result && result.length > 0) {
        this.logger.debug(
          `✅ Retrieved user by email ${email} (${duration}ms)`
        );
        return result[0];
      }

      this.logger.debug(`User with email ${email} not found (${duration}ms)`);
      return null;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to get user by email: ${message}`);
      throw error;
    }
  }

  /**
   * Get all users
   *
   * @returns Array of users
   * @throws Error if database operation fails
   */
  async getAllUsers(): Promise<User[]> {
    const startTime = Date.now();

    try {
      const result = await databaseService.client.$queryRaw<User[]>`
        SELECT * FROM ${this._table()}
        ORDER BY "createdAt" DESC
      `;

      const duration = Date.now() - startTime;
      this.logger.debug(
        `✅ Retrieved ${result?.length || 0} users (${duration}ms)`
      );

      return result || [];
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to get all users: ${message}`);
      throw error;
    }
  }

  /**
   * Update user
   *
   * @param userId - User ID
   * @param input - Update data (name, isActive)
   * @returns Updated user
   * @throws Error if user not found or database operation fails
   */
  async updateUser(userId: string, input: UpdateUserInput): Promise<User> {
    const startTime = Date.now();

    try {
      if (!userId) {
        throw new Error("User ID is required");
      }

      // Verify user exists
      const existingUser = await this.getUserById(userId);
      if (!existingUser) {
        throw new Error(`User with ID ${userId} not found`);
      }

      // Build update query dynamically
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
        // No updates, return existing user
        return existingUser;
      }

      updates.push(`"updatedAt" = NOW()`);

      const updateClause = updates.join(", ");
      const result = await databaseService.client.$queryRawUnsafe<User[]>(
        `UPDATE ${this._table()} SET ${updateClause} WHERE id = $${
          values.length + 1
        } RETURNING *`,
        ...values,
        userId
      );

      if (!result || result.length === 0) {
        throw new Error("Failed to update user");
      }

      const duration = Date.now() - startTime;
      this.logger.info(`✅ User updated: ${userId} (${duration}ms)`);

      return result[0];
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to update user: ${message}`);
      throw error;
    }
  }

  /**
   * Delete user
   *
   * @param userId - User ID
   * @returns Number of deleted records (0 or 1)
   * @throws Error if database operation fails
   */
  async deleteUser(userId: string): Promise<number> {
    const startTime = Date.now();

    try {
      if (!userId) {
        throw new Error("User ID is required");
      }

      // Verify user exists
      const user = await this.getUserById(userId);
      if (!user) {
        this.logger.warn(`User ${userId} not found for deletion`);
        return 0;
      }

      // Delete user
      const result = await databaseService.client.$queryRaw`
        DELETE FROM ${this._table()}
        WHERE id = ${userId}
      `;

      const duration = Date.now() - startTime;
      this.logger.info(`✅ User deleted: ${userId} (${duration}ms)`);

      return 1;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to delete user: ${message}`);
      throw error;
    }
  }

  /**
   * Get user count
   *
   * @returns Total number of users
   * @throws Error if database operation fails
   */
  async getUserCount(): Promise<number> {
    try {
      const result = await databaseService.client.$queryRaw<
        Array<{ count: number }>
      >`
        SELECT COUNT(*) as count FROM ${this._table()}
      `;

      if (result && result.length > 0) {
        return result[0].count;
      }

      return 0;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to get user count: ${message}`);
      throw error;
    }
  }

  /**
   * Delete all users (for testing/cleanup)
   *
   * @returns Number of deleted users
   * @throws Error if database operation fails
   */
  async deleteAllUsers(): Promise<number> {
    try {
      const result = await databaseService.client.$queryRaw`
        DELETE FROM ${this._table()}
      `;

      this.logger.info(`✅ Deleted all users`);
      return 0; // PostgreSQL doesn't return row count in $queryRaw
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to delete all users: ${message}`);
      throw error;
    }
  }

  // ============ PRIVATE HELPERS ============

  /**
   * Get table identifier (for raw SQL queries)
   */
  private _table() {
    return this._tableName;
  }

  /**
   * Get table name (string version for parameterized queries)
   */
  private get _tableName(): string {
    return "users";
  }

  /**
   * Generate a unique user ID
   */
  private _generateId(): string {
    return `usr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Validate email format
   */
  private _isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

// Export singleton instance
export const userService = new UserService();
export { UserService };
