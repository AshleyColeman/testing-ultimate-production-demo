# 🤖 Agent Test Creation Rules & Guidelines

## Overview

This document provides **strict rules** for AI agents creating integration test files for the parallel test infrastructure. Following these rules ensures proper schema isolation, prevents memory leaks, and maintains test reliability.

---

## 🚨 Critical Rules (MUST FOLLOW)

### Rule 1: Test Classification

**Classify tests correctly based on database mutations**

```typescript
// ✅ USE useReadSchema ONLY FOR:
useReadSchema(async ({ db, schemaName }) => {
  // - Pure SELECT queries only
  // - No INSERT, UPDATE, DELETE operations
  // - Checking for non-existent records (fails gracefully)
  // - Verifying error conditions without mutations
});

// ✅ USE useWriteSchema FOR:
useWriteSchema(async ({ db, schemaName }) => {
  // - ANY INSERT, UPDATE, DELETE operations
  // - Creating test data before reading
  // - ANY test that modifies database state
  // - Even if the primary operation is a SELECT
});
```

**Common Mistakes:**

```typescript
// ❌ WRONG - Creates data but uses useReadSchema
it(
  "get user by ID",
  useReadSchema(async ({ db, schemaName }) => {
    // This MUTATES the database!
    await createUserAction({
      email: "test@example.com",
      database: { client: db, schemaName },
    });

    // Then reads it
    const user = await getUserByIdAction({
      userId: "123",
      database: { client: db, schemaName },
    });
  })
);

// ✅ CORRECT - Uses useWriteSchema because it mutates
it(
  "get user by ID",
  useWriteSchema(async ({ db, schemaName }) => {
    await createUserAction({
      email: "test@example.com",
      database: { client: db, schemaName },
    });
    const user = await getUserByIdAction({
      userId: "123",
      database: { client: db, schemaName },
    });
  })
);
```

---

### Rule 2: Cleanup Hook (REQUIRED)

**Every test file MUST include afterAll cleanup**

```typescript
import { describe, it, expect, afterAll } from "vitest";
import { createSchemaAllocator } from "../../../tests/schemaAllocator";

const { useReadSchema, useWriteSchema, cleanup } =
  createSchemaAllocator("service-name");

describe("Test Suite", () => {
  // ... tests ...

  // ✅ REQUIRED: Must be present in every test file
  afterAll(async () => {
    await cleanup();
  });
});
```

**Why:** Without cleanup, Prisma clients remain connected, causing memory leaks (15+ unclosed connections).

---

### Rule 3: Table Creation - Tables Must Exist

**DO NOT create tables in individual tests - Tables must exist or tests fail fast**

```typescript
// ❌ WRONG - Never create tables in tests
it(
  "test 1",
  useWriteSchema(async ({ db, schemaName }) => {
    await db.$executeRawUnsafe(
      `CREATE TABLE IF NOT EXISTS "${schemaName}".user (...)`
    );
    // test logic
  })
);

// ❌ WRONG - Don't try to create tables with fallback logic
it(
  "test 2",
  useWriteSchema(async ({ db, schemaName }) => {
    try {
      await db.$executeRawUnsafe(`CREATE TABLE...`);
    } catch (error) {
      // Don't handle missing tables - let tests fail fast
    }
    // test logic
  })
);

// ✅ CORRECT - Tables must exist, fail fast if they don't
it(
  "test 1",
  useWriteSchema(async ({ db, schemaName }) => {
    // Just use the table - it must exist in test environment
    const result = await db.$queryRawUnsafe(
      `SELECT * FROM "${schemaName}".user`
    );
    // If table doesn't exist, test should FAIL to highlight setup issues
  })
);
```

**Table Existence Policy:**
- Tests MUST assume required tables exist
- If tables are missing, tests should FAIL FAST
- This ensures proper test environment setup
- No table creation or recovery logic in tests
- Missing tables indicate environment setup problems that must be fixed

**Available Tables:**

- `test_data` - For general test data
- `test_metrics` - For test metrics
- `user` - For user service tests (email, name, isActive, createdAt, updatedAt)

---

### Rule 4: Action Invocation Pattern

**Use single-await pattern (after infrastructure fixes)**

```typescript
// ✅ CORRECT - Single await (simplified pattern)
const result = await createUserAction({
  email: "test@example.com",
  name: "Test User",
  database: { client: db, schemaName },
});

// ❌ OLD PATTERN - Double await (deprecated)
const result = await(await createUserAction)({
  email: "test@example.com",
  name: "Test User",
  database: { client: db, schemaName },
});
```

