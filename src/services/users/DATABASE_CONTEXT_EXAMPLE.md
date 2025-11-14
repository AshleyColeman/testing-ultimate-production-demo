# Database Context Passing Example

This document demonstrates how the database context is passed from the action layer through to the provider layer.

## Architecture Flow

```
Action Layer (actions.ts)
    ↓ passes database through ServerCtxType
Service Layer (userService.ts)
    ↓ passes entire serverCtx to provider
Provider Layer (userProvider.ts)
    ↓ uses passed database or default
Database Operations
```

## Usage Examples

### 1. Production Usage (Default Database)
```typescript
// No database parameter - uses DatabaseService.getInstance()
const result = await createUserAction({
  email: 'user@example.com',
  name: 'John Doe'
});
```

### 2. Test Usage (Injected Database)
```typescript
// Pass test database through action
const mockDatabase = {
  client: {
    $queryRaw: vi.fn(),
    $queryRawUnsafe: vi.fn(),
  }
};

const result = await createUserAction({
  email: 'test@example.com',
  name: 'Test User',
  database: mockDatabase // Database injected for testing
});
```

## Implementation Details

### Action Layer Changes
- Accepts optional `database` parameter in input
- Extracts database from `parsedInput.database`
- Passes it through `ServerCtxType.database`
- Uses `.passthrough()` on Zod schemas to allow additional properties

### Service Layer Changes
- No changes needed - passes entire `serverCtx` to provider
- Database flows through automatically

### Provider Layer Changes
- Uses `serverCtx.database?.client` if provided
- Falls back to `DatabaseService.getInstance().client` if no database passed
- Seamless testing support without breaking production

## Benefits

✅ **Test Isolation**: Each test can use its own database instance
✅ **Production Safety**: Default behavior unchanged
✅ **Clean Architecture**: Database injection follows existing patterns
✅ **Type Safety**: Proper TypeScript typing throughout

## Testing Strategy

1. **Unit Tests**: Mock database and pass through actions
2. **Integration Tests**: Use test database instance
3. **Production**: No database passed - uses default singleton

This pattern enables proper dependency injection while maintaining backward compatibility.