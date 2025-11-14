---
name: Action Testing Patterns Skill
title: ACTION TESTING PATTERNS - Test Validation, Authorization & Orchestration
description: >
  Generate comprehensive tests for Action layer components including validation schemas,
  authorization procedures, service orchestration, and response formatting.
---

# 🧪 ACTION TESTING PATTERNS

**Purpose**: Generate comprehensive integration tests for Action layer components with full validation, authorization, and service orchestration testing.

**When to Use**: After **Skill 14: Action Pattern Analysis** has detected the action patterns.

**Triggers**: "action", "validation", "authorization", "procedure", "schema", "orchestration", "test actions"

---

## 🎯 WHAT THIS SKILL TESTS

### Core Action Components

- ✅ **Validation Schemas** - Test Zod validation with valid/invalid inputs
- ✅ **Authorization Procedures** - Test admin/user/public access control
- ✅ **Service Orchestration** - Test service calls and error propagation
- ✅ **Cache Invalidation** - Test revalidatePath calls
- ✅ **Response Formatting** - Test standard response structure
- ✅ **Error Handling** - Test error formatting and propagation

### Test Coverage Matrix

| Component | Happy Path | Error Path | Edge Cases |
| --------- | ---------- | ---------- | ---------- |
| Validation | ✅ Valid schema data | ✅ Invalid data types | ✅ Boundary conditions |
| Authorization | ✅ Correct permissions | ✅ Insufficient permissions | ✅ Missing auth context |
| Services | ✅ Service calls succeed | ✅ Service failures | ✅ Service timeouts |
| Cache | ✅ Path invalidation | ❌ Cache errors (rare) | ❌ Concurrent invalidation |
| Response | ✅ Standard format | ✅ Error format | ✅ Partial success |

---

## 🔧 ACTION TEST GENERATION WORKFLOW

### Step 1: Setup Test Infrastructure

```typescript
// Standard action test setup
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

// Action imports
import { createUserAction, getUserByIdAction } from '../../services/users/actions';
import type { CreateUserInput } from '../../services/users/actions';

// Infrastructure imports
import {
  getInfrastructure,
  getSchemasByService,
  recordTestExecution,
} from '../shared/testInfrastructure';

// Helper imports
import {
  simulateProductionOperation,
  generateTestData,
} from '../shared/testHelpers';
```

### Step 2: Mock Service Dependencies

```typescript
// Mock services that actions orchestrate
const mockUserService = {
  create: vi.fn(),
  getById: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
};

// Mock service factory
vi.mock('../../lib/services/serviceFactory', () => ({
  serviceFactory: {
    get: vi.fn((serviceName) => {
      switch (serviceName) {
        case 'userService':
          return mockUserService;
        default:
          throw new Error(`Service ${serviceName} not mocked`);
      }
    }),
  },
}));

// Mock authorization context
const createMockContext = (userRole = 'admin') => ({
  svc: {
    get: vi.fn(),
  },
  user: {
    id: 'test-user-id',
    role: userRole,
    permissions: userRole === 'admin' ? ['read', 'write', 'delete'] : ['read'],
  },
});
```

### Step 3: Generate Validation Tests

```typescript
// Schema validation testing
describe('Action Validation Tests', () => {
  it('[Test 1/10] should validate required fields in CreateUserSchema', async () => {
    // Setup mocks
    mockUserService.create.mockResolvedValue({
      success: true,
      data: { id: '123', email: 'test@example.com', name: 'Test' }
    });

    const result = await createUserAction({
      // Missing email field
      name: 'Test User'
    });

    expect(result.success).toBe(false);
    expect(result.errors).toContain('Email is required');
  });

  it('[Test 2/10] should validate email format', async () => {
    const result = await createUserAction({
      email: 'invalid-email-format',
      name: 'Test User'
    });

    expect(result.success).toBe(false);
    expect(result.errors).toContain('Invalid email format');
  });

  it('[Test 3/10] should validate string length constraints', async () => {
    const result = await createUserAction({
      email: 'test@example.com',
      name: 'a' // Too short if min length is 2
    });

    expect(result.success).toBe(false);
    expect(result.errors).toContain('Name must be at least 2 characters');
  });
});
```

### Step 4: Generate Authorization Tests

