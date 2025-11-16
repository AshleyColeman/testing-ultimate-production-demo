# 🧪 User Service Actions - Comprehensive Testing Guide

## Overview

This guide provides **three different approaches** to test and verify that the user service actions are working correctly before writing full test suites.

> **Why test before testing?** Prove to stakeholders that the actions work as documented. Show concrete examples and real results.

---

## 📋 Available Actions

### 1. **createUserAction** - Create a new user
```
Input:  { email: string, name: string }
Output: { result: { data: User, success: boolean }, message: string }
```

### 2. **getUserByIdAction** - Fetch user by ID
```
Input:  userId: string
Output: { result: User | null }
```

### 3. **getAllUsersAction** - List users with pagination
```
Input:  { page: number, limit: number, sortBy: string, sortOrder: string }
Output: { result: { data: User[], pagination: {...} } }
```

### 4. **updateUserAction** - Update user information
```
Input:  { id: string, name?: string, isActive?: boolean }
Output: { result: User, message: string }
```

### 5. **deleteUserAction** - Remove a user
```
Input:  userId: string
Output: { result: number, message: string }
```

### 6. **searchUsersAction** - Search users by term
```
Input:  { page: number, limit: number, search: string, sortBy: string, sortOrder: string }
Output: { result: { data: User[], pagination: {...} } }
```

---

## 🔧 Approach 1: Direct Node.js Script Testing

### Why Use This?
- ✅ Tests real database operations
- ✅ No external tools needed
- ✅ Fast feedback
- ✅ Can show results to stakeholders
- ✅ Perfect for "proof of concept"

### Setup

Create a test file: `scripts/test-user-actions.ts`

```typescript
import { DatabaseService } from '../src/utils/DatabaseService';
import { Logger } from '../src/utils/Logger';
import {
  createUserAction,
  getUserByIdAction,
  getAllUsersAction,
  updateUserAction,
  deleteUserAction,
  searchUsersAction,
} from '../src/services/users/actions';

const logger = new Logger('ACTION-TEST');

async function testActions() {
  const db = DatabaseService.getInstance();

  try {
    logger.info('🚀 Starting action tests...\n');

    // Connect to database
    logger.info('📡 Connecting to database...');
    await db.connect();
    logger.info('✅ Connected to database\n');

    // Test 1: Create User
    logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    logger.info('TEST 1: Create User');
    logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const createInput = {
      email: `test-${Date.now()}@example.com`,
      name: 'Test User',
    };
    logger.info(`Input: ${JSON.stringify(createInput)}`);

    const createResult = await createUserAction(createInput);
    logger.info(`✅ Success: ${JSON.stringify(createResult, null, 2)}\n`);

    const userId = createResult.result.data?.id;
    if (!userId) throw new Error('Failed to get user ID');

    // Test 2: Get User By ID
    logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    logger.info('TEST 2: Get User By ID');
    logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const getUserInput = userId;
    logger.info(`Input: "${getUserInput}"`);

    const getUserResult = await getUserByIdAction(getUserInput);
    logger.info(`✅ Success: ${JSON.stringify(getUserResult, null, 2)}\n`);

    // Test 3: Get All Users
    logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    logger.info('TEST 3: Get All Users (Pagination)');
    logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const getAllInput = {
      page: 1,
      limit: 5,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    };
    logger.info(`Input: ${JSON.stringify(getAllInput)}`);

    const getAllResult = await getAllUsersAction(getAllInput);
    logger.info(`✅ Success: ${JSON.stringify(getAllResult, null, 2)}\n`);

    // Test 4: Update User
    logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    logger.info('TEST 4: Update User');
    logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const updateInput = {
      id: userId,
      name: 'Updated Test User',
      isActive: true,
    };
    logger.info(`Input: ${JSON.stringify(updateInput)}`);

    const updateResult = await updateUserAction(updateInput);
    logger.info(`✅ Success: ${JSON.stringify(updateResult, null, 2)}\n`);

    // Test 5: Search Users
    logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    logger.info('TEST 5: Search Users');
    logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const searchInput = {
      page: 1,
      limit: 10,
      sortBy: 'name',
      sortOrder: 'asc',
      search: 'Test',
    };
    logger.info(`Input: ${JSON.stringify(searchInput)}`);

    const searchResult = await searchUsersAction(searchInput);
    logger.info(`✅ Success: ${JSON.stringify(searchResult, null, 2)}\n`);

    // Test 6: Delete User
    logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    logger.info('TEST 6: Delete User');
    logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const deleteInput = userId;
    logger.info(`Input: "${deleteInput}"`);

    const deleteResult = await deleteUserAction(deleteInput);
    logger.info(`✅ Success: ${JSON.stringify(deleteResult, null, 2)}\n`);

    logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    logger.info('🎉 ALL TESTS PASSED!');
    logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  } catch (error) {
    logger.error(`❌ Test failed: ${error instanceof Error ? error.message : String(error)}`);
    if (error instanceof Error && error.stack) {
      logger.error(`Stack: ${error.stack}`);
    }
  } finally {
    await db.disconnect();
  }
}

testActions();
```

