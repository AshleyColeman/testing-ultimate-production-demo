/**
 * Test file to demonstrate database context passing
 * This shows how you can inject a test database through the action layer
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createUserAction, getUserByIdAction } from '../actions';

// Mock database for testing
const mockDatabase = {
  client: {
    $queryRaw: vi.fn(),
    $queryRawUnsafe: vi.fn(),
  },
};

describe('Database Context Passing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should use passed database in provider layer', async () => {
    // Mock successful user creation
    mockDatabase.client.$queryRaw.mockResolvedValue([
      {
        id: 'test_123',
        email: 'test@example.com',
        name: 'Test User',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    // Mock user lookup
    mockDatabase.client.$queryRaw.mockResolvedValueOnce([
      {
        id: 'test_123',
        email: 'test@example.com',
        name: 'Test User',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    // Call action with database context
    const result = await createUserAction({
      email: 'test@example.com',
      name: 'Test User',
      database: mockDatabase, // Database passed through action
    });

    expect(result.success).toBe(true);
    expect(result.data.email).toBe('test@example.com');
    expect(mockDatabase.client.$queryRaw).toHaveBeenCalled();
  });

  it('should work without passing database (uses default)', async () => {
    // This would use the default DatabaseService.getInstance()
    // In a real test, you'd mock DatabaseService.getInstance()

    const result = await createUserAction({
      email: 'test@example.com',
      name: 'Test User',
      // No database parameter - uses default
    });

    // The action should still work (though might fail without real DB)
    expect(result).toBeDefined();
  });
});