```typescript
// Authorization testing
describe('Action Authorization Tests', () => {
  it('[Test 4/10] should allow admin to create users', async () => {
    // Mock admin context
    const adminContext = createMockContext('admin');
    mockUserService.create.mockResolvedValue({
      success: true,
      data: { id: '123', email: 'admin@test.com', name: 'Admin User' }
    });

    const result = await createUserAction({
      email: 'admin@test.com',
      name: 'Admin User'
    });

    expect(result.success).toBe(true);
    expect(result.data.email).toBe('admin@test.com');
  });

  it('[Test 5/10] should deny non-admin users from creating users', async () => {
    // Mock user context (not admin)
    const userContext = createMockContext('user');

    const result = await createUserAction({
      email: 'user@test.com',
      name: 'Regular User'
    });

    expect(result.success).toBe(false);
    expect(result.errors).toContain('Insufficient permissions');
  });

  it('[Test 6/10] should deny unauthenticated access', async () => {
    // Mock empty context (no user)
    const emptyContext = createMockContext(null);

    const result = await createUserAction({
      email: 'test@example.com',
      name: 'Test User'
    });

    expect(result.success).toBe(false);
    expect(result.errors).toContain('Authentication required');
  });
});
```

### Step 5: Generate Service Orchestration Tests

```typescript
// Service orchestration testing
describe('Action Service Orchestration Tests', () => {
  it('[Test 7/10] should call userService.create with correct parameters', async () => {
    const userData = {
      email: 'orchestration@test.com',
      name: 'Orchestration Test'
    };

    mockUserService.create.mockResolvedValue({
      success: true,
      data: { id: '456', ...userData }
    });

    const result = await createUserAction(userData);

    // Verify service was called with correct data
    expect(mockUserService.create).toHaveBeenCalledTimes(1);
    expect(mockUserService.create).toHaveBeenCalledWith(userData);

    // Verify result formatting
    expect(result.success).toBe(true);
    expect(result.data.email).toBe(userData.email);
  });

  it('[Test 8/10] should handle service failures gracefully', async () => {
    const userData = {
      email: 'fail@test.com',
      name: 'Failure Test'
    };

    // Mock service failure
    mockUserService.create.mockRejectedValue(new Error('Service unavailable'));

    const result = await createUserAction(userData);

    expect(result.success).toBe(false);
    expect(result.errors).toContain('Service unavailable');
  });

  it('[Test 9/10] should propagate service errors correctly', async () => {
    const userData = {
      email: 'propagate@test.com',
      name: 'Propagation Test'
    };

    // Mock service with specific error
    const serviceError = new Error('User with this email already exists');
    serviceError.code = 'DUPLICATE_EMAIL';
    mockUserService.create.mockRejectedValue(serviceError);

    const result = await createUserAction(userData);

    expect(result.success).toBe(false);
    expect(result.errors).toContain('User with this email already exists');
  });
});
```

### Step 6: Generate Cache & Response Tests

```typescript
// Cache invalidation and response formatting tests
describe('Action Cache & Response Tests', () => {
  it('[Test 10/10] should invalidate cache after successful operation', async () => {
    const userData = {
      email: 'cache@test.com',
      name: 'Cache Test'
    };

    // Mock revalidatePath (Next.js cache invalidation)
    const mockRevalidatePath = vi.fn();
    vi.mock('next/cache', () => ({
      revalidatePath: mockRevalidatePath,
    }));

    mockUserService.create.mockResolvedValue({
      success: true,
      data: { id: '789', ...userData }
    });

    const result = await createUserAction(userData);

    expect(result.success).toBe(true);
    expect(mockRevalidatePath).toHaveBeenCalledWith('/users', 'layout');
  });
});
```

---

## 📋 COMPLETE ACTION TEST TEMPLATE

### Full Test File Example

