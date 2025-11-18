"use server";

import { z } from "zod";

import {
  CreateUserSchema,
  UpdateUserSchema,
  UserIdSchema,
  UserIdActionSchema,
  UserFiltersSchema,
} from "./_data/userSchema";
import { userService } from "./_data/userService";
import type { ServerCtxType } from "../../lib/utils/types";

/**
 * Admin Procedure
 *
 * Wrapper that creates a schema-validated action with proper context setup.
 * Follows the production pattern for safe server actions.
 */
const adminProcedure = {
  schema: <T extends z.ZodSchema>(schema: T) => ({
    action: (
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
          userRole: "admin",
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
  .schema(UserIdActionSchema)
  .action(async ({ ctx, parsedInput }) => {
    const result = await ctx.svc.getUserById(parsedInput.userId);
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
    const serviceResponse = await ctx.svc.createUser(parsedInput);
    return {
      result: serviceResponse.data,
      message: serviceResponse.message || "Successfully created user",
      success: serviceResponse.success,
      errors: serviceResponse.errors,
    };
  });

/**
 * Update an existing user
 */
export const updateUserAction = adminProcedure
  .schema(UpdateUserSchema.merge(z.object({ id: UserIdSchema })))
  .action(async ({ ctx, parsedInput }) => {
    const { id, ...updateData } = parsedInput;
    const serviceResponse = await ctx.svc.updateUser(id, updateData);
    return {
      result: serviceResponse.data,
      message: serviceResponse.message || "Successfully updated user",
      success: serviceResponse.success,
      errors: serviceResponse.errors,
    };
  });

/**
 * Delete a user
 */
export const deleteUserAction = adminProcedure
  .schema(UserIdActionSchema)
  .action(async ({ ctx, parsedInput }) => {
    const result = await ctx.svc.deleteUser(parsedInput.userId);
    return {
      result,
      message: "Successfully deleted user",
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
