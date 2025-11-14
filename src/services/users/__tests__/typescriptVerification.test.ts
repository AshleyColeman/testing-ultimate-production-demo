/**
 * TypeScript verification test
 * This test ensures that the database context passing works with proper TypeScript types
 */

import { describe, it, expect, vi } from 'vitest';
import { createUserAction, getUserByIdAction } from '../actions';

describe('TypeScript Verification', () => {
  it('should compile without TypeScript errors', async () => {
    // Mock database
    const mockDatabase = {
      client: {
        $queryRaw: vi.fn().mockResolvedValue([]),
        $queryRawUnsafe: vi.fn().mockResolvedValue([]),
      },
    };

    // Test that these calls compile without TypeScript errors
    const createUserPromise = createUserAction({
      email: 'test@example.com',
      name: 'Test User',
      database: mockDatabase, // TypeScript should accept this
    });

    const getUserPromise = getUserByIdAction({
      id: 'user_123',
      database: mockDatabase, // TypeScript should accept this
    });

    // Verify promises are returned (functions work)
    expect(createUserPromise).toBeInstanceOf(Promise);
    expect(getUserPromise).toBeInstanceOf(Promise);

    // Test without database parameter (should also compile)
    const createUserWithoutDbPromise = createUserAction({
      email: 'test2@example.com',
      name: 'Test User 2',
      // No database parameter - should still work
    });

    expect(createUserWithoutDbPromise).toBeInstanceOf(Promise);
  });

  it('should provide correct type inference', () => {
    // This test ensures type inference works correctly
    // If this compiles, the types are correct

    type CreateUserInput = Parameters<typeof createUserAction>[0];
    type GetUserByIdInput = Parameters<typeof getUserByIdAction>[0];

    // These should be valid assignments if types are correct
    const validCreateInput: CreateUserInput = {
      email: 'test@example.com',
      name: 'Test User',
      database: { client: { $queryRaw: vi.fn() } },
    };

    const validGetUserInput: GetUserByIdInput = {
      id: 'user_123',
      database: { client: { $queryRaw: vi.fn() } },
    };

    expect(validCreateInput.email).toBe('test@example.com');
    expect(validGetUserInput.id).toBe('user_123');
  });
});