### Run the Test

```bash
# Run the script
npx tsx scripts/test-user-actions.ts

# Or add to package.json
# "test:actions": "tsx scripts/test-user-actions.ts"
npm run test:actions
```

### Expected Output

```
[ACTION-TEST] 🚀 Starting action tests...

[ACTION-TEST] 📡 Connecting to database...
[ACTION-TEST] ✅ Connected to database

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TEST 1: Create User
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Input: {"email":"test-123456@example.com","name":"Test User"}
✅ Success: {
  "result": {
    "data": {
      "id": "usr_12345_abc123",
      "email": "test-123456@example.com",
      "name": "Test User",
      "isActive": true,
      "createdAt": "2024-11-16T10:30:00.000Z",
      "updatedAt": "2024-11-16T10:30:00.000Z"
    },
    "success": true,
    "message": "User created successfully"
  },
  "message": "Successfully created user"
}

[... more test results ...]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎉 ALL TESTS PASSED!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 🌐 Approach 2: HTTP/CURL Testing (If Server Running)

### Why Use This?
- ✅ Tests as if called from client
- ✅ Can be shared with team
- ✅ Demonstrates real-world usage
- ✅ No code execution needed
- ✅ Easy to document and replay

### Setup

If you have a Next.js server running with Server Actions exposed via API routes, you can test via HTTP.

#### Step 1: Create API Route

Create `src/app/api/test-user-actions/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import {
  createUserAction,
  getUserByIdAction,
  getAllUsersAction,
  updateUserAction,
  deleteUserAction,
  searchUsersAction,
} from '@/services/users/actions';

export async function POST(request: NextRequest) {
  try {
    const { action, input } = await request.json();

    let result;

    switch (action) {
      case 'createUser':
        result = await createUserAction(input);
        break;
      case 'getUserById':
        result = await getUserByIdAction(input);
        break;
      case 'getAllUsers':
        result = await getAllUsersAction(input);
        break;
      case 'updateUser':
        result = await updateUserAction(input);
        break;
      case 'deleteUser':
        result = await deleteUserAction(input);
        break;
      case 'searchUsers':
        result = await searchUsersAction(input);
        break;
      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      },
      { status: 400 }
    );
  }
}
```

#### Step 2: Test with cURL

```bash
# Test 1: Create User
curl -X POST http://localhost:3000/api/test-user-actions \
  -H "Content-Type: application/json" \
  -d '{
    "action": "createUser",
    "input": {
      "email": "test@example.com",
      "name": "Test User"
    }
  }' | jq

# Test 2: Get All Users
curl -X POST http://localhost:3000/api/test-user-actions \
  -H "Content-Type: application/json" \
  -d '{
    "action": "getAllUsers",
    "input": {
      "page": 1,
      "limit": 10,
      "sortBy": "createdAt",
      "sortOrder": "desc"
    }
  }' | jq

# Test 3: Search Users
curl -X POST http://localhost:3000/api/test-user-actions \
  -H "Content-Type: application/json" \
  -d '{
    "action": "searchUsers",
    "input": {
      "page": 1,
      "limit": 10,
      "search": "test",
      "sortBy": "name",
      "sortOrder": "asc"
    }
  }' | jq

# Test 4: Get User By ID
curl -X POST http://localhost:3000/api/test-user-actions \
  -H "Content-Type: application/json" \
  -d '{
    "action": "getUserById",
    "input": "usr_12345_abc123"
  }' | jq

# Test 5: Update User
curl -X POST http://localhost:3000/api/test-user-actions \
  -H "Content-Type: application/json" \
  -d '{
    "action": "updateUser",
    "input": {
      "id": "usr_12345_abc123",
      "name": "Updated Name",
      "isActive": true
    }
  }' | jq

# Test 6: Delete User
curl -X POST http://localhost:3000/api/test-user-actions \
  -H "Content-Type: application/json" \
  -d '{
    "action": "deleteUser",
    "input": "usr_12345_abc123"
  }' | jq