---

### Rule 5: Database Context

**Every action call MUST include database parameter**

```typescript
// ✅ CORRECT - Always pass database context
const result = await someAction({
  // ... action-specific parameters ...
  email: "test@example.com",
  name: "Test User",
  // REQUIRED: Pass the database context
  database: { client: db, schemaName },
});

// ❌ WRONG - Missing database context
const result = await someAction({
  email: "test@example.com",
  name: "Test User",
  // ← Missing database parameter!
});
```

---

### Rule 6: Unique Test Data

**Generate unique identifiers to avoid conflicts**

```typescript
// ✅ CORRECT - Unique per test execution
const uniqueEmail = `test_${Date.now()}_${Math.random()
  .toString(36)
  .substr(2, 9)}@example.com`;
const uniqueName = `Test User ${Date.now()}`;
const uniqueId = `usr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const result = await createUserAction({
  email: uniqueEmail,
  name: uniqueName,
  database: { client: db, schemaName },
});

// ❌ WRONG - Hardcoded values cause conflicts on reruns
const result = await createUserAction({
  email: "test@example.com", // Will fail if test runs twice!
  name: "Test User",
  database: { client: db, schemaName },
});
```

---

### Rule 7: One Service Per Test File

**Never create multiple test files for the same service**

```typescript
// ✅ CORRECT - One file per service
// File: auth-service.test.ts
const { useReadSchema, useWriteSchema, cleanup } =
  createSchemaAllocator("auth");

// ❌ WRONG - Multiple files for same service causes schema collision
// File: auth-login.test.ts
const { useReadSchema, useWriteSchema, cleanup } =
  createSchemaAllocator("auth");
// File: auth-signup.test.ts
const { useReadSchema, useWriteSchema, cleanup } =
  createSchemaAllocator("auth"); // ← COLLISION!
```

**Why:** Each service has 8 schemas total (1 READ + 7 WRITE). Multiple files would try to use the same schemas simultaneously, causing data corruption.

---

### Rule 8: Schema Capacity Planning

**Count tests before creating file**

```typescript
// Available per service: 1 READ schema + 7 WRITE schemas = 8 total

// ✅ VALID Examples:
// - 3 READ + 5 WRITE = 6 schemas needed (within limit)
// - 10 READ + 7 WRITE = 8 schemas needed (at capacity)
// - 0 READ + 7 WRITE = 7 schemas needed (valid)

// ❌ INVALID Example:
// - 2 READ + 8 WRITE = 9 schemas needed (EXCEEDS LIMIT!)
```

**Before creating a test file:**

1. Count how many WRITE tests (mutations) you'll have
2. Ensure WRITE test count ≤ 7
3. If more needed, split into multiple files with different services

---

### Rule 9: Test Naming Convention

**Include test number and classification BUT NO BRACKETS in test descriptions**

```typescript
// ✅ CORRECT - Clear, numbered, classified, no brackets
it("Test 1/10 CREATE - Successfully create user", useWriteSchema(...));
it("Test 2/10 CREATE - Fail with duplicate email", useWriteSchema(...));
it("Test 3/10 READ - Get user by ID successfully", useWriteSchema(...)); // Note: WRITE because it creates data
it("Test 4/10 READ - Fail to get non-existent user", useReadSchema(...));
it("Test 5/10 UPDATE - Successfully update user", useWriteSchema(...));

// ❌ WRONG - Brackets in test description
it("[Test 1/10] CREATE - Successfully create user", useWriteSchema(...));
it("[Test 2/10] CREATE - Fail with duplicate email", useWriteSchema(...));

