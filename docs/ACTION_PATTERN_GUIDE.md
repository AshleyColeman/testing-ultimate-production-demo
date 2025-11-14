# Action Pattern Guide

## Overview

The Action pattern is the top layer of the Inter-Train three-tier architecture. Actions serve as the **entry point for all external interactions** with the system, providing validation, authorization, and orchestration of service operations.

This document explains the complete Action pattern, how it works, and how to build/test actions for the system.

## 🏗️ Architecture Context

```
┌─────────────────────────────────────────────────────────────┐
│                    ACTION LAYER                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │   Server Actions│  │   CLI Commands  │  │   API Routes │ │
│  │   (actions.ts)  │  │  (commands/)    │  │  (routes/)   │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   SERVICE LAYER                             │
│              (userService.ts, etc.)                        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  PROVIDER LAYER                             │
│              (userProvider.ts, etc.)                       │
└─────────────────────────────────────────────────────────────┘
```

## 🎯 Action Layer Responsibilities

1. **Input Validation** - Using Zod schemas
2. **Authorization** - Role-based access control
3. **Service Orchestration** - Calling service layer methods
4. **Error Handling** - Standardized error responses
5. **Cache Invalidation** - Revalidating paths/queries
6. **Response Formatting** - Consistent output structure

## 📁 Action File Structure

### Standard Action File (`actions.ts`)

```typescript
import { z } from 'zod';
import { serviceFactory } from '../../lib/services/serviceFactory';
import { SchemaName } from './_data/schemaFile';
import type { ServerCtxType } from '../../lib/utils/types';

/**
 * Action Definition Pattern
 *
 * Each action follows this structure:
 * 1. Validation schema definition
 * 2. Procedure wrapper with authorization
 * 3. Service orchestration
 * 4. Response formatting
 */
```

## 🔧 Action Patterns

### 1. Basic Action Pattern

```typescript
/**
 * Basic CRUD Action - Create Example
 */
export const createEntityAction = async (input: any) => {
  // Step 1: Validate input using Zod schema
  const { parsedInput, ctx } = await adminProcedure
    .schema(CreateEntitySchema)
    .action(input);

  // Step 2: Call service layer
  const result = await ctx.svc.get('entityService').create(parsedInput);

  // Step 3: Handle cache invalidation (if needed)
  if (result.success) {
    // Cache invalidation logic here
  }

  // Step 4: Return formatted response
  return result;
};
```

### 2. Query Action Pattern

```typescript
/**
 * Query Action - Get by ID Example
 */
export const getEntityByIdAction = async (input: any) => {
  const { parsedInput, ctx } = await adminProcedure
    .schema(IdSchema)
    .action(input);

  const entity = await ctx.svc.get('entityService').getById(parsedInput);

  return {
    data: entity,
    success: !!entity,
    message: entity ? 'Entity found' : 'Entity not found'
  };
};
```

### 3. List Action Pattern

```typescript
/**
 * List Action - Paginated Results Example
 */
export const listEntitiesAction = async (input: any) => {
  const { parsedInput, ctx } = await adminProcedure
    .schema(ListSchema)
    .action(input);

  const result = await ctx.svc.get('entityService').getAll(parsedInput);
  return result;
};
```

### 4. Update Action Pattern

```typescript
/**
 * Update Action - Partial Update Example
 */
export const updateEntityAction = async (input: any) => {
  const { parsedInput, ctx } = await adminProcedure
    .schema(UpdateSchema.merge(z.object({ id: IdSchema })))
    .action(input);

  const { id, ...updateData } = parsedInput;
  const result = await ctx.svc.get('entityService').update(id, updateData);

  // Cache invalidation
  if (result.success) {
    revalidatePath('/entities', 'layout');
    revalidatePath(`/entities/${id}`, 'page');
  }

  return result;
};
```

### 5. Delete Action Pattern

```typescript
/**
 * Delete Action - Soft/Hard Delete Example
 */
export const deleteEntityAction = async (input: any) => {
  const { parsedInput, ctx } = await adminProcedure
    .schema(DeleteSchema)
    .action(input);

  const result = await ctx.svc.get('entityService').delete(parsedInput.id, parsedInput.hardDelete);

  if (result.success) {
    revalidatePath('/entities', 'layout');
  }

  return result;
};
```

## 🔐 Authorization Procedures

### Procedure Types

```typescript
// Different authorization levels
const adminProcedure = createProcedure();     // Admin only
const userProcedure = createProcedure();      // Authenticated users
const publicProcedure = createProcedure();    // Public access
```

### Context Injection

```typescript
/**
 * Context Structure for Actions
 */
interface ActionContext {
  parsedInput: any;           // Validated input data
  ctx: {
    svc: ServiceFactory;      // Service factory instance
    user: {                   // User information
      id: string;
      role: string;
      permissions: string[];
    };
    req?: Request;            // HTTP request (if applicable)
  };
}
```

## 🧪 Testing Action Patterns

### 1. Unit Testing Actions

