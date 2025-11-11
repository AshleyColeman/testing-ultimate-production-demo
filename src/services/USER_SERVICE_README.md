# UserService - Proof of Concept Demo Service

## Overview

`UserService` is a simple but complete proof of concept service designed to demonstrate the integration test agent's ability to generate comprehensive tests.

**Location**: `src/services/UserService.ts`

## What It Does

UserService manages user records in the database with standard CRUD operations:

### Methods

#### ✅ **createUser(input: CreateUserInput)**

- Creates a new user with email and name
- **Input**: `{ email: string, name: string }`
- **Returns**: Created `User` object with ID, timestamps, etc.
- **Errors**:
  - Throws if email is invalid
  - Throws if email already exists (duplicate)
  - Throws if required fields are missing

#### ✅ **getUserById(userId: string)**

- Retrieves a user by their unique ID
- **Input**: User ID string
- **Returns**: `User` object or `null` if not found
- **Errors**: Throws on database failure

#### ✅ **getUserByEmail(email: string)**

- Retrieves a user by email address
- **Input**: Email string
- **Returns**: `User` object or `null` if not found
- **Errors**: Throws on database failure

#### ✅ **getAllUsers()**

- Gets all users in the database
- **Input**: None
- **Returns**: Array of `User` objects
- **Errors**: Throws on database failure

#### ✅ **updateUser(userId: string, input: UpdateUserInput)**

- Updates user information (name, isActive status)
- **Input**: User ID and partial update object
- **Returns**: Updated `User` object
- **Errors**:
  - Throws if user not found
  - Throws on database failure

#### ✅ **deleteUser(userId: string)**

- Deletes a user by ID
- **Input**: User ID string
- **Returns**: Number of deleted records (0 or 1)
- **Errors**: Throws on database failure

#### ✅ **getUserCount()**

- Gets total count of users
- **Input**: None
- **Returns**: Number of users in database
- **Errors**: Throws on database failure

#### ✅ **deleteAllUsers()** (Helper for testing)

- Deletes all users from database (for cleanup)
- **Input**: None
- **Returns**: 0
- **Errors**: Throws on database failure

## Key Features

### 1. **Real Database Operations**

- Uses Prisma Client with raw SQL queries
- Connects to actual PostgreSQL database
- No mocking or stubbing

### 2. **Proper Error Handling**

- Input validation (email format, required fields)
- Duplicate key detection
- Database error propagation
- Detailed error messages

### 3. **Logging & Observability**

- Uses Logger utility for all operations
- Logs operation timing (milliseconds)
- Logs success/failure for each operation
- Debug logging for queries

### 4. **Type Safety**

- Full TypeScript interfaces
- `User` interface with all fields
- `CreateUserInput` for creation
- `UpdateUserInput` for updates (partial)

### 5. **Realistic Delays**

- Uses `Date.now()` to measure operation duration
- Logs timing for each operation
- Ready for integration tests to verify performance

## User Interface

```typescript
interface User {
  id: string;
  email: string;
  name: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface CreateUserInput {
  email: string;
  name: string;
}

interface UpdateUserInput {
  name?: string;
  isActive?: boolean;
}
```

## Usage in Tests

```typescript
import { userService } from "@/services";
import { databaseService } from "@/utils";

// Setup
beforeAll(async () => {
  await databaseService.connect();
});

// Test
it("should create a user", async () => {
  const user = await userService.createUser({
    email: "test@example.com",
    name: "Test User",
  });

  expect(user.email).toBe("test@example.com");
  expect(user.isActive).toBe(true);
});

// Cleanup
afterAll(async () => {
  await userService.deleteAllUsers();
  await databaseService.disconnect();
});
```

## What Makes This Good for Testing

1. **Simple but complete** - Few methods, but covers real scenarios
2. **Error cases** - Duplicate emails, missing fields, not found
3. **CRUD coverage** - Create, Read (2 ways), Update, Delete, List
4. **Database operations** - Real inserts, updates, deletes, selects
5. **Measurable** - Timing data for performance testing
6. **Clean interface** - Clear inputs and outputs
7. **Production-like** - Uses patterns you'd see in real services

## Integration Test Agent Use Case

This service is perfect for demonstrating the integration test agent because:

✅ **It's not complex** - Easy to understand what it should test
✅ **It has clear behavior** - Expected inputs/outputs are obvious
✅ **It tests real DB** - Not stubbed, uses actual database
✅ **It has error cases** - Email validation, duplicates, not found
✅ **It's reusable** - Same patterns work for other services
✅ **It logs everything** - Can verify behavior through logs

## Database Table Required

The UserService expects a `users` table in PostgreSQL:

```sql
CREATE TABLE users (
  id VARCHAR(255) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
```

## Next Steps

1. **Create integration test suite** using the integration test agent
2. **Test all 8 methods** (create, read by ID, read by email, update, delete, count, get all, delete all)
3. **Cover error cases** (invalid email, duplicate email, not found)
4. **Verify timing** (logs show operation duration)
5. **Verify logging** (proper log messages appear)

---

**Status**: ✅ Ready for integration testing
**Type**: Proof of Concept Service
**Purpose**: Demonstrate agent's ability to generate comprehensive integration tests
