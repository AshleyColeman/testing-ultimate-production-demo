# ✍️ Writing Tests - Schema Allocator Pattern

## 📋 Table of Contents

1. [Basic Pattern](#basic-pattern)
2. [READ vs WRITE Decision Tree](#read-vs-write-decision-tree)
3. [Complete Examples](#complete-examples)
4. [Best Practices](#best-practices)
5. [Common Patterns](#common-patterns)
6. [Anti-Patterns to Avoid](#anti-patterns-to-avoid)
7. [Testing Checklist](#testing-checklist)

---

## 🎯 Basic Pattern

### Minimal Test File Template

```typescript
import { describe, expect, it, afterAll } from "vitest";
import { createSchemaAllocator } from "../../../tests/schemaAllocator";

// Step 1: Create schema allocator for your service
const { useReadSchema, useWriteSchema, cleanup } =
  createSchemaAllocator("your-service");

describe("Your Test Suite", () => {
  // Step 2: Write tests using useReadSchema or useWriteSchema

  it(
    "read-only test",
    useReadSchema(async ({ db, schema, schemaName }) => {
      // Your test code here
      // Use db for database operations
      // schemaName for schema-qualified queries
    })
  );

  it(
    "write test",
    useWriteSchema(async ({ db, schema, schemaName }) => {
      // Your test code here
      // This test gets its own unique schema
    })
  );

  // Step 3: MANDATORY cleanup hook
  afterAll(async () => {
    await cleanup();
  });
});
```

---

## 🤔 READ vs WRITE Decision Tree

### Should I use `useReadSchema()` or `useWriteSchema()`?

```
START
  │
  ├─ Does this test modify data? (INSERT/UPDATE/DELETE)
  │   │
  │   ├─ YES → useWriteSchema()
  │   │        (Gets unique schema)
  │   │
  │   └─ NO  → Continue...
  │
  ├─ Does this test depend on specific data state?
  │   │
  │   ├─ YES → useWriteSchema()
  │   │        (Setup data, run test in isolation)
  │   │
  │   └─ NO  → Continue...
  │
  ├─ Is this test only reading/querying data?
  │   │
  │   └─ YES → useReadSchema()
  │            (Shares schema with other reads)
```

### Examples by Operation Type

| Operation    | Example                               | Use              |
| ------------ | ------------------------------------- | ---------------- |
| SELECT       | `SELECT * FROM users`                 | useReadSchema()  |
| COUNT        | `SELECT COUNT(*) FROM orders`         | useReadSchema()  |
| EXISTS       | `SELECT EXISTS(SELECT 1 ...)`         | useReadSchema()  |
| JOIN         | `SELECT * FROM users JOIN orders ...` | useReadSchema()  |
| INSERT       | `INSERT INTO users VALUES (...)`      | useWriteSchema() |
| UPDATE       | `UPDATE users SET name = ...`         | useWriteSchema() |
| DELETE       | `DELETE FROM users WHERE ...`         | useWriteSchema() |
| CREATE TABLE | `CREATE TABLE temp_table (...)`       | useWriteSchema() |
| TRUNCATE     | `TRUNCATE TABLE users`                | useWriteSchema() |

---

## 📚 Complete Examples

### Example 1: Auth Service Tests

```typescript
import { describe, expect, it, afterAll } from "vitest";
import { createSchemaAllocator } from "../../../tests/schemaAllocator";

const { useReadSchema, useWriteSchema, cleanup } =
  createSchemaAllocator("auth");

describe("Auth Service - Session Management", () => {
  // ✅ READ TEST - Check if sessions table exists
  it(
    "should have sessions table schema",
    useReadSchema(async ({ db, schemaName }) => {
      const result = await db.$queryRawUnsafe(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = '${schemaName}'
        AND table_name = 'test_data'
      `);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    })
  );

  // ✅ READ TEST - Count existing records (shares schema with above)
  it(
    "should count records without modifying",
    useReadSchema(async ({ db, schemaName }) => {
      const result = await db.$queryRawUnsafe(`
        SELECT COUNT(*) as count 
        FROM "${schemaName}".test_data
      `);

      expect(result).toBeDefined();
    })
  );

  // ✅ WRITE TEST - Create new session (gets unique schema)
  it(
    "should create new session record",
    useWriteSchema(async ({ db, schemaName }) => {
      // Insert test data
      await db.$executeRawUnsafe(`
        INSERT INTO "${schemaName}".test_data 
        (test_type, test_name, test_result, execution_time_ms)
        VALUES ('auth', 'create-session', 'PASS', 150)
      `);

      // Verify insertion
      const result = await db.$queryRawUnsafe(`
        SELECT * FROM "${schemaName}".test_data 
        WHERE test_type = 'auth'
      `);

      expect((result as any[]).length).toBe(1);
      expect((result as any[])[0].test_name).toBe("create-session");
    })
  );

  // ✅ WRITE TEST - Update existing session (gets different unique schema)
  it(
    "should update session record",
    useWriteSchema(async ({ db, schemaName }) => {
      // Setup: Insert initial data
      await db.$executeRawUnsafe(`
        INSERT INTO "${schemaName}".test_data 
        (test_type, test_name, test_result, execution_time_ms)
        VALUES ('auth', 'update-test', 'PENDING', 0)
      `);

      // Test: Update the record
      await db.$executeRawUnsafe(`
        UPDATE "${schemaName}".test_data 
        SET test_result = 'PASS', execution_time_ms = 200
        WHERE test_name = 'update-test'
      `);

      // Verify update
      const result = await db.$queryRawUnsafe(`
        SELECT * FROM "${schemaName}".test_data 
        WHERE test_name = 'update-test'
      `);

      expect((result as any[])[0].test_result).toBe("PASS");
      expect((result as any[])[0].execution_time_ms).toBe(200);
    })
  );

  // ✅ WRITE TEST - Delete session (gets another unique schema)
  it(
    "should delete session record",
    useWriteSchema(async ({ db, schemaName }) => {
      // Setup: Insert data to delete
      await db.$executeRawUnsafe(`
        INSERT INTO "${schemaName}".test_data 
        (test_type, test_name, test_result, execution_time_ms)
        VALUES ('auth', 'delete-test', 'PASS', 100)
      `);

      // Test: Delete the record
      await db.$executeRawUnsafe(`
        DELETE FROM "${schemaName}".test_data 
        WHERE test_name = 'delete-test'
      `);

      // Verify deletion
      const result = await db.$queryRawUnsafe(`
        SELECT * FROM "${schemaName}".test_data 
        WHERE test_name = 'delete-test'
      `);

      expect((result as any[]).length).toBe(0);
    })
  );

  // MANDATORY cleanup
  afterAll(async () => {
    await cleanup();
  });
});
```

**Resource Usage:**

- 2 READ tests → 1 shared schema
- 3 WRITE tests → 3 unique schemas
- **Total: 4 schemas needed** (out of 8 available per service)

---

### Example 2: User Service with Prisma Models

```typescript
import { describe, expect, it, afterAll } from "vitest";
import { createSchemaAllocator } from "../../../tests/schemaAllocator";
import {
  createUserAction,
  getUserByIdAction,
} from "../../services/users/actions";

const { useReadSchema, useWriteSchema, cleanup } =
  createSchemaAllocator("users");

describe("User Service - CRUD Operations", () => {
  // ✅ READ TEST - Get user by ID (no modifications)
  it(
    "should retrieve user by ID",
    useReadSchema(async ({ db, schemaName }) => {
      // Assume user table already exists in schema
      const result = await db.$queryRawUnsafe(`
        SELECT * FROM "${schemaName}".user 
        WHERE id = 1
      `);

      expect(result).toBeDefined();
    })
  );

  // ✅ WRITE TEST - Create user via server action
  it(
    "should create new user",
    useWriteSchema(async ({ db, schemaName }) => {
      // Use server action with schema injection
      const result = await createUserAction({
        email: "test@example.com",
        name: "Test User",
        isActive: true,
        serverCtx: {
          requestSchema: schemaName, // Inject schema
          userId: "test-admin",
          isAdmin: true,
          db, // Inject database client
        },
      });

      expect(result?.data).toBeDefined();
      expect(result?.data?.email).toBe("test@example.com");

      // Verify in database
      const dbResult = await db.$queryRawUnsafe(`
        SELECT * FROM "${schemaName}".user 
        WHERE email = 'test@example.com'
      `);

      expect((dbResult as any[]).length).toBe(1);
    })
  );

  // ✅ WRITE TEST - Update user
  it(
    "should update existing user",
    useWriteSchema(async ({ db, schemaName }) => {
      // Setup: Create user first
      await db.$executeRawUnsafe(`
        INSERT INTO "${schemaName}".user 
        (email, name, "isActive")
        VALUES ('update@example.com', 'Original Name', true)
      `);

      // Get user ID
      const [user] = (await db.$queryRawUnsafe(`
        SELECT id FROM "${schemaName}".user 
        WHERE email = 'update@example.com'
      `)) as any[];

      // Test: Update user
      await db.$executeRawUnsafe(`
        UPDATE "${schemaName}".user 
        SET name = 'Updated Name'
        WHERE id = ${user.id}
      `);

      // Verify update
      const [updated] = (await db.$queryRawUnsafe(`
        SELECT * FROM "${schemaName}".user 
        WHERE id = ${user.id}
      `)) as any[];

      expect(updated.name).toBe("Updated Name");
    })
  );

  // MANDATORY cleanup
  afterAll(async () => {
    await cleanup();
  });
});
```

---

### Example 3: Complex Multi-Step Test

```typescript
it(
  "should handle complex user workflow",
  useWriteSchema(async ({ db, schemaName }) => {
    // Step 1: Create user
    await db.$executeRawUnsafe(`
      INSERT INTO "${schemaName}".user 
      (email, name, "isActive")
      VALUES ('workflow@example.com', 'Workflow User', true)
    `);

    // Step 2: Get user ID
    const [user] = (await db.$queryRawUnsafe(`
      SELECT * FROM "${schemaName}".user 
      WHERE email = 'workflow@example.com'
    `)) as any[];

    expect(user).toBeDefined();
    expect(user.isActive).toBe(true);

    // Step 3: Deactivate user
    await db.$executeRawUnsafe(`
      UPDATE "${schemaName}".user 
      SET "isActive" = false
      WHERE id = ${user.id}
    `);

    // Step 4: Verify deactivation
    const [deactivated] = (await db.$queryRawUnsafe(`
      SELECT * FROM "${schemaName}".user 
      WHERE id = ${user.id}
    `)) as any[];

    expect(deactivated.isActive).toBe(false);

    // Step 5: Reactivate user
    await db.$executeRawUnsafe(`
      UPDATE "${schemaName}".user 
      SET "isActive" = true
      WHERE id = ${user.id}
    `);

    // Step 6: Final verification
    const [reactivated] = (await db.$queryRawUnsafe(`
      SELECT * FROM "${schemaName}".user 
      WHERE id = ${user.id}
    `)) as any[];

    expect(reactivated.isActive).toBe(true);
  })
);
```

---

## ✅ Best Practices

### 1. Always Add Cleanup Hook

```typescript
// ✅ GOOD
describe("My Tests", () => {
  // ... tests ...

  afterAll(async () => {
    await cleanup();
  });
});

// ❌ BAD - Memory leak!
describe("My Tests", () => {
  // ... tests ...
  // Missing cleanup hook
});
```

### 2. Use Schema-Qualified Queries

```typescript
// ✅ GOOD - Explicit schema
await db.$queryRawUnsafe(`
  SELECT * FROM "${schemaName}".user WHERE id = 1
`);

// ❌ BAD - Relies on search_path (might fail)
await db.$queryRawUnsafe(`
  SELECT * FROM user WHERE id = 1
`);
```

### 3. Choose Correct Wrapper

```typescript
// ✅ GOOD - Read-only operations
it(
  "counts users",
  useReadSchema(async ({ db, schemaName }) => {
    const result = await db.$queryRawUnsafe(`
    SELECT COUNT(*) FROM "${schemaName}".user
  `);
  })
);

// ❌ BAD - Wasting write schema on read operation
it(
  "counts users",
  useWriteSchema(async ({ db, schemaName }) => {
    // This is just a SELECT, should use useReadSchema
    const result = await db.$queryRawUnsafe(`
    SELECT COUNT(*) FROM "${schemaName}".user
  `);
  })
);
```

### 4. Group Related Tests

```typescript
// ✅ GOOD - Logical grouping
describe("User CRUD Operations", () => {
  const { useReadSchema, useWriteSchema, cleanup } =
    createSchemaAllocator("users");

  describe("Read Operations", () => {
    it("gets all users", useReadSchema(/* ... */));
    it("gets user by ID", useReadSchema(/* ... */));
  });

  describe("Write Operations", () => {
    it("creates user", useWriteSchema(/* ... */));
    it("updates user", useWriteSchema(/* ... */));
    it("deletes user", useWriteSchema(/* ... */));
  });

  afterAll(async () => await cleanup());
});
```

### 5. Setup Data Within Write Tests

```typescript
// ✅ GOOD - Self-contained test
it(
  "updates user name",
  useWriteSchema(async ({ db, schemaName }) => {
    // Setup: Create test data
    await db.$executeRawUnsafe(`
      INSERT INTO "${schemaName}".user (email, name)
      VALUES ('test@example.com', 'Original')
    `);

    // Test: Update
    await db.$executeRawUnsafe(`
      UPDATE "${schemaName}".user 
      SET name = 'Updated'
      WHERE email = 'test@example.com'
    `);

    // Verify
    const [user] = (await db.$queryRawUnsafe(`
      SELECT * FROM "${schemaName}".user 
      WHERE email = 'test@example.com'
    `)) as any[];

    expect(user.name).toBe("Updated");
  })
);
```

### 6. Descriptive Test Names

```typescript
// ✅ GOOD - Clear intent
it("should create user with valid email", useWriteSchema(/* ... */));
it("should reject user with invalid email", useWriteSchema(/* ... */));
it("should list all active users (READ)", useReadSchema(/* ... */));

// ❌ BAD - Unclear
it("test 1", useWriteSchema(/* ... */));
it("user stuff", useWriteSchema(/* ... */));
```

---

## 🔧 Common Patterns

### Pattern 1: Testing Validation Logic

```typescript
it(
  "should reject invalid email format",
  useWriteSchema(async ({ db, schemaName }) => {
    await expect(async () => {
      await db.$executeRawUnsafe(`
        INSERT INTO "${schemaName}".user (email, name)
        VALUES ('not-an-email', 'Test User')
      `);
    }).rejects.toThrow(); // Expect constraint violation
  })
);
```

### Pattern 2: Testing Cascading Deletes

```typescript
it(
  "should delete user and related records",
  useWriteSchema(async ({ db, schemaName }) => {
    // Setup: Create user
    await db.$executeRawUnsafe(`
      INSERT INTO "${schemaName}".user (id, email, name)
      VALUES (1, 'cascade@example.com', 'Cascade User')
    `);

    // Setup: Create related records
    await db.$executeRawUnsafe(`
      INSERT INTO "${schemaName}".test_data (test_type, test_name, test_result)
      VALUES ('user-1', 'related-record', 'PASS')
    `);

    // Test: Delete user
    await db.$executeRawUnsafe(`
      DELETE FROM "${schemaName}".user WHERE id = 1
    `);

    // Verify: Related records handled correctly
    const relatedRecords = await db.$queryRawUnsafe(`
      SELECT * FROM "${schemaName}".test_data WHERE test_type = 'user-1'
    `);

    // Depending on your schema constraints:
    // expect((relatedRecords as any[]).length).toBe(0); // If CASCADE
    // or verify orphaned records are handled appropriately
  })
);
```

### Pattern 3: Testing Transactions

```typescript
it(
  "should rollback failed transaction",
  useWriteSchema(async ({ db, schemaName }) => {
    try {
      await db.$transaction(async (tx) => {
        // Insert first record
        await tx.$executeRawUnsafe(`
          INSERT INTO "${schemaName}".user (email, name)
          VALUES ('transaction1@example.com', 'User 1')
        `);

        // This will fail (duplicate email), rolling back both inserts
        await tx.$executeRawUnsafe(`
          INSERT INTO "${schemaName}".user (email, name)
          VALUES ('transaction1@example.com', 'User 1 Again')
        `);
      });
    } catch (error) {
      // Transaction failed as expected
    }

    // Verify: No records inserted (rollback worked)
    const result = await db.$queryRawUnsafe(`
      SELECT * FROM "${schemaName}".user 
      WHERE email = 'transaction1@example.com'
    `);

    expect((result as any[]).length).toBe(0);
  })
);
```

### Pattern 4: Testing Pagination

```typescript
it(
  "should paginate users correctly (READ)",
  useReadSchema(async ({ db, schemaName }) => {
    // Assume users already exist in test_data or user table

    // Page 1: First 10 users
    const page1 = await db.$queryRawUnsafe(`
      SELECT * FROM "${schemaName}".user 
      ORDER BY id 
      LIMIT 10 OFFSET 0
    `);

    // Page 2: Next 10 users
    const page2 = await db.$queryRawUnsafe(`
      SELECT * FROM "${schemaName}".user 
      ORDER BY id 
      LIMIT 10 OFFSET 10
    `);

    expect(Array.isArray(page1)).toBe(true);
    expect(Array.isArray(page2)).toBe(true);

    // Verify no overlap
    const page1Ids = (page1 as any[]).map((u) => u.id);
    const page2Ids = (page2 as any[]).map((u) => u.id);
    const overlap = page1Ids.filter((id) => page2Ids.includes(id));

    expect(overlap.length).toBe(0);
  })
);
```

---

## ❌ Anti-Patterns to Avoid

### Anti-Pattern 1: Shared State Between Tests

```typescript
// ❌ BAD - Tests depend on execution order
let userId: number;

it(
  "creates user",
  useWriteSchema(async ({ db, schemaName }) => {
    // ...
    userId = result.id; // ⚠️ Storing state
  })
);

it(
  "updates user",
  useWriteSchema(async ({ db, schemaName }) => {
    // ⚠️ Depends on previous test's userId
    // This will FAIL because each write test gets a different schema!
    await db.$executeRawUnsafe(`
    UPDATE "${schemaName}".user SET name = 'New' WHERE id = ${userId}
  `);
  })
);

// ✅ GOOD - Self-contained tests
it(
  "creates and updates user",
  useWriteSchema(async ({ db, schemaName }) => {
    // Setup
    await db.$executeRawUnsafe(`
    INSERT INTO "${schemaName}".user (email, name)
    VALUES ('test@example.com', 'Original')
  `);

    // Get ID
    const [user] = (await db.$queryRawUnsafe(`
    SELECT id FROM "${schemaName}".user WHERE email = 'test@example.com'
  `)) as any[];

    // Update
    await db.$executeRawUnsafe(`
    UPDATE "${schemaName}".user SET name = 'Updated' WHERE id = ${user.id}
  `);

    // Verify
    const [updated] = (await db.$queryRawUnsafe(`
    SELECT * FROM "${schemaName}".user WHERE id = ${user.id}
  `)) as any[];

    expect(updated.name).toBe("Updated");
  })
);
```

### Anti-Pattern 2: Forgetting Schema Qualification

```typescript
// ❌ BAD - Missing schema qualification
it(
  "gets users",
  useReadSchema(async ({ db }) => {
    // This might query wrong schema or fail
    const result = await db.$queryRawUnsafe(`SELECT * FROM user`);
  })
);

// ✅ GOOD - Explicit schema
it(
  "gets users",
  useReadSchema(async ({ db, schemaName }) => {
    const result = await db.$queryRawUnsafe(`
    SELECT * FROM "${schemaName}".user
  `);
  })
);
```

### Anti-Pattern 3: Modifying Data in READ Tests

```typescript
// ❌ BAD - Modifying data in useReadSchema
it(
  "updates user",
  useReadSchema(async ({ db, schemaName }) => {
    // ⚠️ This modifies data but uses useReadSchema!
    // Other read tests will see these changes!
    await db.$executeRawUnsafe(`
    UPDATE "${schemaName}".user SET name = 'Changed' WHERE id = 1
  `);
  })
);

// ✅ GOOD - Use useWriteSchema for modifications
it(
  "updates user",
  useWriteSchema(async ({ db, schemaName }) => {
    await db.$executeRawUnsafe(`
    UPDATE "${schemaName}".user SET name = 'Changed' WHERE id = 1
  `);
  })
);
```

### Anti-Pattern 4: Too Many Write Tests Per File

```typescript
// ❌ BAD - Exceeds available schemas
describe("User Service", () => {
  const { useWriteSchema, cleanup } = createSchemaAllocator("users");

  // 10 write tests × 1 schema each = 10 schemas needed
  // But only 7 write schemas available per service!
  it("test 1", useWriteSchema(/* ... */));
  it("test 2", useWriteSchema(/* ... */));
  it("test 3", useWriteSchema(/* ... */));
  // ... 7 more tests
  it("test 10", useWriteSchema(/* ... */)); // ❌ SCHEMA EXHAUSTION!

  afterAll(async () => await cleanup());
});

// ✅ GOOD - Split into multiple files
// File 1: user-crud.test.ts (4 write tests)
// File 2: user-validation.test.ts (3 write tests)
// File 3: user-advanced.test.ts (3 write tests)
```

---

## ✅ Testing Checklist

Before committing your test file:

- [ ] Schema allocator created with correct service name
- [ ] `cleanup()` called in `afterAll` hook
- [ ] All queries use schema-qualified table names (`"${schemaName}".table`)
- [ ] READ tests use `useReadSchema()` (no data modifications)
- [ ] WRITE tests use `useWriteSchema()` (any modifications)
- [ ] Each write test is self-contained (setup data within test)
- [ ] Total write tests per file ≤ 7 (or adjust SCHEMAS_PER_CONTAINER)
- [ ] Tests have descriptive names explaining what they test
- [ ] No shared state between tests (no module-level variables)
- [ ] No assumptions about test execution order
- [ ] Error cases are tested with proper expect().rejects patterns

---

## 🎯 Quick Reference

### File Template

```typescript
import { describe, expect, it, afterAll } from "vitest";
import { createSchemaAllocator } from "../../../tests/schemaAllocator";

const { useReadSchema, useWriteSchema, cleanup } =
  createSchemaAllocator("SERVICE_NAME");

describe("Test Suite Name", () => {
  it(
    "read test",
    useReadSchema(async ({ db, schema, schemaName }) => {
      // Read-only operations
    })
  );

  it(
    "write test",
    useWriteSchema(async ({ db, schema, schemaName }) => {
      // Data modifications
    })
  );

  afterAll(async () => {
    await cleanup();
  });
});
```

### Context Object

```typescript
{
  db: PrismaClient,           // Use for database operations
  schema: SchemaMeta,         // Full metadata object
  schemaName: string          // Quick access to schema name
}
```

### Schema Capacity Per Service

- 1 READ schema (shared by all read tests)
- 7 WRITE schemas (one per write test)
- **Max 7 write tests per file**

---

## 🔜 Next Steps

Now that you know how to write tests:

### → **[05_TROUBLESHOOTING.md](05_TROUBLESHOOTING.md)**

Learn how to debug and fix common issues.

---

**Previous:** [03_CONFIGURATION_FILES.md](03_CONFIGURATION_FILES.md) | **Next:** [05_TROUBLESHOOTING.md](05_TROUBLESHOOTING.md)