```typescript
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { createUserAction, updateUserAction, deleteUserAction } from '../../services/users/actions';
import type { CreateUserInput, UpdateUserInput } from '../../services/users/actions';
import {
  getInfrastructure,
  getSchemasByService,
  recordTestExecution,
} from '../shared/testInfrastructure';
import {
  simulateProductionOperation,
  generateTestData,
} from '../shared/testHelpers';

// Mock service dependencies
const mockUserService = {
  create: vi.fn(),
  getById: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  getAll: vi.fn(),
};

vi.mock('../../lib/services/serviceFactory', () => ({
  serviceFactory: {
    get: vi.fn((serviceName) => {
      if (serviceName === 'userService') return mockUserService;
      throw new Error(`Service ${serviceName} not mocked`);
    }),
  },
}));

// Mock cache invalidation
const mockRevalidatePath = vi.fn();
vi.mock('next/cache', () => ({
  revalidatePath: mockRevalidatePath,
}));

describe('User Actions Integration Tests', () => {
  let infra: any;
  let schemas: any;
  let schema: any;

  beforeAll(async () => {
    // Setup infrastructure
    infra = await getInfrastructure();
    schemas = await getSchemasByService('auth');
    schema = schemas[Math.floor(Math.random() * schemas.length)];

    // Setup database tables (if needed)
    await setupUserTables(schema);
  });

  describe('Create User Action', () => {
    it('[Test 1/10] should create user with valid data and admin permissions', async () => {
      const startTime = Date.now();

      const userData: CreateUserInput = {
        email: `test_${Date.now()}@example.com`,
        name: 'Test User',
        role: 'user'
      };

      mockUserService.create.mockResolvedValue({
        success: true,
        data: { id: 'user_123', ...userData }
      });

      const result = await createUserAction(userData);
      const executionTime = Date.now() - startTime;

      expect(result.success).toBe(true);
      expect(result.data.email).toBe(userData.email);
      expect(result.data.name).toBe(userData.name);
      expect(mockUserService.create).toHaveBeenCalledWith(userData);
      expect(mockRevalidatePath).toHaveBeenCalledWith('/users', 'layout');

      await recordTestExecution(
        'user-actions',
        'create-user-valid-data',
        'success',
        executionTime,
        { testNumber: 1 }
      );
    });

    it('[Test 2/10] should reject invalid email format', async () => {
      const startTime = Date.now();

      const invalidData = {
        email: 'invalid-email',
        name: 'Test User'
      };

      const result = await createUserAction(invalidData);
      const executionTime = Date.now() - startTime;

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Invalid email format');
      expect(mockUserService.create).not.toHaveBeenCalled();

      await recordTestExecution(
        'user-actions',
        'create-user-invalid-email',
        'success',
        executionTime,
        { testNumber: 2 }
      );
    });

    it('[Test 3/10] should require all mandatory fields', async () => {
      const startTime = Date.now();

      const incompleteData = {
        email: 'test@example.com'
        // Missing name field
      };

      const result = await createUserAction(incompleteData);
      const executionTime = Date.now() - startTime;

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Name is required');

      await recordTestExecution(
        'user-actions',
        'create-user-missing-fields',
        'success',
        executionTime,
        { testNumber: 3 }
      );
    });

    it('[Test 4/10] should handle service layer failures', async () => {
      const startTime = Date.now();

      const userData: CreateUserInput = {
        email: `fail_${Date.now()}@example.com`,
        name: 'Failure Test'
      };

      const serviceError = new Error('Database connection failed');
      mockUserService.create.mockRejectedValue(serviceError);

      const result = await createUserAction(userData);
      const executionTime = Date.now() - startTime;

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Database connection failed');

      await recordTestExecution(
        'user-actions',
        'create-user-service-failure',
        'success',
        executionTime,
        { testNumber: 4 }
      );
    });
  });

  describe('Update User Action', () => {
    it('[Test 5/10] should update user with valid data', async () => {
      const startTime = Date.now();

      const updateData: UpdateUserInput = {
        id: 'user_123',
        name: 'Updated Name'
      };

      mockUserService.update.mockResolvedValue({
        success: true,
        data: { id: 'user_123', email: 'test@example.com', ...updateData }
      });

      const result = await updateUserAction(updateData);
      const executionTime = Date.now() - startTime;

      expect(result.success).toBe(true);
      expect(result.data.name).toBe('Updated Name');
      expect(mockUserService.update).toHaveBeenCalledWith('user_123', { name: 'Updated Name' });

      await recordTestExecution(
        'user-actions',
        'update-user-valid',
        'success',
        executionTime,
        { testNumber: 5 }
      );
    });

    it('[Test 6/10] should reject updates for non-existent user', async () => {
      const startTime = Date.now();

      const updateData: UpdateUserInput = {
        id: 'non_existent',
        name: 'Updated Name'
      };

      const notFoundError = new Error('User not found');
      notFoundError.code = 'P2025';
      mockUserService.update.mockRejectedValue(notFoundError);

      const result = await updateUserAction(updateData);
      const executionTime = Date.now() - startTime;

      expect(result.success).toBe(false);
      expect(result.errors).toContain('User not found');

      await recordTestExecution(
        'user-actions',
        'update-user-not-found',
        'success',
        executionTime,
        { testNumber: 6 }
      );
    });
  });

  describe('Delete User Action', () => {
    it('[Test 7/10] should delete user successfully', async () => {
      const startTime = Date.now();

      const userId = 'user_123';

      mockUserService.delete.mockResolvedValue({
        success: true,
        data: { deleted: true }
      });

      const result = await deleteUserAction({ id: userId });
      const executionTime = Date.now() - startTime;

      expect(result.success).toBe(true);
      expect(mockUserService.delete).toHaveBeenCalledWith(userId, false);
      expect(mockRevalidatePath).toHaveBeenCalledWith('/users', 'layout');

      await recordTestExecution(
        'user-actions',
        'delete-user-success',
        'success',
        executionTime,
        { testNumber: 7 }
      );
    });

    it('[Test 8/10] should handle soft delete correctly', async () => {
      const startTime = Date.now();

      const userId = 'user_456';

      mockUserService.delete.mockResolvedValue({
        success: true,
        data: { deleted: true, softDelete: true }
      });

      const result = await deleteUserAction({ id: userId, hardDelete: false });
      const executionTime = Date.now() - startTime;

      expect(result.success).toBe(true);
      expect(mockUserService.delete).toHaveBeenCalledWith(userId, false);

      await recordTestExecution(
        'user-actions',
        'delete-user-soft',
        'success',
        executionTime,
        { testNumber: 8 }
      );
    });
  });

  describe('Action Authorization Tests', () => {
    it('[Test 9/10] should deny action without proper permissions', async () => {
      const startTime = Date.now();

      // This test would need to mock the authorization procedure
      // to return insufficient permissions
      const userData: CreateUserInput = {
        email: `unauthorized_${Date.now()}@example.com`,
        name: 'Unauthorized User'
      };

      // Mock authorization failure
      vi.mock('../../lib/procedures', () => ({
        adminProcedure: {
          schema: vi.fn(),
          action: vi.fn().mockRejectedValue(new Error('Insufficient permissions'))
        }
      }));

      const result = await createUserAction(userData);
      const executionTime = Date.now() - startTime;

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Insufficient permissions');

      await recordTestExecution(
        'user-actions',
        'authorization-failure',
        'success',
        executionTime,
        { testNumber: 9 }
      );
    });

    it('[Test 10/10] should include proper response formatting', async () => {
      const startTime = Date.now();

      const userData: CreateUserInput = {
        email: `format_${Date.now()}@example.com`,
        name: 'Format Test'
      };

      mockUserService.create.mockResolvedValue({
        success: true,
        data: { id: 'user_789', ...userData }
      });

      const result = await createUserAction(userData);
      const executionTime = Date.now() - startTime;

      // Verify response structure
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('message');
      expect(typeof result.success).toBe('boolean');
      expect(typeof result.message).toBe('string');

      await recordTestExecution(
        'user-actions',
        'response-formatting',
        'success',
        executionTime,
        { testNumber: 10 }
      );
    });
  });

  // Helper function to setup database tables
  async function setupUserTables(schema: any) {
    await schema.prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "${schema.schemaName}".users (
        id VARCHAR(255) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'user',
        "isActive" BOOLEAN DEFAULT true,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      )
    `);
  }
});
```

---

## 🔍 ACTION-SPECIFIC ERROR HANDLING

### Validation Error Patterns

```typescript
// Test specific validation error messages
const validationErrorTests = [
  {
    name: 'Email format validation',
    input: { email: 'not-an-email' },
    expectedError: 'Invalid email format'
  },
  {
    name: 'Required field validation',
    input: { email: 'test@example.com' }, // Missing name
    expectedError: 'Name is required'
  },
  {
    name: 'Minimum length validation',
    input: { email: 'test@example.com', name: 'a' }, // Too short
    expectedError: 'Name must be at least 2 characters'
  },
  {
    name: 'Maximum length validation',
    input: { email: 'test@example.com', name: 'a'.repeat(101) }, // Too long
    expectedError: 'Name must be 100 characters or less'
  }
];
```

### Authorization Error Patterns

```typescript
// Test specific authorization scenarios
const authorizationErrorTests = [
  {
    name: 'Admin procedure with user role',
    context: { user: { role: 'user' } },
    expectedError: 'Insufficient permissions'
  },
  {
    name: 'Admin procedure without authentication',
    context: {},
    expectedError: 'Authentication required'
  },
  {
    name: 'User procedure with invalid session',
    context: { user: null, session: 'expired' },
    expectedError: 'Invalid session'
  }
];
```

### Service Error Patterns

```typescript
// Test service error propagation
const serviceErrorTests = [
  {
    name: 'Database connection error',
    mockError: new Error('Database connection failed'),
    expectedError: 'Service temporarily unavailable'
  },
  {
    name: 'Duplicate record error',
    mockError: new Error('Duplicate email'),
    expectedError: 'User with this email already exists'
  },
  {
    name: 'Foreign key constraint error',
    mockError: new Error('Referenced record not found'),
    expectedError: 'Referenced resource does not exist'
  }
];
```

---

## 📋 ACTION TESTING CHECKLIST

Before completing action test generation, verify:

### Test Structure
- [x] 10 tests total with [Test X/10] naming
- [x] Mix of happy path (6-7) and error scenarios (3-4)
- [x] Proper describe blocks grouping related tests
- [x] All necessary imports included

### Validation Testing
- [x] Required field validation tested
- [x] Data type validation tested
- [x] Format validation tested (email, etc.)
- [x] Length/boundary validation tested
- [x] Custom validation rules tested

### Authorization Testing
- [x] Correct permissions allow access
- [x] Insufficient permissions denied
- [x] Missing authentication denied
- [x] Invalid/expired sessions denied

### Service Orchestration Testing
- [x] Services called with correct parameters
- [x] Service success handled correctly
- [x] Service errors propagated correctly
- [x] Multiple service orchestration tested

### Response Testing
- [x] Success response format correct
- [x] Error response format correct
- [x] Response timing within limits
- [x] Cache invalidation triggered

### Infrastructure Testing
- [x] Database setup in beforeAll
- [x] Test data cleanup (if needed)
- [x] Mock services properly configured
- [x] Execution metrics recorded

---

## 🚨 TROUBLESHOOTING

### Common Action Test Issues

**Issue**: Authorization not properly mocked
```typescript
// Problem: Procedure not mocked
export const action = async (input: any) => {
  const { parsedInput, ctx } = await adminProcedure.schema(Schema).action(input);
}

