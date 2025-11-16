'use server';

import { z } from 'zod';

import {
  CreateUserSchema,
  UpdateUserSchema,
  UserIdSchema,
  UserFiltersSchema,
} from './_data/userSchema';
import { userService } from './_data/userService';
import type { ServerCtxType } from '../../lib/utils/types';

/**
 * Admin Procedure
 *
 * Wrapper that creates a schema-validated action with proper context setup.
 * Follows the production pattern for safe server actions.
 */
const adminProcedure = {
  schema: <T extends z.ZodSchema>(schema: T) => ({
    action: async (
      handler: (args: {
        ctx: { svc: ReturnType<typeof userService> };
        parsedInput: z.infer<T>;
      }) => Promise<any>
    ) => {
      return async (input: z.infer<T>) => {
        // Validate input
        const parsedInput = schema.parse(input);

        // Extract optional database from input (for testing)
        const database = (input as any)?.database || undefined;

        // Build server context
        const serverCtx: ServerCtxType = {
          accountUserId: 1,
          userRole: 'admin',
          database,
        };

        // Initialize service with context
        const svc = userService(serverCtx);

        // Execute handler with context
        return handler({
          ctx: { svc },
          parsedInput,
        });
      };
    },
  }),
};


/**
 * Get a user by ID
 */
export const getUserByIdAction = adminProcedure
  .schema(UserIdSchema)
  .action(async ({ ctx, parsedInput: userId }) => {
    const result = await ctx.svc.getUserById(userId);
    return { result };
  });

/**
 * Get all users with pagination and filtering
 */
export const getAllUsersAction = adminProcedure
  .schema(UserFiltersSchema.omit({ search: true }))
  .action(async ({ ctx, parsedInput: filters }) => {
    const result = await ctx.svc.getAllUsers(filters);
    return { result };
  });

/**
 * Create a new user
 */
export const createUserAction = adminProcedure
  .schema(CreateUserSchema)
  .action(async ({ ctx, parsedInput }) => {
    const result = await ctx.svc.createUser(parsedInput);
    return {
      result,
      message: 'Successfully created user',
    };
  });

/**
 * Update an existing user
 */
export const updateUserAction = adminProcedure
  .schema(UpdateUserSchema.merge(z.object({ id: UserIdSchema })))
  .action(async ({ ctx, parsedInput }) => {
    const { id, ...updateData } = parsedInput;
    const result = await ctx.svc.updateUser(id, updateData);
    return {
      result,
      message: 'Successfully updated user',
    };
  });

/**
 * Delete a user
 */
export const deleteUserAction = adminProcedure
  .schema(UserIdSchema)
  .action(async ({ ctx, parsedInput: userId }) => {
    const result = await ctx.svc.deleteUser(userId);
    return {
      result,
      message: 'Successfully deleted user',
    };
  });

/**
 * Search users
 */
export const searchUsersAction = adminProcedure
  .schema(UserFiltersSchema)
  .action(async ({ ctx, parsedInput: filters }) => {
    const result = await ctx.svc.searchUsers(filters);
    return { result };
  });