```typescript
// test/actions/userActions.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createUserAction, getUserByIdAction } from '../../src/services/users/actions';

describe('User Actions', () => {
  beforeEach(() => {
    // Mock service factory
    vi.mock('../../src/lib/services/serviceFactory');
  });

  it('should create user with valid input', async () => {
    const mockUserService = {
      create: vi.fn().mockResolvedValue({
        data: { id: '123', email: 'test@example.com', name: 'Test' },
        success: true
      })
    };

    // Mock service factory
    const mockFactory = {
      get: vi.fn().mockReturnValue(mockUserService)
    };

    const result = await createUserAction({
      email: 'test@example.com',
      name: 'Test'
    });

    expect(result.success).toBe(true);
    expect(result.data.email).toBe('test@example.com');
  });
});
```

### 2. Integration Testing Actions

```typescript
// test/integration/userActions.integration.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createUserAction, getAllUsersAction } from '../../src/services/users/actions';
import { DatabaseService } from '../../src/utils/DatabaseService';

describe('User Actions Integration', () => {
  beforeAll(async () => {
    // Setup test database
    await DatabaseService.getInstance().connect();
  });

  afterAll(async () => {
    // Cleanup
    await DatabaseService.getInstance().disconnect();
  });

  it('should create and retrieve user end-to-end', async () => {
    // Create user
    const createResult = await createUserAction({
      email: 'integration@test.com',
      name: 'Integration Test'
    });

    expect(createResult.success).toBe(true);
    expect(createResult.data.id).toBeDefined();

    // List users
    const listResult = await getAllUsersAction({ page: 1, limit: 10 });
    expect(listResult.success).toBe(true);
    expect(listResult.data.some(u => u.email === 'integration@test.com')).toBe(true);
  });
});
```

### 3. Error Testing Actions

```typescript
describe('User Actions Error Handling', () => {
  it('should handle validation errors', async () => {
    const result = await createUserAction({
      email: 'invalid-email',  // Invalid format
      name: ''
    });

    expect(result.success).toBe(false);
    expect(result.errors).toContain('Invalid email format');
    expect(result.errors).toContain('Name is required');
  });

  it('should handle duplicate email errors', async () => {
    // Create first user
    await createUserAction({
      email: 'duplicate@test.com',
      name: 'First User'
    });

    // Try to create duplicate
    const result = await createUserAction({
      email: 'duplicate@test.com',
      name: 'Second User'
    });

    expect(result.success).toBe(false);
    expect(result.errors).toContain('User with email duplicate@test.com already exists');
  });
});
```

## 🎯 Action Building Guidelines

### 1. Schema Definition

```typescript
// Always define comprehensive Zod schemas
export const CreateUserSchema = z.object({
  email: z.string().email('Invalid email format').min(1, 'Email is required'),
  name: z.string().min(1, 'Name is required').max(100, 'Name must be 100 characters or less'),
  // Add validation for all fields
});

// Extract types for TypeScript safety
export type CreateUserInput = z.infer<typeof CreateUserSchema>;
```

### 2. Error Handling

```typescript
export const robustAction = async (input: any) => {
  try {
    const { parsedInput, ctx } = await adminProcedure
      .schema(Schema)
      .action(input);

    const result = await ctx.svc.get('serviceName').method(parsedInput);

    return {
      ...result,
      timestamp: new Date().toISOString(),
      action: 'robustAction'
    };

  } catch (error) {
    logger.error('Action failed:', error);

    return {
      data: null,
      success: false,
      errors: [error instanceof Error ? error.message : 'Unknown error'],
      timestamp: new Date().toISOString()
    };
  }
};
```

### 3. Service Registration

```typescript
/**
 * Ensure Services Are Registered
 *
 * This pattern ensures required services are available before actions execute.
 */
function ensureServicesRegistered(serverCtx: ServerCtxType) {
  const requiredServices = ['userService', 'notificationService'];

  requiredServices.forEach(serviceName => {
    if (!serviceFactory.getServiceNames().includes(serviceName)) {
      // Register service if not already registered
      const serviceModule = require(`./_data/${serviceName}`);
      serviceFactory.register(serviceName, serviceModule[serviceName]);
    }
  });

  serviceFactory.setContext(serverCtx);
}
```

## 🔄 Action Execution Flow

```
Input Request
     │
     ▼
┌─────────────────┐
│   Validation    │ ← Zod Schema
│   (Zod parse)   │
└─────────────────┘
     │
     ▼
┌─────────────────┐
│  Authorization  │ ← Procedure Check
│  (Role check)   │
└─────────────────┘
     │
     ▼
┌─────────────────┐
│   Service Call  │ ← Service Layer
│   (Business)    │
└─────────────────┘
     │
     ▼
┌─────────────────┐
│   Response      │ ← Formatted Output
│   (Standard)    │
└─────────────────┘
```

## 📋 Required System Components for Testing

### 1. Database Setup

```typescript
// Test database configuration
const testDatabase = {
  host: 'localhost',
  port: 5432,
  database: 'test_db',
  user: 'test_user',
  password: 'test_password'
};

// Required tables for user service
CREATE TABLE users (
  id VARCHAR(255) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);
```

