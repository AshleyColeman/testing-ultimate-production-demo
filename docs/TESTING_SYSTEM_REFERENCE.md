# Testing System Reference Guide

## 🎯 Purpose

This document provides the **testing system** with everything it needs to understand, test, and validate the Action pattern implementation. It serves as the authoritative reference for automated testing agents.

## 📁 File Locations

```
testing-ultimate-production-demo/
├── src/
│   ├── services/
│   │   └── users/
│   │       ├── actions.ts              # ← MAIN FILE TO TEST
│   │       ├── _data/
│   │       │   ├── userProvider.ts     # Database layer
│   │       │   ├── userService.ts      # Business logic
│   │       │   └── userSchema.ts       # Validation schemas
│   │       └── commands/               # CLI commands
│   ├── lib/
│   │   ├── cli/index.ts                # CLI framework
│   │   ├── services/serviceFactory.ts  # Dependency injection
│   │   └── utils/                      # Utilities
│   └── utils/
│       ├── DatabaseService.ts          # Database management
│       └── Logger.ts                   # Logging
├── docs/
│   ├── ACTION_PATTERN_GUIDE.md         # Complete pattern guide
│   └── TESTING_SYSTEM_REFERENCE.md     # This file
└── package.json                        # Dependencies and scripts
```

## 🎯 Primary Target: `src/services/users/actions.ts`

This is the **main file** the testing system should focus on. It contains all the action implementations for user management.

### Current Actions Available

```typescript
// In src/services/users/actions.ts

export const createUserAction = async (input: any) => {
  // Creates a new user
  // Input: { email: string, name: string }
  // Output: ServiceResponse<User>
};

export const getUserByIdAction = async (input: any) => {
  // Gets user by ID
  // Input: { userId: string }
  // Output: { data: User | null, success: boolean }
};

export const getAllUsersAction = async (input: any) => {
  // Lists all users with pagination
  // Input: { page?: number, limit?: number }
  // Output: PaginatedResponse<User>
};

export const updateUserAction = async (input: any) => {
  // Updates user information
  // Input: { id: string, name?: string, isActive?: boolean }
  // Output: ServiceResponse<User>
};

export const deleteUserAction = async (input: any) => {
  // Deletes a user
  // Input: { userId: string }
  // Output: ServiceResponse<number>
};

export const searchUsersAction = async (input: any) => {
  // Searches users
  // Input: { search?: string, page?: number, limit?: number }
  // Output: PaginatedResponse<User>
};
```

## 🔧 Testing Requirements

### 1. Database Setup

**Required Table:**
```sql
CREATE TABLE users (
  id VARCHAR(255) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);
```

**Environment Variables:**
```bash
DATABASE_URL="postgresql://user:password@localhost:5432/test_db"
LOG_LEVEL="debug"
NODE_ENV="test"
```

### 2. Dependencies

```json
{
  "dependencies": {
    "commander": "^12.0.0",
    "zod": "^3.22.0",
    "winston": "^3.11.0",
    "@prisma/client": "^5.11.0"
  }
}
```

### 3. Import Paths for Testing

```typescript
// Main actions file
import {
  createUserAction,
  getUserByIdAction,
  getAllUsersAction,
  updateUserAction,
  deleteUserAction,
  searchUsersAction
} from './src/services/users/actions';

// Utilities for testing
import { serviceFactory } from './src/lib/services/serviceFactory';
import { DatabaseService } from './src/utils/DatabaseService';
import { Logger } from './src/utils/Logger';

// Types
import type { User, CreateUserInput, UpdateUserInput } from './src/services/users/_data/userService';
import type { ServerCtxType } from './src/lib/utils/types';
```

## 🧪 Testing Scenarios

### 1. Basic Action Testing

```typescript
// Test 1: Create User
const createResult = await createUserAction({
  email: 'test@example.com',
  name: 'Test User'
});

// Expected:
{
  data: {
    id: string,
    email: 'test@example.com',
    name: 'Test User',
    isActive: true,
    createdAt: string,
    updatedAt: string
  },
  success: true,
  message: 'User created successfully'
}
```

### 2. Validation Testing

```typescript
// Test 2: Invalid Email
const invalidResult = await createUserAction({
  email: 'invalid-email',
  name: 'Test'
});

// Expected:
{
  data: null,
  success: false,
  errors: ['Invalid email format']
}

// Test 3: Missing Required Fields
const missingResult = await createUserAction({
  email: 'test@example.com'
  // name is missing
});

// Expected:
{
  data: null,
  success: false,
  errors: ['Name is required']
}
```

### 3. Business Logic Testing

```typescript
// Test 4: Duplicate Email
await createUserAction({
  email: 'duplicate@test.com',
  name: 'First User'
});

const duplicateResult = await createUserAction({
  email: 'duplicate@test.com',
  name: 'Second User'
});

// Expected:
{
  data: null,
  success: false,
  errors: ['User with email duplicate@test.com already exists']
}
```

### 4. CRUD Operations Testing

```typescript
// Test 5: Full CRUD Flow
// 1. Create
const user = await createUserAction({ email: 'crud@test.com', name: 'CRUD Test' });

// 2. Read
const retrieved = await getUserByIdAction({ userId: user.data.id });

// 3. Update
const updated = await updateUserAction({
  id: user.data.id,
  name: 'Updated Name',
  isActive: false
});

// 4. List
const listed = await getAllUsersAction({ page: 1, limit: 10 });

// 5. Delete
const deleted = await deleteUserAction({ userId: user.data.id });
```

## 🔍 Testing Checklist

### ✅ Validation Testing

- [ ] Test valid email formats
- [ ] Test invalid email formats
- [ ] Test missing required fields
- [ ] Test field length constraints
- [ ] Test field type validation