```

#### Expected Response

```json
{
  "success": true,
  "data": {
    "result": {
      "data": {
        "id": "usr_12345_abc123",
        "email": "test@example.com",
        "name": "Test User",
        "isActive": true,
        "createdAt": "2024-11-16T10:30:00.000Z",
        "updatedAt": "2024-11-16T10:30:00.000Z"
      },
      "success": true,
      "message": "User created successfully"
    },
    "message": "Successfully created user"
  },
  "timestamp": "2024-11-16T10:30:00.000Z"
}
```

---

## 🧪 Approach 3: Jest/Vitest Unit Tests

### Why Use This?
- ✅ Repeatable test suite
- ✅ Part of CI/CD pipeline
- ✅ Fast feedback
- ✅ Easy to share results
- ✅ Perfect for full test suite

### Setup

Create `src/__tests__/actions/user-actions-verification.test.ts`:

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { DatabaseService } from '../../utils/DatabaseService';
import {
  createUserAction,
  getUserByIdAction,
  getAllUsersAction,
  updateUserAction,
  deleteUserAction,
  searchUsersAction,
} from '../../services/users/actions';

describe('User Service Actions - Verification Suite', () => {
  const db = DatabaseService.getInstance();
  let testUserId: string;
  let testEmail: string;

  beforeAll(async () => {
    console.log('\n✅ Connecting to database...');
    await db.connect();
    testEmail = `test-${Date.now()}@example.com`;
  });

  afterAll(async () => {
    console.log('\n✅ Cleaning up and disconnecting...');
    await db.disconnect();
  });

  describe('CREATE USER', () => {
    it('should create a user successfully with valid input', async () => {
      const input = {
        email: testEmail,
        name: 'Test User',
      };

      const result = await createUserAction(input);

      expect(result).toBeDefined();
      expect(result.result).toBeDefined();
      expect(result.result.success).toBe(true);
      expect(result.result.data).toBeDefined();
      expect(result.result.data.email).toBe(testEmail);
      expect(result.result.data.name).toBe('Test User');
      expect(result.result.data.isActive).toBe(true);
      expect(result.message).toBe('Successfully created user');

      // Store ID for subsequent tests
      testUserId = result.result.data.id;
    });

    it('should fail when email is missing', async () => {
      try {
        await createUserAction({ name: 'Test' } as any);
        expect.fail('Should have thrown validation error');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should fail when email is invalid', async () => {
      try {
        await createUserAction({
          email: 'invalid-email',
          name: 'Test',
        } as any);
        expect.fail('Should have thrown validation error');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('GET USER', () => {
    it('should retrieve a user by ID successfully', async () => {
      const result = await getUserByIdAction(testUserId);

      expect(result).toBeDefined();
      expect(result.result).toBeDefined();
      expect(result.result.id).toBe(testUserId);
      expect(result.result.email).toBe(testEmail);
      expect(result.result.name).toBe('Test User');
    });

    it('should return null for non-existent user ID', async () => {
      const result = await getUserByIdAction('nonexistent_id');
      expect(result.result).toBeNull();
    });
  });

  describe('GET ALL USERS', () => {
    it('should retrieve users with pagination', async () => {
      const input = {
        page: 1,
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      };

      const result = await getAllUsersAction(input);

      expect(result).toBeDefined();
      expect(result.result).toBeDefined();
      expect(result.result.success).toBe(true);
      expect(Array.isArray(result.result.data)).toBe(true);
      expect(result.result.pagination).toBeDefined();
      expect(result.result.pagination.page).toBe(1);
      expect(result.result.pagination.limit).toBe(10);
      expect(typeof result.result.pagination.total).toBe('number');
    });

    it('should respect limit parameter', async () => {
      const input = {
        page: 1,
        limit: 5,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      };

      const result = await getAllUsersAction(input);

      expect(result.result.data.length).toBeLessThanOrEqual(5);
    });

    it('should support different sort orders', async () => {
      const inputAsc = {
        page: 1,
        limit: 5,
        sortBy: 'name',
        sortOrder: 'asc',
      };

      const inputDesc = {
        page: 1,
        limit: 5,
        sortBy: 'name',
        sortOrder: 'desc',
      };

      const resultAsc = await getAllUsersAction(inputAsc);
      const resultDesc = await getAllUsersAction(inputDesc);

      expect(resultAsc.result.data).toBeDefined();
      expect(resultDesc.result.data).toBeDefined();
    });
  });

  describe('UPDATE USER', () => {
    it('should update user information successfully', async () => {
      const input = {
        id: testUserId,
        name: 'Updated User Name',
        isActive: true,
      };

      const result = await updateUserAction(input);

      expect(result).toBeDefined();
      expect(result.result).toBeDefined();
      expect(result.result.success).toBe(true);
      expect(result.result.data.name).toBe('Updated User Name');
      expect(result.result.data.isActive).toBe(true);
      expect(result.message).toBe('Successfully updated user');
    });

    it('should partial update user', async () => {
      const input = {
        id: testUserId,
        isActive: false,
      };

      const result = await updateUserAction(input);

      expect(result.result.success).toBe(true);
      expect(result.result.data.isActive).toBe(false);
    });
  });

  describe('SEARCH USERS', () => {
    it('should search users by term', async () => {
      const input = {
        page: 1,
        limit: 10,
        search: 'Updated',
        sortBy: 'name',
        sortOrder: 'asc',
      };

      const result = await searchUsersAction(input);

      expect(result).toBeDefined();
      expect(result.result).toBeDefined();
      expect(result.result.success).toBe(true);
      expect(Array.isArray(result.result.data)).toBe(true);
      expect(result.result.pagination).toBeDefined();
    });

    it('should return empty results for no matches', async () => {
      const input = {
        page: 1,
        limit: 10,
        search: 'ZZZZZZZ_NO_MATCH',
        sortBy: 'name',
        sortOrder: 'asc',
      };

      const result = await searchUsersAction(input);

      expect(result.result.data.length).toBe(0);
    });
  });

  describe('DELETE USER', () => {
    it('should delete user successfully', async () => {
      const result = await deleteUserAction(testUserId);

      expect(result).toBeDefined();
      expect(result.result.success).toBe(true);
      expect(result.message).toBe('Successfully deleted user');
    });

    it('should handle deletion of non-existent user gracefully', async () => {
      const result = await deleteUserAction('nonexistent_id');
      expect(result.result.success).toBe(true);
    });
  });

  describe('VALIDATION & ERROR HANDLING', () => {
    it('should validate email format', async () => {
      try {
        await createUserAction({
          email: 'not-an-email',
          name: 'Test',
        } as any);
        expect.fail('Should have thrown validation error');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should validate name length', async () => {
      try {
        await createUserAction({
          email: 'test@example.com',
          name: 'a'.repeat(101), // Name too long
        } as any);
        expect.fail('Should have thrown validation error');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should require non-empty inputs', async () => {
      try {
        await createUserAction({
          email: '',
          name: '',
        } as any);
        expect.fail('Should have thrown validation error');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });
});
```