// ❌ WRONG - Unclear classification and numbering
it("create user", useWriteSchema(...));
it("get user", useReadSchema(...));
it("update user test", useWriteSchema(...));
```

---

### Rule 10: Error Handling for Negative Tests

**Pure read tests that expect failures**

```typescript
// ✅ CORRECT - No mutation, expects error, uses useReadSchema
it(
  "[Test 4/10] READ - Fail to get non-existent user",
  useReadSchema(async ({ db, schemaName }) => {
    const nonExistentId = `usr_nonexistent_${Date.now()}`;

    try {
      await getUserByIdAction({
        userId: nonExistentId,
        database: { client: db, schemaName },
      });

      expect.fail("Should have thrown not found error");
    } catch (error) {
      expect(error).toBeDefined();

      // Verify it's the correct error type
      if (typeof error === "object" && error !== null && "code" in error) {
        expect(error.code).toBe("P2025"); // Prisma not found error
      } else if (error instanceof Error) {
        expect(error.message).toMatch(/not found|doesn't exist/i);
      }
    }
  })
);
```

---

### Rule 11: Test File Location (CRITICAL)

**Test files MUST be placed in __test__ directories next to the service being tested**

```typescript
// ✅ CORRECT - Place test files next to the service being tested
src/services/users/__test__/createUserAction.test.ts
src/services/auth/__test__/loginAction.test.ts
src/services/payment/__test__/processPaymentAction.test.ts

// ❌ WRONG - Never place tests in microservices directory
src/__tests__/microservices/createUserAction.test.ts  // ← WRONG LOCATION!
src/__tests__/microservices/user-actions.test.ts      // ← WRONG LOCATION!

// ❌ WRONG - Never create deep nested test structures
src/services/users/__test__/integration/createUserAction.test.ts  // ← TOO DEEP!
```

**File Location Strategy:**
- Test files should be immediately discoverable next to their source code
- Use `__test__` directory in the same folder as the service files
- Never use the `src/__tests__/microservices/` directory (reserved for other patterns)
- This makes it easy to find tests for specific services
- Maintains close coupling between test and implementation

---

### Rule 12: Import Path Resolution (CRITICAL)

**Always use tsconfig path mapping (@/) for all imports**

```typescript
// ✅ CORRECT - Use tsconfig path mapping
import { createSchemaAllocator } from "@/tests/schemaAllocator";
import { simulateProductionOperation } from "@/tests/shared/testHelpers";
import { someAction } from "@/services/users/actions";

// ❌ WRONG - Never use relative paths for cross-file imports
import { createSchemaAllocator } from "../../../tests/schemaAllocator";     // ← WRONG!
import { simulateProductionOperation } from "../shared/testHelpers";       // ← WRONG!
import { someAction } from "../../services/users/actions";                // ← WRONG!

// ✅ CORRECT - Local imports can use relative paths
import type { CreateUserInput } from "./_data/userSchema";               // ← OK (same directory)
import { userService } from "./_data/userService";                       // ← OK (same directory)
```

**Import Path Rules:**
1. **Always use @/ prefix** for imports that cross service boundaries
2. **Use relative paths** only for files within the same service directory
3. **Path mapping should match tsconfig.json paths configuration**
4. **Never use "../" navigation** to reach tests directories
5. **Follow the established pattern** shown in existing test files

**Why this matters:**
- Prevents import resolution errors
- Maintains consistency across the codebase
- Makes refactoring easier (no fragile relative paths)
- Leverages TypeScript path mapping for better IDE support

---

## 📝 Complete Test File Template

```typescript
/**
 * 🧪 [SERVICE NAME] Integration Tests
 *
 * Tests [description of what this service does]
 *
 * SCHEMA ALLOCATION:
 * - READ tests: [count] (share 1 schema)
 * - WRITE tests: [count] (each gets unique schema)
 * - Total schemas needed: [count]
 * - Available schemas: 8 (1 READ + 7 WRITE)
 */

import { describe, it, expect, afterAll } from "vitest";
import { createSchemaAllocator } from "@/tests/schemaAllocator";
import { simulateProductionOperation } from "@/tests/shared/testHelpers";

// Import actions being tested
import {
  createSomethingAction,
  getSomethingAction,
  updateSomethingAction,
  deleteSomethingAction,
} from "../../services/serviceName/actions";

// Create schema allocator for ONE service only
const { useReadSchema, useWriteSchema, cleanup } =
  createSchemaAllocator("service-name");

describe("[Service Name] Integration Tests", () => {
  /**
   * READ TEST - Pure read operation
   */
  it(
    "Test 1/N READ - Get something by ID (fail case)",
    useReadSchema(async ({ db, schemaName }) => {
      console.log(
        `📖 READ: Testing non-existent record on schema: ${schemaName}`
      );

      const nonExistentId = `id_nonexistent_${Date.now()}`;
      const executionTime = await simulateProductionOperation();

      try {
        await getSomethingAction({
          id: nonExistentId,
          database: { client: db, schemaName },
        });

        expect.fail("Should have thrown not found error");
      } catch (error) {
        expect(error).toBeDefined();
      }

      console.log(
        `✅ READ completed in ${executionTime}ms (schema: ${schemaName})`
      );
    })
  );

  /**
   * WRITE TEST - Creates data (mutation)
   */
  it(
    "Test 2/N CREATE - Successfully create record",
    useWriteSchema(async ({ db, schemaName }) => {
      console.log(`✏️  WRITE: Creating record on schema: ${schemaName}`);

      // Generate unique test data
      const uniqueId = `test_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;
      const executionTime = await simulateProductionOperation();

      // Create record
      const result = await createSomethingAction({
        id: uniqueId,
        name: `Test Record ${Date.now()}`,
        database: { client: db, schemaName },
      });

      // Verify result
      expect(result).toBeDefined();
      expect(result.result).toBeDefined();
      expect(result.result.id).toBe(uniqueId);

      console.log(
        `✅ WRITE completed in ${executionTime}ms (schema: ${schemaName})`
      );
    })
  );

  /**
   * WRITE TEST - Updates data (mutation)
   */
  it(
    "Test 3/N UPDATE - Successfully update record",
    useWriteSchema(async ({ db, schemaName }) => {
      console.log(`✏️  WRITE: Updating record on schema: ${schemaName}`);

      // First create a record to update
      const uniqueId = `test_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;
      await createSomethingAction({
        id: uniqueId,
        name: "Original Name",
        database: { client: db, schemaName },
      });

      const executionTime = await simulateProductionOperation();

      // Update it
      const result = await updateSomethingAction({
        id: uniqueId,
        name: "Updated Name",
        database: { client: db, schemaName },
      });

      // Verify update
      expect(result).toBeDefined();
      expect(result.result.name).toBe("Updated Name");

      console.log(
        `✅ WRITE completed in ${executionTime}ms (schema: ${schemaName})`
      );
    })
  );

  /**
   * WRITE TEST - Deletes data (mutation)
   */
  it(
    "Test 4/N DELETE - Successfully delete record",
    useWriteSchema(async ({ db, schemaName }) => {
      console.log(`✏️  WRITE: Deleting record on schema: ${schemaName}`);

      // First create a record to delete
      const uniqueId = `test_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;
      await createSomethingAction({
        id: uniqueId,
        name: "To Be Deleted",
        database: { client: db, schemaName },
      });

      const executionTime = await simulateProductionOperation();

      // Delete it
      const result = await deleteSomethingAction({
        id: uniqueId,
        database: { client: db, schemaName },
      });

      // Verify deletion
      expect(result).toBeDefined();

      // Verify record is gone
      try {
        await getSomethingAction({
          id: uniqueId,
          database: { client: db, schemaName },
        });
        expect.fail("Record should have been deleted");
      } catch (error) {
        expect(error).toBeDefined(); // Expected - record not found
      }

      console.log(
        `✅ WRITE completed in ${executionTime}ms (schema: ${schemaName})`
      );
    })
  );

  /**
   * REQUIRED: Cleanup after all tests
   * This prevents memory leaks from unclosed Prisma connections
   */
  afterAll(async () => {
    await cleanup();
  });
});
```

---

## ✅ Pre-Generation Checklist

Before generating a test file, verify:

- [ ] **Test file uses ONE service name only** (no collision with other files)
- [ ] **All tests correctly classified** (READ = no mutations, WRITE = any mutations)
- [ ] **Write test count ≤ 7** (doesn't exceed capacity)
- [ ] **Cleanup hook added** (`afterAll` with `await cleanup()`)
- [ ] **All action calls include database parameter** (`database: { client: db, schemaName }`)
- [ ] **Test data uses unique identifiers** (`Date.now()` + `Math.random()`)
- [ ] **No table creation in tests** (tables exist from infrastructure)
- [ ] **Test names include classification and numbering** (`Test N/Total TYPE - Description`)
- [ ] **No brackets in test descriptions** (avoid `[Test 1/10]` format)
- [ ] **Test file placed in correct location** (`src/services/serviceName/__test__/fileName.test.ts`)
- [ ] **Import paths use @/ prefix** for cross-boundary imports (`@/tests/schemaAllocator`)
- [ ] **Proper error handling** for negative test cases
- [ ] **Single-await pattern** for action invocations

---

## 🚫 Common Mistakes to Avoid

### Mistake 1: Wrong Classification

```typescript
// ❌ WRONG
it("list users", useReadSchema(async ({ db, schemaName }) => {
  // Creates 3 users first!
  await createUserAction({...});
  await createUserAction({...});
  await createUserAction({...});
  // Then lists them
  const users = await getAllUsersAction({...});
}));

// ✅ CORRECT
it("list users", useWriteSchema(async ({ db, schemaName }) => {
  // Uses WRITE because it creates data
  await createUserAction({...});
  await createUserAction({...});
  await createUserAction({...});
  const users = await getAllUsersAction({...});
}));
```

### Mistake 2: Missing Cleanup

```typescript
// ❌ WRONG - Memory leak!
describe("Tests", () => {
  const { useReadSchema, useWriteSchema } = createSchemaAllocator("service");
  // ... tests ...
  // No cleanup!
});

// ✅ CORRECT
describe("Tests", () => {
  const { useReadSchema, useWriteSchema, cleanup } =
    createSchemaAllocator("service");
  // ... tests ...
  afterAll(async () => {
    await cleanup();
  });
});
```

### Mistake 3: Hardcoded Test Data

```typescript
// ❌ WRONG - Fails on second run
const email = "test@example.com";

// ✅ CORRECT - Always unique
const email = `test_${Date.now()}_${Math.random()
  .toString(36)
  .substr(2, 9)}@example.com`;
```

### Mistake 4: Missing Database Context

```typescript
// ❌ WRONG
await createUserAction({ email: "test@example.com", name: "Test" });

// ✅ CORRECT
await createUserAction({
  email: "test@example.com",
  name: "Test",
  database: { client: db, schemaName },
});
```

### Mistake 5: Wrong Test File Location

```typescript
// ❌ WRONG - Never place tests in microservices directory
// File: src/__tests__/microservices/createUserAction.test.ts
describe("User Tests", () => {
  // Tests here...
});

// ✅ CORRECT - Place tests next to the service
// File: src/services/users/__test__/createUserAction.test.ts
describe("User Tests", () => {
  // Tests here...
});
```

### Mistake 6: Using Relative Paths for Cross-Boundary Imports

```typescript
// ❌ WRONG - Never use relative paths for cross-boundary imports
import { createSchemaAllocator } from "../../../tests/schemaAllocator";
import { simulateProductionOperation } from "../shared/testHelpers";

// ✅ CORRECT - Always use @/ prefix for cross-boundary imports
import { createSchemaAllocator } from "@/tests/schemaAllocator";
import { simulateProductionOperation } from "@/tests/shared/testHelpers";

// ✅ CORRECT - Relative paths are fine for same-directory imports
import type { CreateUserInput } from "./_data/userSchema";
import { userService } from "./_data/userService";
```

### Mistake 7: Using Brackets in Test Descriptions

```typescript
// ❌ WRONG - Brackets in test descriptions
it("[Test 1/10] CREATE - Successfully create user", useWriteSchema(...));
it("[Test 2/10] UPDATE - Update user profile", useWriteSchema(...));

// ✅ CORRECT - No brackets in test descriptions
it("Test 1/10 CREATE - Successfully create user", useWriteSchema(...));
it("Test 2/10 UPDATE - Update user profile", useWriteSchema(...));
```

---

## 📊 Available Services

Current services with schema allocation:

1. `auth` - Authentication service
2. `users` - User management service
3. `payment` - Payment processing
4. `inventory` - Inventory management
5. `analytics` - Analytics service
6. `notification` - Notification service
7. `orders` - Order management
8. `shipping` - Shipping service
9. `notifications` - Notifications (duplicate)
10. `reporting` - Reporting service
11. `billing` - Billing service
12. `audit` - Audit logging

**Choose ONE service per test file. Do not create multiple files for the same service.**

---

## 🎯 Summary

**These rules are mandatory for test generation.** They ensure:

- ✅ Proper schema isolation (no test interference)
- ✅ No memory leaks (all connections cleaned up)
- ✅ Reliable test execution (unique test data)
- ✅ Clear test intent (explicit READ/WRITE classification)
- ✅ Scalable test suite (capacity planning)

**Violations will cause:**

- ❌ Test failures from schema collisions
- ❌ Memory leaks from unclosed connections
- ❌ Intermittent failures from data conflicts
- ❌ Capacity exceeded errors

Follow the template and checklist for every test file generation.