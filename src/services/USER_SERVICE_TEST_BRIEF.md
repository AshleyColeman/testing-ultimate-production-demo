# Integration Test Agent - UserService Test Brief

## Overview

Generate a comprehensive integration test suite for `UserService` using the Integration Test Agent framework.

**Service Location**: `src/services/UserService.ts`
**Service Type**: User management with CRUD operations
**Database**: PostgreSQL
**Target Tests**: 10 tests covering all operations and error cases

## Test Coverage Requirements

### Happy Path Tests (6-7 tests)

- ✅ **Test 1**: Create user successfully
- ✅ **Test 2**: Get user by ID
- ✅ **Test 3**: Get user by email
- ✅ **Test 4**: Get all users
- ✅ **Test 5**: Update user (name)
- ✅ **Test 6**: Update user (isActive status)
- ✅ **Test 7**: Delete user successfully

### Error Case Tests (3-4 tests)

- ✅ **Test 8**: Create user with duplicate email (should fail)
- ✅ **Test 9**: Create user with invalid email format (should fail)
- ✅ **Test 10**: Get non-existent user (should return null)
- ⚠️ **Test 11**: Update non-existent user (should fail)

## What Tests Should Verify

### For Each Test:

1. **Function Behavior**

   - Does the method work as expected?
   - Does it return correct data type?
   - Is the returned data valid?

2. **Database Impact**

   - Are records actually created in the database?
   - Are records actually updated?
   - Are records actually deleted?

3. **Error Handling**

   - Does it throw errors when it should?
   - Are error messages clear and helpful?
   - Does it handle missing inputs?

4. **Logging**

   - Are operations logged (check Logger)?
   - Do logs show success/failure?
   - Do logs show operation timing?

5. **Data Validation**
   - Are timestamps created correctly?
   - Are IDs generated properly?
   - Are defaults applied (isActive=true)?

## Test Structure Template

Each test should follow this pattern:

```typescript
describe("UserService", () => {
  let infra: Infrastructure;
  let userService: UserService;

  beforeAll(async () => {
    infra = await getInfrastructure();
    userService = new UserService();
    await databaseService.connect();
  });

  it("[Test 1/10] should create a user with valid email and name", async () => {
    // Setup
    const input = {
      email: "test@example.com",
      name: "Test User",
    };

    // Execute
    const result = await userService.createUser(input);

    // Assert
    expect(result.email).toBe(input.email);
    expect(result.name).toBe(input.name);
    expect(result.isActive).toBe(true);
    expect(result.id).toBeDefined();
    expect(result.createdAt).toBeDefined();

    // Verify in database
    const fromDb = await userService.getUserById(result.id);
    expect(fromDb).not.toBeNull();
    expect(fromDb?.email).toBe(input.email);

    // Record metrics
    recordTestExecution({
      testName: "Create User",
      service: "UserService",
      success: true,
      duration: Date.now() - startTime,
    });
  });

  afterAll(async () => {
    await userService.deleteAllUsers();
    await databaseService.disconnect();
  });
});
```

## Methods to Test

| Method             | Inputs        | Expected Output | Error Cases                    |
| ------------------ | ------------- | --------------- | ------------------------------ |
| `createUser()`     | email, name   | User object     | Invalid email, duplicate email |
| `getUserById()`    | userId        | User \| null    | N/A                            |
| `getUserByEmail()` | email         | User \| null    | N/A                            |
| `getAllUsers()`    | none          | User[]          | N/A                            |
| `updateUser()`     | userId, input | User            | User not found                 |
| `deleteUser()`     | userId        | 0 or 1          | N/A                            |
| `getUserCount()`   | none          | number          | N/A                            |
| `deleteAllUsers()` | none          | 0               | N/A (cleanup)                  |

## Key Test Patterns

### 1. **Verify Database Changes**

```typescript
// Create user
const user = await userService.createUser({...});

// Verify it's in database
const fromDb = await userService.getUserById(user.id);
expect(fromDb).not.toBeNull();
```

### 2. **Test Error Cases**

```typescript
// Should throw on duplicate email
await expect(
  userService.createUser({ email: "test@example.com", name: "User 1" })
).rejects.toThrow("already exists");
```

### 3. **Test Null/Empty Cases**

```typescript
// Non-existent user should return null
const result = await userService.getUserById("non-existent-id");
expect(result).toBeNull();
```

### 4. **Verify Timestamps**

```typescript
// Should have correct timestamps
const user = await userService.createUser({...});
expect(user.createdAt).toBeInstanceOf(Date);
expect(user.updatedAt).toBeInstanceOf(Date);
```

### 5. **Measure Performance**

```typescript
// Log operation duration
const startTime = Date.now();
await userService.createUser({...});
const duration = Date.now() - startTime;
recordTestExecution({
  testName: "Create User",
  duration: duration
});
```

## Integration Test Agent Instructions

**Use the following skills in this order:**

1. **access-infrastructure** - Get the shared database infrastructure singleton
2. **place-test-file** - File goes in `src/__tests__/microservices/user-service.test.ts`
3. **select-schema** - Use random schema from shared infrastructure
4. **perform-crud-operations** - Test all 8 UserService methods
5. **generate-test-data** - Create realistic test users
6. **include-realistic-delays** - Add realistic timing measurements
7. **test-error-scenarios** - Test duplicate emails, invalid inputs, not found
8. **test-multi-service-flows** - Optional: test userService + other services
9. **record-test-metrics** - Log execution time and results
10. **verify-test-quality** - Validate test file quality before completion

## Success Criteria

Generated tests are successful when:

✅ All 10 tests pass
✅ Each test is clearly named with [Test X/10]
✅ Tests use `getInfrastructure()` for database access
✅ Tests verify both return values AND database state
✅ Tests include error case coverage
✅ Tests measure execution duration
✅ Tests are placed in correct location
✅ No console errors or warnings
✅ All CRUD operations tested
✅ File is auto-discovered and runs in test suite

## Database Setup

Tests should create the users table if it doesn't exist:

```typescript
beforeAll(async () => {
  // Create users table
  await databaseService.client.$queryRaw`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(255) PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      name VARCHAR(255) NOT NULL,
      "isActive" BOOLEAN NOT NULL DEFAULT true,
      "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
});
```

## Notes for Agent

- ✅ UserService is simple - good for proof of concept
- ✅ All methods are async - use await
- ✅ All methods throw on error - use try/catch or expect().rejects
- ✅ Service uses DatabaseService under the hood
- ✅ Timestamps are automatically created by database
- ✅ IDs are generated with format: `usr_[timestamp]_[random]`
- ✅ Email validation is built-in (regex pattern)
- ✅ Duplicate emails should throw error
- ✅ deleteAllUsers() is for cleanup, not for production

## Ready to Generate?

This test suite will demonstrate:

- ✅ Agent can understand complex services
- ✅ Agent generates production-ready tests
- ✅ Agent handles both happy and error paths
- ✅ Agent uses integration test framework correctly
- ✅ Agent creates comprehensive coverage

**Go ahead and generate the test file!**

---

**Test File Location**: `src/__tests__/microservices/user-service.test.ts`
**Expected Tests**: 10 tests, all passing
**Estimated Duration**: 30-40 seconds execution time
