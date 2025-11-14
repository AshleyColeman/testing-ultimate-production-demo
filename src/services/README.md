# Services Directory

This directory contains service implementations following the Inter-Train three-tier architecture pattern.

## Pattern Overview

All services follow the same structure:

```
serviceName/
├── _data/                 # Provider and service layers
│   ├── serviceNameProvider.ts    # Database operations
│   ├── serviceNameService.ts     # Business logic
│   └── serviceNameSchema.ts      # Validation schemas
├── actions.ts            # Server actions
├── commands/             # CLI command handlers
│   ├── create.ts
│   ├── list.ts
│   ├── update.ts
│   └── delete.ts
└── index.ts              # CLI entry point
```

## Current Services

### Users Service (`users/`)

A complete example implementation demonstrating all patterns:

- **Provider**: Database operations for user CRUD
- **Service**: Business logic with validation and error handling
- **Actions**: Server actions with Zod validation
- **CLI**: Command-line interface for user management

#### Usage

```bash
# CLI Commands
npm run users:create -- --email=user@example.com --name="John Doe"
npm run users:list -- --page=1 --limit=20
npm run users:update -- --id=user_id --name="New Name"
npm run users:delete -- --id=user_id

# Server Actions
import { createUserAction, getUserByIdAction } from '@/services/users/actions';
```

## Creating New Services

Follow these steps to create a new service:

1. **Create Directory Structure**
```bash
mkdir src/services/yourService
mkdir src/services/yourService/_data
mkdir src/services/yourService/commands
```

2. **Create Provider** (`_data/yourServiceProvider.ts`)
```typescript
import { DatabaseService } from '@/utils/DatabaseService';
import type { ServerCtxType } from '@/lib/utils/types';

export function yourServiceProvider(serverCtx: ServerCtxType) {
  const db = DatabaseService.getInstance().client;

  async function getById(id: string) {
    // Database operation
  }

  return { getById, /* other operations */ };
}
```

3. **Create Service** (`_data/yourServiceService.ts`)
```typescript
import { yourServiceProvider } from './yourServiceProvider';
import type { ServerCtxType } from '@/lib/utils/types';

export function yourServiceService(serverCtx: ServerCtxType) {
  const _provider = yourServiceProvider(serverCtx);

  async function getById(id: string) {
    const rawResult = await _provider.getById(id);
    // Business logic and data transformation
    return transformedResult;
  }

  return { getById, /* other operations */ };
}
```

4. **Create Schema** (`_data/yourServiceSchema.ts`)
```typescript
import { z } from 'zod';

export const CreateSchema = z.object({
  // Validation rules
});

export const UpdateSchema = z.object({
  // Validation rules
});
```

5. **Create Actions** (`actions.ts`)
```typescript
'use server';

import { serviceFactory } from '@/lib/services/serviceFactory';
import { CreateSchema } from './_data/yourServiceSchema';

export const createAction = adminProcedure
  .schema(CreateSchema)
  .action(async ({ parsedInput, ctx }) => {
    const result = await ctx.svc.get('yourService').create(parsedInput);
    return result;
  });
```

6. **Create CLI Commands** (`commands/`)
- Create separate command files for each operation
- Follow the pattern in `users/commands/`

7. **Create CLI Entry Point** (`index.ts`)
```typescript
import { defineService, runService } from '@/lib/cli';

const commands = [
  {
    name: 'create',
    description: 'Create new item',
    handler: createCommand,
  },
  // ... other commands
];

const program = defineService('yourService', commands);
runService(program);
```

8. **Update package.json**
```json
{
  "scripts": {
    "yourService": "tsx src/services/yourService/index.ts",
    "yourService:create": "tsx src/services/yourService/index.ts create"
  }
}
```

## Best Practices

1. **Provider Layer**
   - Only database operations
   - No business logic
   - Use Prisma queries or raw SQL
   - Handle database-specific error cases

2. **Service Layer**
   - Implement business logic
   - Use providers for data access
   - Apply data transformation with mappers
   - Return structured responses

3. **Action Layer**
   - Use Zod schemas for validation
   - Implement authorization checks
   - Handle cache invalidation
   - Return user-friendly responses

4. **CLI Commands**
   - Parse command-line arguments
   - Provide helpful error messages
   - Use consistent logging
   - Handle cleanup properly

5. **General**
   - Always use TypeScript
   - Include comprehensive error handling
   - Add logging for debugging
   - Write tests for all layers
   - Follow naming conventions

## Dependencies

Services depend on:

- `@/lib/cli` - CLI framework
- `@/lib/services/serviceFactory` - Dependency injection
- `@/lib/utils/*` - Common utilities
- `@/utils/DatabaseService` - Database connection
- `@/utils/Logger` - Logging utility

## Testing

Test each layer independently:

1. **Provider Tests**: Mock database responses
2. **Service Tests**: Mock providers and test business logic
3. **Action Tests**: Mock services and test validation
4. **Integration Tests**: Test complete workflows
5. **CLI Tests**: Test command execution

Example test structure:
```typescript
// __tests__/services/users/userService.test.ts
import { userService } from '@/services/users/_data/userService';

describe('userService', () => {
  it('should create user successfully', async () => {
    // Test implementation
  });
});
```