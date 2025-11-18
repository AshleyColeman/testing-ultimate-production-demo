# 🎯 Schema Allocation Strategy - Implementation Guide

## Overview

This implementation provides **per-file schema allocation** where:

- **Read-only tests** (SELECT queries) **share ONE schema** per file
- **Mutating tests** (INSERT/UPDATE/DELETE) **each get their OWN unique schema** per file

This ensures:
✅ Data isolation for mutations (no test pollution)
✅ Efficiency for reads (no unnecessary duplication)
✅ Clear test intent (explicit read vs write)

---

## Architecture

### 4-Layer Design

```
┌─────────────────────────────────────────────────────────┐
│  1. Global Setup (tests/globalSetup.ts)                │
│     - Runs ONCE before all tests                        │
│     - Creates 5 containers + 20 schemas                 │
│     - Exposes infra via global.__DB_INFRA__             │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  2. Vitest Config (vitest.config.ts)                   │
│     - globalSetup: ['./tests/globalSetup.ts']          │
│     - pool: 'forks' (better for Prisma)                │
│     - maxForks: 5 (match container count)              │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  3. Schema Allocator (tests/schemaAllocator.ts)        │
│     - Per-file helper: createSchemaAllocator('auth')   │
│     - Returns: { useReadSchema, useWriteSchema }       │
│     - Manages schema allocation per test file          │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  4. Test Files (*.test.ts)                             │
│     - Use useReadSchema for SELECT queries             │
│     - Use useWriteSchema for INSERT/UPDATE/DELETE      │
└─────────────────────────────────────────────────────────┘
```

---

## How It Works

### 1. Global Setup

**File:** `tests/globalSetup.ts`

- Runs **ONCE** before all tests
- Calls `initializeInfrastructure()` to create containers/schemas
- Stores schema metadata in `global.__DB_INFRA__`
- Returns teardown function for cleanup

**What it provides:**

```typescript
global.__DB_INFRA__ = {
  schemas: [
    { id: 0, service: 'auth', schemaName: 'auth_schema_1', ... },
    { id: 1, service: 'auth', schemaName: 'auth_schema_2', ... },
    // ... 18 more schemas
  ],
  containerCount: 5,
  totalSchemas: 20
};
```

### 2. Schema Allocator

**File:** `tests/schemaAllocator.ts`

Creates a **per-file allocator** that:

1. **Partitions schemas by service:**

   - First schema → Read-only (shared)
   - Rest → Write (one per mutation)

2. **Tracks state per file:**

   ```typescript
   {
     readSchema: schema_1,        // shared by all reads
     writeSchemas: [schema_2, schema_3, schema_4],  // one per write
     writeIndex: 0,               // increments per write test
   }
   ```

3. **Provides wrappers:**
   - `useReadSchema(fn)` → Wraps read tests
   - `useWriteSchema(fn)` → Wraps write tests

### 3. Test Files

**Example: `auth-login-new-pattern.test.ts`**

```typescript
import { createSchemaAllocator } from "../../../tests/schemaAllocator";

// Create allocator for this file
const { useReadSchema, useWriteSchema } = createSchemaAllocator("auth");

describe("Auth Service - Login", () => {
  // READ TEST - shares schema with other reads
  it(
    "gets user status",
    useReadSchema(async ({ db, schema }) => {
      const users = await db.$queryRaw`SELECT * FROM users`;
      expect(users).toBeDefined();
    })
  );

  // WRITE TEST - gets unique schema #1
  it(
    "creates user",
    useWriteSchema(async ({ db, schema }) => {
      await db.$executeRaw`INSERT INTO users (name) VALUES ('Alice')`;
    })
  );

  // WRITE TEST - gets unique schema #2 (different from above!)
  it(
    "updates user",
    useWriteSchema(async ({ db, schema }) => {
      await db.$executeRaw`UPDATE users SET name = 'Bob' WHERE id = 1`;
    })
  );
});
```

**Schema allocation for this file:**

- Read tests → `auth_schema_1` (shared)
- Write test 1 → `auth_schema_2` (unique)
- Write test 2 → `auth_schema_3` (unique)

---

## Implementation Checklist

### ✅ Step 1: Global Setup

- [x] Create `tests/globalSetup.ts`
- [x] Export `SchemaMeta` and `SerializableInfra` types
- [x] Call `initializeInfrastructure()`
- [x] Store metadata in `global.__DB_INFRA__`
- [x] Return teardown function

### ✅ Step 2: Schema Allocator

- [x] Create `tests/schemaAllocator.ts`
- [x] Implement `createSchemaAllocator(serviceName)`
- [x] Partition schemas (1 for reads, rest for writes)
- [x] Track state per file (readSchema, writeSchemas, writeIndex)
- [x] Implement `useReadSchema` wrapper
- [x] Implement `useWriteSchema` wrapper
- [x] Add helper functions (getAvailableServices, getSchemaCount)

### ✅ Step 3: Vitest Config

- [x] Update `vitest.config.ts`
- [x] Add `globalSetup: ['./tests/globalSetup.ts']`
- [x] Set `pool: 'forks'` (better for Prisma)
- [x] Set `maxForks: 5` (match container count)
- [x] Set `sequence.concurrent: false` (deterministic allocation)

### ✅ Step 4: Example Test

- [x] Create `auth-login-new-pattern.test.ts`
- [x] Demonstrate read tests (useReadSchema)
- [x] Demonstrate write tests (useWriteSchema)
- [x] Add logging to show schema allocation
- [x] Document pattern in comments

### 🔄 Step 5: Migration (Next Steps)

- [ ] Choose a pilot service (e.g., 'auth')
- [ ] Convert 1 test file to new pattern
- [ ] Verify schema allocation works correctly
- [ ] Roll out to remaining test files
- [ ] Update documentation

