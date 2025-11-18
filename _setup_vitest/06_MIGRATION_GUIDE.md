# 🔄 Migration Guide - Converting Existing Tests

## 📋 Table of Contents

1. [Migration Overview](#migration-overview)
2. [Pre-Migration Assessment](#pre-migration-assessment)
3. [Migration Strategies](#migration-strategies)
4. [Step-by-Step Migration](#step-by-step-migration)
5. [Common Migration Scenarios](#common-migration-scenarios)
6. [Testing the Migration](#testing-the-migration)
7. [Rollback Plan](#rollback-plan)

---

## 📊 Migration Overview

### What Changes?

| Aspect             | Before                       | After                             |
| ------------------ | ---------------------------- | --------------------------------- |
| **Test execution** | Sequential                   | Parallel (6 workers)              |
| **Database**       | Shared database              | Isolated schemas                  |
| **Setup**          | beforeEach/beforeAll cleanup | No cleanup needed (fresh schemas) |
| **Teardown**       | afterEach/afterAll cleanup   | Only Prisma client cleanup        |
| **Schema access**  | Direct database connection   | Schema allocator pattern          |
| **Test isolation** | Manual cleanup               | Automatic via schemas             |

### Benefits of Migrating

✅ **6x faster test execution** (parallel workers)  
✅ **No flaky tests** from shared state  
✅ **No manual cleanup** needed  
✅ **True test isolation**  
✅ **Real PostgreSQL** (not mocks)

### Migration Effort Estimate

| Project Size | Number of Test Files | Estimated Time |
| ------------ | -------------------- | -------------- |
| Small        | 1-10 files           | 2-4 hours      |
| Medium       | 11-30 files          | 1-2 days       |
| Large        | 31+ files            | 3-5 days       |

---

## 🔍 Pre-Migration Assessment

### Step 1: Inventory Your Tests

```powershell
# Count test files
Get-ChildItem -Path "src/**/*.test.ts" -Recurse | Measure-Object

# List all test files
Get-ChildItem -Path "src/**/*.test.ts" -Recurse | Select-Object Name, Directory
```

### Step 2: Categorize Tests

For each test file, determine:

**Service/Feature Area:**

- What service does this test? (auth, users, payment, etc.)
- Does it fit into the SERVICES array?

**Test Operations:**

- How many READ-only tests? (SELECT queries)
- How many WRITE tests? (INSERT/UPDATE/DELETE)
- **Critical:** Write tests per file must be ≤ 7

**Current Database Usage:**

- Does it use a shared test database?
- Does it create/drop tables?
- Does it use transactions?
- Does it clean up data in hooks?

### Step 3: Calculate Schema Requirements

```
For each test file:
  READ tests (count) → 1 shared schema
  WRITE tests (count) → N unique schemas

  Total schemas needed = 1 + N

If N > 7:
  ⚠️ Need to split file or increase SCHEMAS_PER_CONTAINER
```

### Step 4: Identify Dependencies

Check for:

- Shared test fixtures
- Test data factories
- Database seeding scripts
- Custom test utilities
- beforeAll/afterAll hooks that setup data

---

## 🎯 Migration Strategies

### Strategy 1: Incremental Migration (Recommended)

**Approach:** Migrate one test file at a time

**Pros:**

- Lower risk
- Easy to test and validate
- Can keep existing tests running
- Learn and adjust as you go

**Cons:**

- Takes longer
- Need to maintain both systems temporarily

**Best For:** Large projects with many test files

---

### Strategy 2: Feature-Based Migration

**Approach:** Migrate by feature/service area

**Example:**

1. Migrate all auth tests
2. Migrate all user tests
3. Migrate all payment tests

**Pros:**

- Logical grouping
- Easier to track progress
- Can validate feature-by-feature

**Cons:**

- May have inter-feature dependencies

**Best For:** Projects organized by features/services

---

### Strategy 3: Big Bang Migration

**Approach:** Convert all tests at once

**Pros:**

- Faster overall
- No dual-system maintenance
- Clean cutover

**Cons:**

- Higher risk
- Harder to debug if issues arise
- All-or-nothing approach

**Best For:** Small projects with <10 test files

---

## 📝 Step-by-Step Migration

### Phase 1: Setup Infrastructure

**1. Install Dependencies**

```powershell
npm install --save-dev vitest @vitest/ui testcontainers
npm install @prisma/client prisma pg winston uuid
npm install --save-dev @types/pg @types/uuid
```

**2. Create Core Files**

Follow [02_INSTALLATION_GUIDE.md](02_INSTALLATION_GUIDE.md) to create:

- `vitest.config.ts`
- `tests/globalSetup.ts`
- `tests/setupFile.ts`
- `tests/schemaAllocator.ts`
- `src/__tests__/shared/testInfrastructure.ts`
- Utility files (ContainerManager, Logger, etc.)

**3. Verify Setup**

```powershell
# Generate Prisma client
npx prisma generate

# Test TypeScript compilation
npx tsc --noEmit

# Run a simple test
npx vitest run --testNamePattern="simple"
```

---

### Phase 2: Migrate One Test File

Let's migrate an example test file step-by-step.

#### Original Test File (Before)

```typescript
// OLD: user-service.test.ts
import { describe, expect, it, beforeAll, afterAll, beforeEach } from "vitest";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  datasources: {
    db: { url: process.env.DATABASE_URL },
  },
});

describe("User Service Tests", () => {
  // Setup: Clean database before all tests
  beforeAll(async () => {
    await prisma.$executeRaw`TRUNCATE TABLE users CASCADE`;
  });

  // Cleanup: Remove test data after each test
  afterEach(async () => {
    await prisma.$executeRaw`DELETE FROM users WHERE email LIKE 'test%'`;
  });

  // Teardown: Disconnect after all tests
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("should get all users", async () => {
    const users = await prisma.user.findMany();
    expect(Array.isArray(users)).toBe(true);
  });

  it("should create a user", async () => {
    const user = await prisma.user.create({
      data: {
        email: "test@example.com",
        name: "Test User",
      },
    });

    expect(user).toBeDefined();
    expect(user.email).toBe("test@example.com");
  });

  it("should update a user", async () => {
    // Setup data
    const created = await prisma.user.create({
      data: {
        email: "test-update@example.com",
        name: "Original Name",
      },
    });

    // Update
    const updated = await prisma.user.update({
      where: { id: created.id },
      data: { name: "Updated Name" },
    });

    expect(updated.name).toBe("Updated Name");
  });

  it("should delete a user", async () => {
    // Setup data
    const created = await prisma.user.create({
      data: {
        email: "test-delete@example.com",
        name: "Delete Me",
      },
    });

    // Delete
    await prisma.user.delete({
      where: { id: created.id },
    });

    // Verify
    const found = await prisma.user.findUnique({
      where: { id: created.id },
    });

    expect(found).toBeNull();
  });
});
```

#### Migrated Test File (After)

```typescript
// NEW: user-service.test.ts
import { describe, expect, it, afterAll } from "vitest";
import { createSchemaAllocator } from "../../../tests/schemaAllocator";

// ✅ CHANGE 1: Create schema allocator instead of Prisma client
const { useReadSchema, useWriteSchema, cleanup } =
  createSchemaAllocator("users");

describe("User Service Tests", () => {
  // ✅ CHANGE 2: Remove beforeAll cleanup (not needed - fresh schemas)
  // ✅ CHANGE 3: Remove afterEach cleanup (not needed - isolated schemas)

  // ✅ CHANGE 4: Use useReadSchema for read-only test
  it(
    "should get all users",
    useReadSchema(async ({ db, schemaName }) => {
      // Use schema-qualified query
      const users = await db.$queryRawUnsafe(`
        SELECT * FROM "${schemaName}".user
      `);
      expect(Array.isArray(users)).toBe(true);
    })
  );

  // ✅ CHANGE 5: Use useWriteSchema for write test
  it(
    "should create a user",
    useWriteSchema(async ({ db, schemaName }) => {
      await db.$executeRawUnsafe(`
        INSERT INTO "${schemaName}".user (email, name, "isActive")
        VALUES ('test@example.com', 'Test User', true)
      `);

      const [user] = (await db.$queryRawUnsafe(`
        SELECT * FROM "${schemaName}".user 
        WHERE email = 'test@example.com'
      `)) as any[];

      expect(user).toBeDefined();
      expect(user.email).toBe("test@example.com");
    })
  );

  // ✅ CHANGE 6: Write test gets unique schema (no cleanup needed)
  it(
    "should update a user",
    useWriteSchema(async ({ db, schemaName }) => {
      // Setup: Create user in this schema
      await db.$executeRawUnsafe(`
        INSERT INTO "${schemaName}".user (email, name, "isActive")
        VALUES ('test-update@example.com', 'Original Name', true)
      `);

      // Get user ID
      const [created] = (await db.$queryRawUnsafe(`
        SELECT * FROM "${schemaName}".user 
        WHERE email = 'test-update@example.com'
      `)) as any[];

      // Update
      await db.$executeRawUnsafe(`
        UPDATE "${schemaName}".user 
        SET name = 'Updated Name'
        WHERE id = ${created.id}
      `);

      // Verify
      const [updated] = (await db.$queryRawUnsafe(`
        SELECT * FROM "${schemaName}".user 
        WHERE id = ${created.id}
      `)) as any[];

      expect(updated.name).toBe("Updated Name");
    })
  );

  // ✅ CHANGE 7: Another write test (gets different unique schema)
  it(
    "should delete a user",
    useWriteSchema(async ({ db, schemaName }) => {
      // Setup: Create user in this schema
      await db.$executeRawUnsafe(`
        INSERT INTO "${schemaName}".user (email, name, "isActive")
        VALUES ('test-delete@example.com', 'Delete Me', true)
      `);

      // Get user ID
      const [created] = (await db.$queryRawUnsafe(`
        SELECT * FROM "${schemaName}".user 
        WHERE email = 'test-delete@example.com'
      `)) as any[];

      // Delete
      await db.$executeRawUnsafe(`
        DELETE FROM "${schemaName}".user 
        WHERE id = ${created.id}
      `);

      // Verify
      const found = (await db.$queryRawUnsafe(`
        SELECT * FROM "${schemaName}".user 
        WHERE id = ${created.id}
      `)) as any[];

      expect(found.length).toBe(0);
    })
  );

  // ✅ CHANGE 8: Add cleanup hook (disconnects Prisma clients)
  afterAll(async () => {
    await cleanup();
  });
});
```

### Changes Summary

| Change                                | Reason                              |
| ------------------------------------- | ----------------------------------- |
| 1. Create schema allocator            | Replaces direct Prisma client       |
| 2. Remove beforeAll cleanup           | Fresh schemas don't need cleanup    |
| 3. Remove afterEach cleanup           | Each write test has isolated schema |
| 4. Wrap read tests in useReadSchema   | Shares schema efficiently           |
| 5. Wrap write tests in useWriteSchema | Each gets unique schema             |
| 6. Self-contained write tests         | Setup data within each test         |
| 7. Schema-qualified queries           | Explicit schema in SQL              |
| 8. Add cleanup hook                   | Disconnect Prisma clients           |

---

### Phase 3: Migrate Remaining Files

**Migration Checklist (per file):**

- [ ] Identify service name for schema allocator
- [ ] Count READ vs WRITE tests (ensure ≤ 7 writes)
- [ ] Create schema allocator: `createSchemaAllocator("service")`
- [ ] Remove database cleanup hooks (beforeAll, afterEach)
- [ ] Wrap read tests in `useReadSchema`
- [ ] Wrap write tests in `useWriteSchema`
- [ ] Make write tests self-contained (setup within test)
- [ ] Use schema-qualified queries (`"${schemaName}".table`)
- [ ] Add cleanup hook: `afterAll(async () => await cleanup())`
- [ ] Run test file to verify: `npx vitest run path/to/file.test.ts`

---

## 🔄 Common Migration Scenarios

### Scenario 1: beforeAll Data Setup

**Before:**

```typescript
let testUserId: number;

beforeAll(async () => {
  const user = await prisma.user.create({
    data: { email: "shared@example.com", name: "Shared" },
  });
  testUserId = user.id;
});

it("test 1", async () => {
  const user = await prisma.user.findUnique({ where: { id: testUserId } });
  // ...
});

it("test 2", async () => {
  await prisma.user.update({
    where: { id: testUserId },
    data: { name: "Updated" },
  });
});
```

**After:**

```typescript
// ✅ Each write test creates its own data
it(
  "test 1",
  useReadSchema(async ({ db, schemaName }) => {
    // Query existing data (assuming user table has data)
    const users = await db.$queryRawUnsafe(`
      SELECT * FROM "${schemaName}".user LIMIT 1
    `);
    // ...
  })
);

it(
  "test 2",
  useWriteSchema(async ({ db, schemaName }) => {
    // Setup: Create user for this test
    await db.$executeRawUnsafe(`
      INSERT INTO "${schemaName}".user (email, name)
      VALUES ('test@example.com', 'Original')
    `);

    // Get ID
    const [user] = (await db.$queryRawUnsafe(`
      SELECT * FROM "${schemaName}".user 
      WHERE email = 'test@example.com'
    `)) as any[];

    // Test: Update
    await db.$executeRawUnsafe(`
      UPDATE "${schemaName}".user 
      SET name = 'Updated'
      WHERE id = ${user.id}
    `);

    // Verify
    // ...
  })
);
```

---

### Scenario 2: Test Data Factories

**Before:**

```typescript
function createTestUser(email: string) {
  return prisma.user.create({
    data: { email, name: "Test User" },
  });
}

it("test", async () => {
  const user = await createTestUser("test@example.com");
  // ...
});
```

**After:**

```typescript
// Update factory to accept db and schemaName
async function createTestUser(
  db: PrismaClient,
  schemaName: string,
  email: string
) {
  await db.$executeRawUnsafe(`
    INSERT INTO "${schemaName}".user (email, name)
    VALUES ('${email}', 'Test User')
  `);

  const [user] = (await db.$queryRawUnsafe(`
    SELECT * FROM "${schemaName}".user WHERE email = '${email}'
  `)) as any[];

  return user;
}

it(
  "test",
  useWriteSchema(async ({ db, schemaName }) => {
    const user = await createTestUser(db, schemaName, "test@example.com");
    // ...
  })
);
```

---

### Scenario 3: Transactions

**Before:**

```typescript
it("test transaction", async () => {
  await prisma.$transaction(async (tx) => {
    await tx.user.create({ data: { email: "a@example.com", name: "A" } });
    await tx.user.create({ data: { email: "b@example.com", name: "B" } });
  });
});
```

**After:**

```typescript
it(
  "test transaction",
  useWriteSchema(async ({ db, schemaName }) => {
    await db.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(`
        INSERT INTO "${schemaName}".user (email, name)
        VALUES ('a@example.com', 'A')
      `);
      await tx.$executeRawUnsafe(`
        INSERT INTO "${schemaName}".user (email, name)
        VALUES ('b@example.com', 'B')
      `);
    });
  })
);
```

---

### Scenario 4: Multiple Services

**Before:**

```typescript
it("test user and order", async () => {
  const user = await prisma.user.create({ data: { ... } });
  const order = await prisma.order.create({ data: { userId: user.id, ... } });
  // ...
});
```

**After:**

```typescript
// Option 1: Use a single service that covers both
const { useWriteSchema, cleanup } = createSchemaAllocator("orders");

it(
  "test user and order",
  useWriteSchema(async ({ db, schemaName }) => {
    // Both tables in same schema
    await db.$executeRawUnsafe(`
      INSERT INTO "${schemaName}".user (email, name)
      VALUES ('test@example.com', 'Test')
    `);

    const [user] = (await db.$queryRawUnsafe(`
      SELECT * FROM "${schemaName}".user WHERE email = 'test@example.com'
    `)) as any[];

    await db.$executeRawUnsafe(`
      INSERT INTO "${schemaName}".order (user_id, amount)
      VALUES (${user.id}, 100.00)
    `);

    // ...
  })
);

// Option 2: If tables are in different schemas, reconsider test design
// - Should this be an integration test?
// - Can you mock one service?
```

---

### Scenario 5: Parameterized Tests

**Before:**

```typescript
it.each([
  { email: "test1@example.com", name: "User 1" },
  { email: "test2@example.com", name: "User 2" },
  { email: "test3@example.com", name: "User 3" },
])("creates user: $name", async ({ email, name }) => {
  const user = await prisma.user.create({ data: { email, name } });
  expect(user.email).toBe(email);
});
```

**After:**

```typescript
// Each parameterized test is a separate write test
it.each([
  { email: "test1@example.com", name: "User 1" },
  { email: "test2@example.com", name: "User 2" },
  { email: "test3@example.com", name: "User 3" },
])(
  "creates user: $name",
  useWriteSchema(async ({ db, schemaName }, { email, name }) => {
    await db.$executeRawUnsafe(`
      INSERT INTO "${schemaName}".user (email, name)
      VALUES ('${email}', '${name}')
    `);

    const [user] = (await db.$queryRawUnsafe(`
      SELECT * FROM "${schemaName}".user WHERE email = '${email}'
    `)) as any[];

    expect(user.email).toBe(email);
  })
);
```

**⚠️ Warning:** Each parameterized test uses one write schema!

- 3 parameterized tests = 3 write schemas used
- Make sure you have enough write schemas available

---

## ✅ Testing the Migration

### 1. Run Migrated File

```powershell
# Run single file
npx vitest run src/__tests__/microservices/user-service.test.ts --reporter=verbose
```

**Expected Output:**

```
🌍 GLOBAL SETUP - INITIALIZING INFRASTRUCTURE
✅ Infrastructure ready: 12 containers, 96 schemas

🎯 Schema Allocation for Service: 'users'
📖 READ Schema (Shared): test_users_...
✏️  WRITE Schemas (7 available):
   1. test_users_...
   2. test_users_...
   ...

✓ should get all users (120ms)
✓ should create a user (45ms)
✓ should update a user (67ms)
✓ should delete a user (52ms)

🧹 Cleaning up schema allocator for service 'users'...
   ✅ Disconnected READ client
   ✅ Disconnected WRITE client 1
   ✅ Disconnected WRITE client 2
   ✅ Disconnected WRITE client 3
```

### 2. Check for Errors

❌ **Common Errors:**

- SCHEMA EXHAUSTION → Split file or increase schemas
- "Schema does not exist" → Check service name
- "Database infrastructure not initialized" → Check setup

### 3. Verify Parallel Execution

```powershell
# Run multiple files
npm test

# Look for parallel execution logs:
# Worker 12345 ready
# Worker 12346 ready
# Worker 12347 ready
# ... (multiple workers running)
```

### 4. Performance Comparison

```powershell
# Measure old system
Measure-Command { npm test } # (before migration)

# Measure new system
Measure-Command { npm test } # (after migration)

# Expected: ~6x faster with 6 workers
```

---

## 🔙 Rollback Plan

### If Migration Fails

**Option 1: Keep Both Systems**

```
src/
  __tests__/
    old/           # Original tests (using old system)
    new/           # Migrated tests (using schema allocator)
    shared/        # testInfrastructure (for new system)
```

**Option 2: Git Branch Strategy**

```powershell
# Create migration branch
git checkout -b migrate-to-parallel-tests

# If migration fails
git checkout main

# If migration succeeds
git merge migrate-to-parallel-tests
```

**Option 3: Feature Flag**

```typescript
// vitest.config.ts
const useParallelTests = process.env.USE_PARALLEL === "true";

export default defineConfig({
  test: {
    pool: useParallelTests ? "forks" : "threads",
    globalSetup: useParallelTests ? ["./tests/globalSetup.ts"] : undefined,
    // ...
  },
});
```

---

## 📊 Migration Progress Tracker

Create a migration checklist:

```markdown
## Migration Progress

### Phase 1: Setup ✅

- [x] Install dependencies
- [x] Create core files
- [x] Verify infrastructure

### Phase 2: Test File Migration (0 / 25)

#### Auth Service

- [ ] auth-login.test.ts
- [ ] auth-session.test.ts
- [ ] auth-validation.test.ts

#### User Service

- [ ] user-crud.test.ts
- [ ] user-validation.test.ts
- [ ] user-search.test.ts

#### Payment Service

- [ ] payment-process.test.ts
- [ ] payment-refund.test.ts

... (continue for all files)

### Phase 3: Validation

- [ ] All tests passing
- [ ] Parallel execution verified
- [ ] Performance improvement confirmed
- [ ] No memory leaks
- [ ] CI/CD updated
```

---

## 🎯 Post-Migration

### 1. Update CI/CD

```yaml
# .github/workflows/test.yml
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      # Ensure Docker available
      - name: Start Docker
        run: |
          sudo service docker start
          docker ps

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "18"

      - name: Install dependencies
        run: npm ci

      - name: Generate Prisma Client
        run: npx prisma generate

      - name: Run tests
        run: npm test
        env:
          CI: true
```

### 2. Update Documentation

- Update README.md with new test commands
- Document schema allocation pattern
- Add troubleshooting guide link
- Update contributor guidelines

### 3. Team Training

- Share this documentation with team
- Run team demo of new system
- Create quick reference guide
- Schedule Q&A session

---

## ✅ Migration Complete Checklist

- [ ] All test files migrated
- [ ] All tests passing
- [ ] Parallel execution working (6 workers)
- [ ] Performance improved (~6x faster)
- [ ] No memory leak warnings
- [ ] CI/CD pipeline updated
- [ ] Documentation updated
- [ ] Team trained on new pattern
- [ ] Old test system removed
- [ ] Migration branch merged

---

## 🎉 Success!

Congratulations on migrating to the parallel schema isolation pattern! Your tests should now be:

✅ **6x faster** (parallel execution)  
✅ **More reliable** (true isolation)  
✅ **Easier to maintain** (no manual cleanup)  
✅ **Production-like** (real PostgreSQL)

---

**Previous:** [05_TROUBLESHOOTING.md](05_TROUBLESHOOTING.md) | **Back to Start:** [00_README.md](00_README.md)
