# ✅ Schema Allocation Implementation - Complete

## Summary

I've successfully implemented the **per-file schema allocation strategy** from your `test.md` plan. This allows you to:

✅ **Read tests** (SELECT only) → Share ONE schema per file  
✅ **Write tests** (INSERT/UPDATE/DELETE) → Each gets its OWN unique schema

---

## What Was Created

### 1. Core Infrastructure

| File                       | Purpose                                              |
| -------------------------- | ---------------------------------------------------- |
| `tests/globalSetup.ts`     | Initializes containers/schemas ONCE before all tests |
| `tests/schemaAllocator.ts` | Per-file schema allocation helper                    |
| `vitest.config.ts`         | Updated to use globalSetup, optimized for containers |

### 2. Example & Documentation

| File                                                         | Purpose                          |
| ------------------------------------------------------------ | -------------------------------- |
| `src/__tests__/microservices/auth-login-new-pattern.test.ts` | Example test showing the pattern |
| `docs/SCHEMA_ALLOCATION_GUIDE.md`                            | Complete implementation guide    |
| `docs/SCHEMA_ALLOCATION_QUICK_REF.md`                        | Quick reference cheat sheet      |

---

## How It Works

### Architecture

```
Global Setup (runs once)
  ↓
  Creates 5 containers + 20 schemas
  ↓
  Stores in global.__DB_INFRA__
  ↓
Test Files (runs per file)
  ↓
  createSchemaAllocator('auth')
  ↓
  Partitions schemas:
    - First schema → reads (shared)
    - Rest → writes (one per test)
  ↓
  useReadSchema / useWriteSchema
```

### Schema Allocation Per File

**Example: auth-login.test.ts with 6 tests**

```
Test 1: reads users       → auth_schema_1 (shared)
Test 2: reads sessions    → auth_schema_1 (shared)
Test 3: creates user      → auth_schema_2 (unique)
Test 4: updates password  → auth_schema_3 (unique)
Test 5: deletes session   → auth_schema_4 (unique)
Test 6: reads status      → auth_schema_1 (shared)
```

---

## Usage Example

```typescript
// Import the allocator
import { createSchemaAllocator } from "../../../tests/schemaAllocator";

// Create allocator for your service
const { useReadSchema, useWriteSchema } = createSchemaAllocator("auth");

describe("Auth Service", () => {
  // Read test - shares schema
  it(
    "gets users",
    useReadSchema(async ({ db, schema, schemaName }) => {
      const users = await db.$queryRaw`SELECT * FROM users`;
      expect(users).toBeDefined();
    })
  );

  // Write test - unique schema
  it(
    "creates user",
    useWriteSchema(async ({ db, schema, schemaName }) => {
      await db.$executeRaw`INSERT INTO users (name) VALUES ('Alice')`;
    })
  );
});
```

---

## Testing the Implementation

### Step 1: Run the Example Test

```bash
npx vitest run src/__tests__/microservices/auth-login-new-pattern.test.ts
```

**What you'll see:**

- Global setup initializing infrastructure
- 6 tests executing
- Logs showing schema allocation:
  - Read tests using `auth_schema_1`
  - Write tests using `auth_schema_2`, `auth_schema_3`, `auth_schema_4`

### Step 2: Run All Tests (if ready)

```bash
npx vitest run
```

This will:

1. Run global setup (creates infrastructure)
2. Discover all test files
3. Execute tests using natural Vitest discovery
4. Clean up infrastructure when done

---

## Benefits

### ✅ Efficiency

- Read tests don't create unnecessary schemas
- Shared schema = fewer connections = faster execution
- Resource optimization

### ✅ Isolation

- Each write test has its own sandbox
- No data pollution between mutations
- Tests are truly independent

### ✅ Clarity

- Explicit intent: `useReadSchema` vs `useWriteSchema`
- Self-documenting code
- Easy to understand test behavior

### ✅ Scalability

- Works for any number of tests
- Automatic allocation
- No manual schema management

---

## Next Steps

### Option 1: Test the Implementation

```bash
# Run the example test
npx vitest run src/__tests__/microservices/auth-login-new-pattern.test.ts

# Check the logs - you should see:
# - Global setup creating infrastructure
# - Read tests sharing auth_schema_1
# - Write tests using auth_schema_2, 3, 4
```

### Option 2: Convert an Existing Test

1. Pick a test file (e.g., `auth-password.test.ts`)
2. Add the allocator:
   ```typescript
   const { useReadSchema, useWriteSchema } = createSchemaAllocator("auth");
   ```
3. Wrap tests with appropriate helpers
4. Run and verify

### Option 3: Migrate All Tests

Follow the migration guide in:

- `docs/SCHEMA_ALLOCATION_GUIDE.md` (Phase 1-3)

---

## Files Reference

### Core Implementation

```
tests/
├── globalSetup.ts              ← Initializes infrastructure
└── schemaAllocator.ts          ← Per-file schema allocation

vitest.config.ts                ← Updated config
```

### Documentation

```
docs/
├── SCHEMA_ALLOCATION_GUIDE.md      ← Complete guide
└── SCHEMA_ALLOCATION_QUICK_REF.md  ← Cheat sheet

test.md                         ← Original plan (your file)
```

### Example

```
src/__tests__/microservices/
└── auth-login-new-pattern.test.ts  ← Working example
```

---

## Comparison: Old vs New

### Old Pattern (Orchestrator)

```typescript
// ultimateProductionDemo.test.ts
- One master file runs all tests
- Dynamic import of 53 files
- Shared infrastructure but random schema selection
- No read/write distinction
```

### New Pattern (Schema Allocation)

```typescript
// Any test file
- Vitest discovers tests naturally
- Global setup creates infrastructure once
- Per-file schema allocation
- Explicit read vs write intent
- Efficient + isolated
```

---

## Configuration Changes

### vitest.config.ts

**Added:**

```typescript
test: {
  globalSetup: ['./tests/globalSetup.ts'],  // NEW: Run setup once
  poolOptions: {
    forks: {
      maxForks: 5,  // Match container count
    },
  },
  sequence: {
    concurrent: false,  // Keep deterministic
  },
}
```

---

## Troubleshooting

### Error: "Database infrastructure not initialized"

**Fix:** Ensure `vitest.config.ts` has:

```typescript
test: {
  globalSetup: ["./tests/globalSetup.ts"];
}
```

### Error: "No schemas found for service 'xyz'"

**Fix:** Use valid service name:

- 'auth'
- 'payment'
- 'inventory'
- 'analytics'
- 'notification'

### Warning: "More mutating tests than available write schemas"

**Options:**

1. Split tests into multiple files
2. Increase schemas per service
3. Accept schema reuse (reduced isolation)

---

## Status

✅ **Implementation Complete**  
✅ **Example Test Created**  
✅ **Documentation Written**  
🔄 **Ready for Migration**

---

## Questions?

Refer to:

1. **Quick Reference:** `docs/SCHEMA_ALLOCATION_QUICK_REF.md`
2. **Full Guide:** `docs/SCHEMA_ALLOCATION_GUIDE.md`
3. **Example Test:** `src/__tests__/microservices/auth-login-new-pattern.test.ts`
4. **Original Plan:** `test.md`

**Ready to test? Run:**

```bash
npx vitest run src/__tests__/microservices/auth-login-new-pattern.test.ts
```

🎉 **Enjoy your new schema allocation strategy!**
