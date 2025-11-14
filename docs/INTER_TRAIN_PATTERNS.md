# Inter-Train Architecture Patterns

This document outlines the Inter-Train architecture patterns that have been ported to the testing-ultimate-production-demo project.

## Overview

The Inter-Train project follows a consistent three-tier architecture pattern for all backend operations:

1. **Provider Layer** - Pure database operations
2. **Service Layer** - Business logic and orchestration
3. **Action Layer** - Server actions with validation and authorization

## Directory Structure

```
src/
├── lib/
│   ├── cli/                 # CLI framework for services
│   ├── services/            # Service factory pattern
│   └── utils/               # Common utilities (types, validation, mappers)
├── services/
│   └── users/               # Example service implementation
│       ├── _data/           # Provider and service layers
│       │   ├── userProvider.ts
│       │   ├── userService.ts
│       │   └── userSchema.ts
│       ├── actions.ts       # Server actions
│       ├── commands/        # CLI command handlers
│       └── index.ts         # Service CLI entry point
```

## Core Patterns

### 1. Provider Pattern

**Purpose**: Pure database operations without business logic.

**Example** (`userProvider.ts`):
```typescript
export function userProvider(serverCtx: ServerCtxType) {
  async function getUserById(userId: string) {
    const result = await db.$queryRaw<Array<any>>`
      SELECT * FROM users WHERE id = ${userId} LIMIT 1
    `;
    return result?.[0] || null;
  }

  return { getUserById, /* ... other database operations */ };
}
```

**Rules**:
- Only database operations (Prisma queries)
- No business logic or validation
- Takes server context for multi-tenancy
- Returns raw database results

### 2. Service Pattern

**Purpose**: Business logic layer that orchestrates providers.

**Example** (`userService.ts`):
```typescript
export function userService(serverCtx: ServerCtxType) {
  const _provider = userProvider(serverCtx);

  async function getUserById(userId: string): Promise<User | null> {
    const rawResult = await _provider.getUserById(userId);
    if (!rawResult) return null;

    const result = baseEntityMapper(rawResult, { formatDate: true }) as User;
    return result;
  }

  return { getUserById, /* ... other business operations */ };
}
```

**Rules**:
- Orchestrates one or more providers
- Implements business logic and validation
- Handles data transformation with mappers
- Returns structured responses with success/error states

### 3. Action Pattern

**Purpose**: Server actions with validation and authorization.

**Example** (`actions.ts`):
```typescript
export const createUserAction = adminProcedure
  .schema(CreateUserSchema)
  .action(async ({ parsedInput, ctx }) => {
    const result = await ctx.svc.get('userService').createUser(parsedInput);

    if (result.success) {
      revalidatePath('/users', 'layout');
    }

    return result;
  });
```

**Rules**:
- Uses Zod schemas for validation
- Implements authorization procedures
- Integrates with service factory
- Handles cache invalidation with revalidatePath

### 4. CLI Service Pattern

**Purpose**: Command-line interface for background tasks and administration.

**Example** (`index.ts`):
```typescript
const commands = [
  {
    name: 'create',
    description: 'Create a new user',
    handler: createUserCommand,
  },
  // ... other commands
];

const program = defineService('users', commands);
runService(program);
```

**Rules**:
- Uses Commander.js for CLI framework
- Implements proper error handling and logging
- Automatically manages database connections
- Provides structured command responses

### 5. Service Factory Pattern

**Purpose**: Dependency injection and service management.

**Example** (`serviceFactory.ts`):
```typescript
const serverCtx: ServerCtxType = { accountUserId: 1, userRole: 'admin' };
serviceFactory.setContext(serverCtx);
const userService = serviceFactory.get('userService');
```

**Rules**:
- Manages service lifecycle and dependencies
- Provides consistent context injection
- Supports service registration and retrieval
- Enables easy testing with mock services

## Usage Examples

### CLI Commands

```bash
# Create a new user
npm run users:create -- --email=user@example.com --name="John Doe"

# List all users
npm run users:list -- --page=1 --limit=20

# Update a user
npm run users:update -- --id=user_id --name="New Name" --active=true

# Delete a user
npm run users:delete -- --id=user_id
```

### Server Actions

```typescript
import { createUserAction, getUserByIdAction } from '@/services/users/actions';

// Create user
const result = await createUserAction({ email: 'test@example.com', name: 'Test User' });

// Get user
const user = await getUserByIdAction({ userId: 'user_id' });
```

### Service Factory

```typescript
import { serviceFactory } from '@/lib/services/serviceFactory';
import { userService } from '@/services/users/_data/userService';

// Register service
serviceFactory.register('userService', userService);

// Use service
const userSvc = serviceFactory.get('userService');
const users = await userSvc.getAllUsers({ page: 1, limit: 20 });
```

## Benefits

1. **Consistency**: All services follow the same three-tier pattern
2. **Testability**: Clear separation of concerns enables easy unit testing
3. **Maintainability**: Standardized structure makes code easy to understand
4. **Scalability**: Service factory supports complex dependency injection
5. **CLI Integration**: Built-in command-line tools for administration
6. **Type Safety**: Full TypeScript integration with Zod validation

## Migration Guide

To migrate existing code to the Inter-Train pattern:

1. **Create Provider**: Extract database operations into a provider file
2. **Create Service**: Build business logic layer that uses the provider
3. **Create Actions**: Add server actions with validation and authorization
4. **Register Services**: Use the service factory for dependency injection
5. **Add CLI**: Create command-line interface for administration tasks

## Testing

The patterns are designed for easy testing:

- **Providers**: Mock database responses
- **Services**: Mock providers and test business logic
- **Actions**: Mock services and test validation/authorization
- **CLI**: Test command execution with mocked dependencies