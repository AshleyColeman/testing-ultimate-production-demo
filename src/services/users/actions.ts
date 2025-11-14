import { z } from 'zod';

import { serviceFactory } from '../../lib/services/serviceFactory';
import { CreateUserSchema, UpdateUserSchema, UserIdSchema, UserFiltersSchema } from './_data/userSchema';
import type { ServerCtxType } from '../../lib/utils/types';

/**
 * Simple action wrapper for testing (without Next.js)
 */
const createProcedure = () => ({
  schema: <T>(schema: z.ZodSchema<T>) => ({
    action: async (input: T) => {
      // Validate input
      const parsedInput = schema.parse(input);

      // Mock server context
      const serverCtx: ServerCtxType = {
        accountUserId: 1,
        userRole: 'admin',
      };

      // Ensure services are registered
      ensureServicesRegistered(serverCtx);

      return { parsedInput, ctx: { svc: serviceFactory } };
    },
  }),
});

const adminProcedure = createProcedure();

/**
 * Ensure all required services are registered with the factory
 */
function ensureServicesRegistered(serverCtx: ServerCtxType) {
  if (!serviceFactory.getServiceNames().includes('userService')) {
    const { userService } = require('./_data/userService');
    serviceFactory.registerServices({
      userService: (ctx: ServerCtxType) => userService(ctx),
    });
  }
  serviceFactory.setContext(serverCtx);
}

/**
 * Create a new user
 */
export const createUserAction = async (input: any) => {
  const result = await adminProcedure.schema(CreateUserSchema).action(input);
  const { parsedInput, ctx } = result as any;
  const serviceResult = await ctx.svc.get('userService').createUser(parsedInput);
  return serviceResult;
};

/**
 * Get user by ID
 */
export const getUserByIdAction = async (input: any) => {
  const result = await adminProcedure.schema(UserIdSchema).action(input);
  const { parsedInput, ctx } = result as any;
  const user = await ctx.svc.get('userService').getUserById(parsedInput);
  return { data: user, success: !!user };
};

/**
 * Get all users with pagination
 */
export const getAllUsersAction = async (input: any) => {
  const result = await adminProcedure.schema(UserFiltersSchema.omit({ search: true })).action(input);
  const { parsedInput, ctx } = result as any;
  const serviceResult = await ctx.svc.get('userService').getAllUsers(parsedInput);
  return serviceResult;
};

/**
 * Update user
 */
export const updateUserAction = async (input: any) => {
  const result = await adminProcedure.schema(UpdateUserSchema.merge(z.object({ id: UserIdSchema }))).action(input);
  const { parsedInput, ctx } = result as any;
  const { id, ...updateData } = parsedInput;
  const serviceResult = await ctx.svc.get('userService').updateUser(id, updateData);
  return serviceResult;
};

/**
 * Delete user
 */
export const deleteUserAction = async (input: any) => {
  const result = await adminProcedure.schema(UserIdSchema).action(input);
  const { parsedInput, ctx } = result as any;
  const serviceResult = await ctx.svc.get('userService').deleteUser(parsedInput);
  return serviceResult;
};

/**
 * Search users
 */
export const searchUsersAction = async (input: any) => {
  const result = await adminProcedure.schema(UserFiltersSchema).action(input);
  const { parsedInput, ctx } = result as any;
  const serviceResult = await ctx.svc.get('userService').searchUsers(parsedInput);
  return serviceResult;
};