---

## Usage Examples

### Basic Pattern

```typescript
import { createSchemaAllocator } from "../../../tests/schemaAllocator";

const { useReadSchema, useWriteSchema } = createSchemaAllocator("auth");

describe("My Tests", () => {
  it(
    "read test",
    useReadSchema(async ({ db, schema, schemaName }) => {
      // db: PrismaClient for this schema
      // schema: Full schema metadata
      // schemaName: String name (e.g., 'auth_schema_1')

      const data = await db.$queryRaw`SELECT * FROM users`;
    })
  );

  it(
    "write test",
    useWriteSchema(async ({ db, schema, schemaName }) => {
      await db.$executeRaw`INSERT INTO users (name) VALUES ('Alice')`;
    })
  );
});
```

### Multiple Services

```typescript
// Different services in same file
const authAllocator = createSchemaAllocator('auth');
const paymentAllocator = createSchemaAllocator('payment');

describe('Auth', () => {
  it('test', authAllocator.useReadSchema(async ({ db }) => { ... }));
});

describe('Payment', () => {
  it('test', paymentAllocator.useReadSchema(async ({ db }) => { ... }));
});
```

### Check Available Schemas

```typescript
import {
  getSchemaCount,
  getAvailableServices,
} from "../../../tests/schemaAllocator";

// Get all services
const services = getAvailableServices();
// ['auth', 'payment', 'inventory', 'analytics', 'notification']

// Check schema count for a service
const counts = getSchemaCount("auth");
// { total: 4, read: 1, write: 3 }
```

---

## Schema Allocation Rules

### Per Test File

| Test Type                       | Schema Allocation | Sharing                     |
| ------------------------------- | ----------------- | --------------------------- |
| Read (SELECT)                   | First schema      | Shared by all reads in file |
| Write #1 (INSERT/UPDATE/DELETE) | Second schema     | Unique to this test         |
| Write #2                        | Third schema      | Unique to this test         |
| Write #3                        | Fourth schema     | Unique to this test         |

### Example: File with 5 Tests

```
Test 1 (read)   → schema_1 (shared)
Test 2 (read)   → schema_1 (shared - same as test 1)
Test 3 (write)  → schema_2 (unique)
Test 4 (write)  → schema_3 (unique)
Test 5 (read)   → schema_1 (shared - same as test 1,2)
```

---

## Benefits

### ✅ Efficiency

- Read tests don't need isolation → share one schema
- Saves resources (fewer connections, less setup)
- Faster execution

### ✅ Isolation

- Write tests can't pollute each other's data
- Each mutation gets its own sandbox
- Tests are truly independent

### ✅ Clarity

- Explicit intent: `useReadSchema` vs `useWriteSchema`
- Easy to understand test behavior
- Self-documenting code

### ✅ Scalability

- Works for any number of tests
- Automatic allocation (no manual management)
- Warnings if you run out of schemas

---

## Running Tests

### Option 1: Standard Vitest (Recommended)

```bash
# Run all tests (global setup runs automatically)
npx vitest run

# Run specific test file
npx vitest run src/__tests__/microservices/auth-login-new-pattern.test.ts

# Run in watch mode
npx vitest
```

### Option 2: Old Orchestrator (Still Works)

```bash
# Legacy pattern (will be deprecated)
npx vitest run src/__tests__/ultimateProductionDemo.test.ts
```

---

## Troubleshooting

### Error: "Database infrastructure not initialized"

**Cause:** Global setup didn't run
**Fix:** Ensure `vitest.config.ts` has:

```typescript
test: {
  globalSetup: ["./tests/globalSetup.ts"];
}
```

### Error: "No schemas found for service 'xyz'"

**Cause:** Invalid service name
**Fix:** Use one of: 'auth', 'payment', 'inventory', 'analytics', 'notification'

```typescript
import { getAvailableServices } from "../../../tests/schemaAllocator";
console.log(getAvailableServices()); // See valid services
```

### Warning: "More mutating tests than available write schemas"

**Cause:** Too many write tests for available schemas
**Options:**

1. Split tests into multiple files
2. Increase schemas per service in `testInfrastructure.ts`
3. Accept schema reuse (tests may not be fully isolated)

---

## Migration Strategy

### Phase 1: Pilot (1 service)

1. Choose a service (e.g., 'auth')
2. Convert 1 test file to new pattern
3. Run tests: `npx vitest run src/__tests__/microservices/auth-login-new-pattern.test.ts`
4. Verify logs show correct schema allocation
5. Check tests pass

### Phase 2: Expand (all services)

1. Convert remaining 'auth' test files
2. Move to 'payment' service files
3. Continue with 'inventory', 'analytics', 'notification'
4. Update documentation as you go

### Phase 3: Cleanup

1. Archive or remove old orchestrator test
2. Update README.md with new pattern
3. Add migration guide for team
4. Celebrate! 🎉

---

## Next Steps

1. **Run the example test:**

   ```bash
   npx vitest run src/__tests__/microservices/auth-login-new-pattern.test.ts
   ```

2. **Check the logs** - you should see:

   - Global setup initializing infrastructure
   - Read tests using the same schema
   - Write tests using different schemas

3. **Convert one of your existing test files:**

   - Pick a simple file (e.g., `auth-password.test.ts`)
   - Replace schema selection logic with `createSchemaAllocator`
   - Mark tests as read vs write
   - Test and verify

4. **Iterate:**
   - Convert more files
   - Refine the pattern as needed
   - Document learnings

---

## Questions?

Check:

- Example test: `src/__tests__/microservices/auth-login-new-pattern.test.ts`
- Schema allocator: `tests/schemaAllocator.ts`
- Global setup: `tests/globalSetup.ts`
- Original plan: `test.md`

**Happy testing! 🚀**