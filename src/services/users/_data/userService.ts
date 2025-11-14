import { Logger } from '../../../utils/Logger';
import { userProvider } from './userProvider';
import { baseEntityMapper } from '../../../lib/utils/mappers';
import type { ServerCtxType, PaginationParams, FilterParams, ServiceResponse, PaginatedResponse } from '../../../lib/utils/types';

// Define our own User interface that matches what our mapper produces
export interface User {
  id: string;
  email: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserInput {
  email: string;
  name: string;
}

export interface UpdateUserInput {
  name?: string;
  isActive?: boolean;
}

/**
 * User Service
 *
 * Business logic layer that orchestrates the user provider.
 * Handles data transformation, validation, and business rules.
 * Follows the Inter-Train service pattern.
 */
export function userService(serverCtx: ServerCtxType) {
  // Pass the entire serverCtx (including database) to the provider
  const _provider = userProvider(serverCtx);
  const logger = new Logger('UserService');

  async function getUserById(userId: string): Promise<User | null> {
    const startTime = Date.now();

    try {
      if (!userId) {
        throw new Error('User ID is required');
      }

      const rawResult = await _provider.getUserById(userId);

      if (!rawResult) {
        logger.debug(`User ${userId} not found (${Date.now() - startTime}ms)`);
        return null;
      }

      const result = baseEntityMapper(rawResult, { formatDate: true }) as User;

      logger.debug(`Retrieved user ${userId} (${Date.now() - startTime}ms)`);
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error(`Failed to get user by ID: ${message}`);
      throw error;
    }
  }

  async function getUserByEmail(email: string): Promise<User | null> {
    const startTime = Date.now();

    try {
      if (!email) {
        throw new Error('Email is required');
      }

      const rawResult = await _provider.getUserByEmail(email);

      if (!rawResult) {
        logger.debug(`User with email ${email} not found (${Date.now() - startTime}ms)`);
        return null;
      }

      const result = baseEntityMapper(rawResult, { formatDate: true }) as User;

      logger.debug(`Retrieved user by email ${email} (${Date.now() - startTime}ms)`);
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error(`Failed to get user by email: ${message}`);
      throw error;
    }
  }

  async function getAllUsers(pagination?: PaginationParams): Promise<PaginatedResponse<User>> {
    const startTime = Date.now();

    try {
      const limit = pagination?.limit || 20;
      const offset = ((pagination?.page || 1) - 1) * limit;

      const [rawUsers, totalCount] = await Promise.all([
        _provider.getAllUsers(limit, offset),
        _provider.getUserCount(),
      ]);

      const users = rawUsers.map((user: any) =>
        baseEntityMapper(user, { formatDate: true }) as User
      );

      const totalPages = Math.ceil(totalCount / limit);
      const currentPage = pagination?.page || 1;

      const result: PaginatedResponse<User> = {
        data: users,
        success: true,
        pagination: {
          page: currentPage,
          limit,
          total: totalCount,
          totalPages,
          hasNext: currentPage < totalPages,
          hasPrev: currentPage > 1,
        },
      };

      logger.debug(`Retrieved ${users.length} users (${Date.now() - startTime}ms)`);
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error(`Failed to get all users: ${message}`);
      throw error;
    }
  }

  async function createUser(input: CreateUserInput): Promise<ServiceResponse<User>> {
    const startTime = Date.now();

    try {
      // Validation
      if (!input.email || !input.name) {
        return {
          data: null,
          success: false,
          errors: ['Email and name are required'],
        };
      }

      if (!_isValidEmail(input.email)) {
        return {
          data: null,
          success: false,
          errors: ['Invalid email format'],
        };
      }

      // Check if user already exists
      const existingUser = await getUserByEmail(input.email);
      if (existingUser) {
        return {
          data: null,
          success: false,
          errors: [`User with email ${input.email} already exists`],
        };
      }

      // Create user
      const userId = _generateId();
      const rawResult = await _provider.createUser({ id: userId, ...input });

      if (!rawResult) {
        return {
          data: null,
          success: false,
          errors: ['Failed to create user'],
        };
      }

      const result = baseEntityMapper(rawResult, { formatDate: true }) as User;

      logger.info(`User created: ${input.email} (${Date.now() - startTime}ms)`);

      return {
        data: result,
        success: true,
        message: 'User created successfully',
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error(`Failed to create user: ${message}`);
      return {
        data: null,
        success: false,
        errors: [message],
      };
    }
  }

  async function updateUser(userId: string, input: UpdateUserInput): Promise<ServiceResponse<User>> {
    const startTime = Date.now();

    try {
      if (!userId) {
        return {
          data: null,
          success: false,
          errors: ['User ID is required'],
        };
      }

      // Verify user exists
      const existingUser = await getUserById(userId);
      if (!existingUser) {
        return {
          data: null,
          success: false,
          errors: [`User with ID ${userId} not found`],
        };
      }

      // Update user
      const rawResult = await _provider.updateUser(userId, input);

      if (!rawResult) {
        return {
          data: null,
          success: false,
          errors: ['Failed to update user'],
        };
      }

      const result = baseEntityMapper(rawResult, { formatDate: true }) as User;

      logger.info(`User updated: ${userId} (${Date.now() - startTime}ms)`);

      return {
        data: result,
        success: true,
        message: 'User updated successfully',
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error(`Failed to update user: ${message}`);
      return {
        data: null,
        success: false,
        errors: [message],
      };
    }
  }

  async function deleteUser(userId: string): Promise<ServiceResponse<number>> {
    const startTime = Date.now();

    try {
      if (!userId) {
        return {
          data: 0,
          success: false,
          errors: ['User ID is required'],
        };
      }

      // Verify user exists
      const user = await getUserById(userId);
      if (!user) {
        logger.warn(`User ${userId} not found for deletion`);
        return {
          data: 0,
          success: true,
          message: 'User not found',
        };
      }

      await _provider.deleteUser(userId);

      logger.info(`User deleted: ${userId} (${Date.now() - startTime}ms)`);

      return {
        data: 1,
        success: true,
        message: 'User deleted successfully',
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error(`Failed to delete user: ${message}`);
      return {
        data: 0,
        success: false,
        errors: [message],
      };
    }
  }

  async function searchUsers(filters: FilterParams & PaginationParams): Promise<PaginatedResponse<User>> {
    const startTime = Date.now();

    try {
      const limit = filters.limit || 20;
      const offset = ((filters.page || 1) - 1) * limit;
      const searchTerm = filters.search || '';

      if (!searchTerm) {
        // If no search term, return all users
        return getAllUsers(filters);
      }

      const rawUsers = await _provider.searchUsers(searchTerm, limit, offset);

      const users = rawUsers.map((user: any) =>
        baseEntityMapper(user, { formatDate: true }) as User
      );

      // Note: For simplicity, we're not getting total count for search
      // In a real implementation, you'd want a searchUsersCount method

      const result: PaginatedResponse<User> = {
        data: users,
        success: true,
        pagination: {
          page: filters.page || 1,
          limit,
          total: users.length, // This is approximate, should get actual count
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        },
      };

      logger.debug(`Search found ${users.length} users for term "${searchTerm}" (${Date.now() - startTime}ms)`);
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error(`Failed to search users: ${message}`);
      throw error;
    }
  }

  // Private helpers
  function _generateId(): string {
    return `usr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  function _isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  return {
    getUserById,
    getUserByEmail,
    getAllUsers,
    createUser,
    updateUser,
    deleteUser,
    searchUsers,
  };
}