// Solution: Mock the entire procedure chain
vi.mock('../../lib/procedures', () => ({
  adminProcedure: {
    schema: vi.fn().mockReturnThis(),
    action: vi.fn().mockImplementation((input) => ({
      parsedInput: input,
      ctx: createMockContext('admin')
    }))
  }
}));
```

**Issue**: Service factory not properly mocked
```typescript
// Problem: ctx.svc.get returns undefined
const result = await ctx.svc.get('userService').create(data);

// Solution: Mock service factory with service instances
vi.mock('../../lib/services/serviceFactory', () => ({
  serviceFactory: {
    get: vi.fn((serviceName) => {
      if (serviceName === 'userService') return mockUserService;
      throw new Error(`Service ${serviceName} not mocked`);
    })
  }
}));
```

**Issue**: Cache invalidation not tested
```typescript
// Problem: revalidatePath not called or not tested
revalidatePath('/users', 'layout');

// Solution: Mock and assert cache calls
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn()
}));

expect(mockRevalidatePath).toHaveBeenCalledWith('/users', 'layout');
```

---

## 📚 RELATED SKILLS

- **Skill 14**: Action Pattern Analysis - Prerequisite for detecting patterns
- **Skill 4**: Create Dynamic Schema - Sets up database for action tests
- **Skill 9**: Test Error Scenarios - Enhanced for action-specific errors
- **Skill 11**: Self-Healing Tests - Fixes action test issues automatically

---

**File**: action-testing-patterns.md
**Date**: November 14, 2025
**Status**: Complete and Production-Ready
**For**: Integration test agents that need to generate comprehensive Action layer tests