### 2. Environment Variables

```bash
# .env.test
DATABASE_URL="postgresql://test_user:test_password@localhost:5432/test_db"
LOG_LEVEL="debug"
NODE_ENV="test"
```

### 3. Test Dependencies

```json
{
  "devDependencies": {
    "vitest": "^1.0.0",
    "@vitest/ui": "^1.0.0",
    "testcontainers": "^10.0.0",
    "@types/node": "^20.0.0"
  }
}
```

## 🧪 Testing Strategy

### 1. Test Categories

```typescript
// 1. Unit Tests - Individual actions
describe('Action Unit Tests', () => {
  // Mock services, test validation and business logic
});

// 2. Integration Tests - Full action flow
describe('Action Integration Tests', () => {
  // Real database, test complete workflows
});

// 3. End-to-End Tests - HTTP/API level
describe('Action E2E Tests', () => {
  // Test through actual HTTP requests
});
```

### 2. Test Data Management

```typescript
// Test data factory
export const createTestUser = (overrides = {}) => ({
  email: 'test@example.com',
  name: 'Test User',
  ...overrides
});

// Database cleanup utilities
export const cleanupTestData = async () => {
  await db.users.deleteMany();
  await db.notifications.deleteMany();
};
```

### 3. Mock Strategies

```typescript
// Service mocking
vi.mock('../../src/lib/services/serviceFactory', () => ({
  serviceFactory: {
    get: vi.fn(),
    setContext: vi.fn(),
    getServiceNames: vi.fn(() => ['userService'])
  }
}));

// Database mocking
vi.mock('../../src/utils/DatabaseService', () => ({
  DatabaseService: {
    getInstance: vi.fn(() => ({
      client: {
        $queryRaw: vi.fn(),
        user: {
          create: vi.fn(),
          findMany: vi.fn(),
          findUnique: vi.fn()
        }
      }
    }))
  }
}));
```

## 🚀 Performance Considerations

### 1. Action Optimization

```typescript
// Use caching for frequently accessed data
const cachedAction = async (input: any) => {
  const cacheKey = `action:${JSON.stringify(input)}`;

  // Check cache first
  const cached = await cache.get(cacheKey);
  if (cached) return cached;

  // Execute action
  const result = await actualAction(input);

  // Cache result
  await cache.set(cacheKey, result, 300); // 5 minutes

  return result;
};
```

### 2. Batch Operations

```typescript
// Support batch operations where possible
export const batchCreateUsersAction = async (input: { users: CreateUserInput[] }) => {
  const { parsedInput, ctx } = await adminProcedure
    .schema(z.object({ users: z.array(CreateUserSchema) }))
    .action(input);

  const results = await ctx.svc.get('userService').batchCreate(parsedInput.users);
  return results;
};
```

## 📚 Best Practices

### 1. Action Design

- ✅ **Always validate input** with comprehensive Zod schemas
- ✅ **Use proper authorization** procedures for each action
- ✅ **Handle errors gracefully** with consistent error responses
- ✅ **Include logging** for debugging and monitoring
- ✅ **Cache appropriately** to improve performance
- ✅ **Document thoroughly** with JSDoc comments

### 2. Testing

- ✅ **Test validation** with both valid and invalid inputs
- ✅ **Mock external dependencies** for unit tests
- ✅ **Use real database** for integration tests
- ✅ **Test error scenarios** and edge cases
- ✅ **Clean up test data** after each test
- ✅ **Use descriptive test names**

### 3. Security

- ✅ **Never trust client input** - always validate
- ✅ **Implement proper authorization** checks
- ✅ **Sanitize error messages** for production
- ✅ **Audit sensitive operations**
- ✅ **Use parameterized queries** to prevent SQL injection

## 🔧 Debugging Actions

### 1. Common Issues

```typescript
// 1. Service not registered
// Solution: Ensure service is registered in serviceFactory

// 2. Invalid input
// Solution: Check Zod schema validation

// 3. Database connection issues
// Solution: Verify DATABASE_URL and database setup

// 4. Permission denied
// Solution: Check user role and permissions
```

### 2. Debug Logging

```typescript
export const debugAction = async (input: any) => {
  const logger = new Logger('debugAction');

  logger.debug('Action input:', input);

  try {
    const { parsedInput, ctx } = await adminProcedure
      .schema(Schema)
      .action(input);

    logger.debug('Validated input:', parsedInput);

    const result = await ctx.svc.get('serviceName').method(parsedInput);
    logger.debug('Service result:', result);

    return result;
  } catch (error) {
    logger.error('Action failed:', error);
    throw error;
  }
};
```

## 📖 Conclusion

The Action pattern provides a robust, testable, and maintainable way to handle all external interactions with your system. By following these patterns and guidelines, you can build actions that are:

- **Secure** - Proper validation and authorization
- **Testable** - Clear separation of concerns
- **Maintainable** - Consistent patterns and documentation
- **Performant** - Optimized for production use
- **Reliable** - Comprehensive error handling

This pattern serves as the foundation for building scalable, enterprise applications with the Inter-Train architecture.