### ✅ Business Logic Testing

- [ ] Test duplicate email prevention
- [ ] Test user creation with valid data
- [ ] Test user retrieval by ID
- [ ] Test user updates (partial and full)
- [ ] Test user deletion
- [ ] Test user listing with pagination
- [ ] Test user search functionality

### ✅ Error Handling Testing

- [ ] Test database connection errors
- [ ] Test malformed input data
- [ ] Test non-existent user operations
- [ ] Test permission errors (if applicable)
- [ ] Test system timeout scenarios

### ✅ Integration Testing

- [ ] Test action → service → provider flow
- [ ] Test database transaction rollback on errors
- [ ] Test concurrent action execution
- [ ] Test action performance under load

## 🛠️ Mock Requirements

### 1. Service Factory Mock

```typescript
// Mock service factory for unit tests
vi.mock('./src/lib/services/serviceFactory', () => ({
  serviceFactory: {
    get: vi.fn(),
    setContext: vi.fn(),
    getServiceNames: vi.fn(() => ['userService']),
    register: vi.fn()
  }
}));
```

### 2. Database Service Mock

```typescript
// Mock database service for unit tests
vi.mock('./src/utils/DatabaseService', () => ({
  DatabaseService: {
    getInstance: vi.fn(() => ({
      client: {
        $queryRaw: vi.fn(),
        $transaction: vi.fn()
      },
      connect: vi.fn(),
      disconnect: vi.fn()
    }))
  }
}));
```

### 3. Logger Mock

```typescript
// Mock logger for clean test output
vi.mock('./src/utils/Logger', () => ({
  Logger: vi.fn(() => ({
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn()
  }))
}));
```

## 📊 Expected Test Coverage

### Minimum Required Tests

1. **Validation Tests** (6 tests)
   - Valid email format
   - Invalid email format
   - Missing email
   - Missing name
   - Name too long
   - Valid complete input

2. **CRUD Tests** (10 tests)
   - Create user success
   - Create user duplicate email
   - Get user by ID success
   - Get user by ID not found
   - Update user success
   - Update user not found
   - Delete user success
   - Delete user not found
   - List users success
   - Search users success

3. **Error Tests** (4 tests)
   - Database connection error
   - Malformed input
   - Service factory not initialized
   - Network timeout

4. **Integration Tests** (3 tests)
   - Full CRUD workflow
   - Pagination handling
   - Search functionality

**Total Minimum Tests: 23**

### Performance Tests

```typescript
// Performance benchmarks
const performanceTests = {
  create_user: '< 100ms',
  get_user: '< 50ms',
  list_users: '< 200ms',
  update_user: '< 100ms',
  delete_user: '< 50ms'
};
```

## 🚨 Common Pitfalls

### 1. Database State

**Issue:** Tests leaving data in database
**Solution:** Always clean up after tests

```typescript
afterEach(async () => {
  await DatabaseService.getInstance().client.users.deleteMany();
});
```

### 2. Async/Await

**Issue:** Missing await in tests
**Solution:** Always await action calls

```typescript
// Wrong
const result = createUserAction({ email: 'test@test.com', name: 'Test' });

// Right
const result = await createUserAction({ email: 'test@test.com', name: 'Test' });
```

### 3. Mock Reset

**Issue:** Mocks not reset between tests
**Solution:** Reset mocks in beforeEach

```typescript
beforeEach(() => {
  vi.clearAllMocks();
});
```

## 📋 Test Execution Order

### Recommended Test Sequence

1. **Setup Tests** - Database connection, service initialization
2. **Validation Tests** - Input validation without database
3. **Unit Tests** - Individual actions with mocked dependencies
4. **Integration Tests** - Full stack with real database
5. **Performance Tests** - Load and timing tests
6. **Cleanup Tests** - Verify no data leakage

## 🔧 Debug Mode

### Enable Debug Logging

```typescript
// Set log level to debug
process.env.LOG_LEVEL = 'debug';

// Actions will output detailed logs
const result = await createUserAction({
  email: 'debug@test.com',
  name: 'Debug Test'
});
// Console will show full execution trace
```

### Database Query Inspection

```typescript
// Monitor database queries
const db = DatabaseService.getInstance().client;
const originalQueryRaw = db.$queryRaw;

db.$queryRaw = async (...args) => {
  console.log('DB Query:', args[0]);
  return originalQueryRaw.apply(db, args);
};
```

## ✅ Success Criteria

### Tests Pass When

1. ✅ All validation schemas work correctly
2. ✅ All CRUD operations complete successfully
3. ✅ Error handling works as expected
4. ✅ Database transactions are atomic
5. ✅ Service factory integration works
6. ✅ Performance benchmarks are met
7. ✅ No memory leaks or resource issues
8. ✅ Logs are appropriate and helpful

### Code Quality Checklist

- [ ] No TypeScript compilation errors
- [ ] All tests pass without warnings
- [ ] Code coverage > 90%
- [ ] No console errors in production mode
- [ ] Proper error handling throughout
- [ ] Consistent response formats
- [ ] Comprehensive logging

---

## 🎯 Summary for Testing System

**Primary Target:** `src/services/users/actions.ts`

**Key Files to Test:**
- Actions: `actions.ts`
- Services: `_data/userService.ts`
- Providers: `_data/userProvider.ts`
- Schemas: `_data/userSchema.ts`
- Factory: `lib/services/serviceFactory.ts`

**Testing Focus:**
1. Input validation with Zod schemas
2. Business logic execution
3. Database operations
4. Error handling
5. Performance characteristics

**Success Metrics:**
- All actions return proper responses
- Validation prevents invalid data
- Database operations are atomic
- Errors are handled gracefully
- Performance meets requirements

This reference provides everything needed to comprehensively test the Action pattern implementation.