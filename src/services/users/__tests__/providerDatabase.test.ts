/**
 * Provider Database Context Test
 * This test verifies that the provider correctly uses passed database or defaults
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { userProvider } from '../_data/userProvider';
import { DatabaseService } from '../../../utils/DatabaseService';

describe('User Provider Database Handling', () => {
  let mockDefaultDb: any;
  let mockPassedDb: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock default database
    mockDefaultDb = {
      $queryRaw: vi.fn(),
      $queryRawUnsafe: vi.fn(),
    };

    // Mock passed database
    mockPassedDb = {
      client: {
        $queryRaw: vi.fn(),
        $queryRawUnsafe: vi.fn(),
      },
    };

    // Mock DatabaseService.getInstance()
    vi.mocked(DatabaseService.getInstance).mockReturnValue({
      client: mockDefaultDb,
    } as any);
  });

  it('should use default database when no database passed in context', () => {
    const provider = userProvider({ userRole: 'admin' });

    // Call any provider method to verify database usage
    provider.getUserById('test_id');

    // Should use default database
    expect(mockDefaultDb.$queryRaw).toHaveBeenCalledWith(
      expect.stringContaining('SELECT * FROM users')
    );
    expect(mockPassedDb.client.$queryRaw).not.toHaveBeenCalled();
  });

  it('should use passed database when database provided in context', () => {
    const serverCtxWithDb = {
      userRole: 'admin',
      database: mockPassedDb,
    };

    const provider = userProvider(serverCtxWithDb);

    // Call any provider method to verify database usage
    provider.getUserById('test_id');

    // Should use passed database
    expect(mockPassedDb.client.$queryRaw).toHaveBeenCalledWith(
      expect.stringContaining('SELECT * FROM users')
    );
    expect(mockDefaultDb.$queryRaw).not.toHaveBeenCalled();
  });

  it('should work with all provider methods using passed database', async () => {
    const serverCtxWithDb = {
      userRole: 'admin',
      database: mockPassedDb,
    };

    const provider = userProvider(serverCtxWithDb);

    // Mock return values
    mockPassedDb.client.$queryRaw.mockResolvedValue([]);
    mockPassedDb.client.$queryRawUnsafe.mockResolvedValue([]);

    // Test all methods to ensure they use the passed database
    await provider.getUserById('test_id');
    await provider.getUserByEmail('test@example.com');
    await provider.getAllUsers();
    await provider.getUserCount();
    await provider.createUser({ id: 'test_id', email: 'test@example.com', name: 'Test' });
    await provider.updateUser('test_id', { name: 'Updated' });
    await provider.deleteUser('test_id');
    await provider.searchUsers('search');

    // Verify all calls used the passed database
    expect(mockPassedDb.client.$queryRaw).toHaveBeenCalled();
    expect(mockPassedDb.client.$queryRawUnsafe).toHaveBeenCalled();

    // Verify default database was never used
    expect(mockDefaultDb.$queryRaw).not.toHaveBeenCalled();
    expect(mockDefaultDb.$queryRawUnsafe).not.toHaveBeenCalled();
  });

  it('should handle TypeScript compilation without type arguments', async () => {
    // This test verifies that removing <Array<any>> type arguments works correctly
    const serverCtxWithDb = {
      userRole: 'admin',
      database: mockPassedDb,
    };

    const provider = userProvider(serverCtxWithDb);

    // Mock successful query
    mockPassedDb.client.$queryRaw.mockResolvedValue([{ id: 'test_id' }]);

    // These calls should compile without TypeScript errors
    const user = await provider.getUserById('test_id');
    const users = await provider.getAllUsers();
    const count = await provider.getUserCount();

    expect(user).toBeDefined();
    expect(users).toBeDefined();
    expect(count).toBeDefined();
  });
});