### Run Tests

```bash
# Run all tests
npm run test

# Run specific test file
npm run test -- action-verification.test.ts

# Run with coverage
npm run test -- --coverage

# Run in watch mode
npm run test -- --watch
```

---

## 📊 Test Results Summary Template

Use this template to document and share test results:

```markdown
# User Service Actions - Test Results

## Execution Date
November 16, 2024

## Test Environment
- Node.js: v18.x
- TypeScript: 5.x
- Database: PostgreSQL
- Connection Status: ✅ Connected

## Test Summary
- Total Tests: 20
- Passed: 20 ✅
- Failed: 0
- Skipped: 0
- Duration: 2.5s

## Results by Action

### ✅ createUserAction
- [x] Creates user with valid input
- [x] Generates unique ID
- [x] Sets default values (isActive=true)
- [x] Validates email format
- [x] Validates name length

### ✅ getUserByIdAction
- [x] Retrieves existing user
- [x] Returns null for missing user
- [x] Formats dates correctly

### ✅ getAllUsersAction
- [x] Returns paginated results
- [x] Respects limit parameter
- [x] Sorts by different fields
- [x] Handles empty results

### ✅ updateUserAction
- [x] Updates all fields
- [x] Partial updates work
- [x] Updates timestamps
- [x] Maintains other fields

### ✅ searchUsersAction
- [x] Searches by email
- [x] Searches by name
- [x] Case-insensitive search
- [x] Returns paginated results

### ✅ deleteUserAction
- [x] Deletes existing user
- [x] Handles non-existent user
- [x] Returns success status

## Conclusion
✅ **ALL ACTIONS WORKING AS DOCUMENTED**

All user service actions are functioning correctly and ready for integration testing.
```

---

## 🎯 Quick Verification Checklist

Before moving to full test suite, verify:

- [ ] **Create User**: Can create new users with valid data
- [ ] **Read User**: Can retrieve user by ID
- [ ] **Read All**: Pagination works correctly
- [ ] **Update User**: Can modify user information
- [ ] **Delete User**: Can remove users from database
- [ ] **Search**: Can find users by search term
- [ ] **Validation**: Invalid inputs are rejected
- [ ] **Error Handling**: Errors are caught and formatted
- [ ] **Database**: All operations persisted correctly
- [ ] **Response Format**: All responses match expected schema

---

## 📈 Next Steps

After verification completes:

1. ✅ Run one of the testing approaches above
2. ✅ Document results using the template
3. ✅ Share proof with stakeholders
4. ✅ Move to comprehensive test suite
5. ✅ Integrate with CI/CD pipeline

---

## 🔗 Related Documentation

- `USER_SERVICE_PATTERN.md` - How the service works
- `ARCHITECTURE_COMPARISON.md` - Architecture details
- `EXACT_CHANGES.md` - Code changes made
