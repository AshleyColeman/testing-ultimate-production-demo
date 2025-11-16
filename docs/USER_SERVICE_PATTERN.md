# User Service Pattern - Quick Reference

## New Pattern Overview

Your user service has been refactored to match production patterns. Here's what changed:

## 1. Actions Pattern (adminProcedure)

### OLD WAY ❌
```typescript
export const createUserAction = async (input: ActionInput<CreateUserInput>) => {
  const result = await adminProcedure.schema(CreateUserSchema).action(input);
  const { ctx } = result as any;
  return ctx.svc.get("userService").createUser(parsedInput);
};
```

### NEW WAY ✅
```typescript
export const createUserAction = adminProcedure
  .schema(CreateUserSchema)
  .action(async ({ ctx, parsedInput }) => {
    const result = await ctx.svc.createUser(parsedInput);
    return {
      result,
      message: 'Successfully created user',
    };
  });
```

### Benefits
- Cleaner syntax
- Automatic context management
- Type-safe schema validation
- No manual service factory calls

## 2. Type System

### OLD WAY ❌
```typescript
export interface CreateUserInput {
  email: string;
  name: string;
}
```

### NEW WAY ✅
```typescript
export type CreateUserInput = z.infer<typeof CreateUserSchema>;
```

### Benefits
- Single source of truth (schema)
- Automatic type derivation
- Always in sync with validation rules
- Less code to maintain

## 3. Service Functions

### Function Signatures
All service functions use `UserFiltersInput` for consistency:

```typescript
// Old parameter naming (mixed)
async function getAllUsers(pagination?: PaginationParams)
async function searchUsers(filters: FilterParams & PaginationParams)

// New parameter naming (consistent)
async function getAllUsers(filters: UserFiltersInput)
async function searchUsers(filters: UserFiltersInput)
```

### Usage
```typescript
const result = await userService(ctx).getAllUsers({
  page: 1,
  limit: 20,
  sortBy: 'createdAt',
  sortOrder: 'desc',
  search: 'optional'  // only in searchUsers
});
```

## 4. Context Flow

```
Actions (with adminProcedure)
    ↓ Creates ServerCtxType
UserService(serverCtx)
    ↓ Passes context
UserProvider(serverCtx)
    ↓ Uses db from context
Database
```

## Available Actions

```typescript
// Get a single user
const result = await getUserByIdAction(userId);

// Get all users with pagination
const result = await getAllUsersAction({
  page: 1,
  limit: 20,
  sortBy: 'createdAt',
  sortOrder: 'desc'
});

// Create user
const result = await createUserAction({
  email: 'user@example.com',
  name: 'John Doe'
});

// Update user
const result = await updateUserAction({
  id: 'usr_123',
  name: 'Jane Doe',
  isActive: true
});

// Delete user
const result = await deleteUserAction('usr_123');

// Search users
const result = await searchUsersAction({
  page: 1,
  limit: 20,
  sortBy: 'name',
  sortOrder: 'asc',
  search: 'john'
});
```

## Response Format

All actions return consistent response objects:

```typescript
// Success response
{
  result: {
    data: User[],           // For paginated responses
    success: true,
    pagination: {
      page: 1,
      limit: 20,
      total: 100,
      totalPages: 5,
      hasNext: true,
      hasPrev: false,
    }
  },
  message: 'Successfully created user'  // If applicable
}

// Error response
{
  result: {
    data: null,
    success: false,
    errors: ['Email already exists']
  }
}
```

## Testing Integration

For testing with mock databases:

```typescript
const mockDatabase = { client: mockPrismaClient };

const result = await createUserAction({
  email: 'test@example.com',
  name: 'Test User',
  database: mockDatabase  // Injected for testing
});
```

The `adminProcedure` automatically:
1. Validates input against schema
2. Extracts optional database for testing
3. Creates `ServerCtxType` with context
4. Initializes service with context
5. Passes database through to provider

## Files Modified

✅ `src/services/users/actions.ts` - Complete refactor
✅ `src/services/users/_data/userService.ts` - Type system updated
✅ `src/services/users/_data/userProvider.ts` - Documentation improved
✅ `src/services/users/commands/listUsers.ts` - Updated to new API

## TypeScript Compilation

All files compile successfully:
```bash
yarn tsc --noEmit  # ✅ Done in 1.24s
```

## Pattern Consistency

Your user service now follows the **same pattern** as your production code:
- ✅ Procedure-based actions
- ✅ Schema-derived types
- ✅ Context-based DI
- ✅ Provider layer isolation
- ✅ Test-friendly architecture

You're production-ready! 🚀
