import { z } from 'zod';

/**
 * Common validation schemas
 */

export const PaginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export const FilterSchema = z.object({
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const IdSchema = z.coerce.number().positive().int();

export const StringIdSchema = z.string().min(1);

export const CommonFilterSchema = FilterSchema.merge(PaginationSchema);

/**
 * Extract input types from schemas
 */
export type PaginationInput = z.infer<typeof PaginationSchema>;
export type FilterInput = z.infer<typeof FilterSchema>;
export type IdInput = z.infer<typeof IdSchema>;
export type StringIdInput = z.infer<typeof StringIdSchema>;
export type CommonFilterInput = z.infer<typeof CommonFilterSchema>;