import { z } from "zod";

/**
 * User validation schemas
 * Following Inter-Train pattern for comprehensive input validation
 */

export const CreateUserSchema = z
  .object({
    email: z.string().email("Invalid email format").min(1, "Email is required"),
    name: z
      .string()
      .min(1, "Name is required")
      .max(100, "Name must be 100 characters or less"),
  })
  .passthrough(); // Allow additional properties like 'database'

export const UpdateUserSchema = z
  .object({
    name: z
      .string()
      .min(1, "Name is required")
      .max(100, "Name must be 100 characters or less")
      .optional(),
    isActive: z.boolean().optional(),
  })
  .passthrough(); // Allow additional properties like 'database'

export const UserIdSchema = z.string().min(1, "User ID is required");

// Wrapper schema for actions that need to accept userId as an object with optional database
export const UserIdActionSchema = z
  .object({
    userId: UserIdSchema,
  })
  .passthrough(); // Allow additional properties like 'database'

export const UserFiltersSchema = z
  .object({
    search: z.string().optional(),
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(20),
    sortBy: z
      .enum(["email", "name", "createdAt", "updatedAt"])
      .default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
  })
  .passthrough(); // Allow additional properties like 'database'

export const DeleteUserSchema = z
  .object({
    userId: z.string().min(1, "User ID is required"),
    hardDelete: z.boolean().default(false),
  })
  .passthrough(); // Allow additional properties like 'database'

// Extract types for use in components
export type CreateUserInput = z.infer<typeof CreateUserSchema>;
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;
export type UserIdInput = z.infer<typeof UserIdSchema>;
export type UserFiltersInput = z.infer<typeof UserFiltersSchema>;
export type DeleteUserInput = z.infer<typeof DeleteUserSchema>;
