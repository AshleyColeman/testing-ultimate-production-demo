# 🚀 Schema Allocation - Quick Reference

## What You Need to Know

### The Pattern

```typescript
// In ANY test file:
import { createSchemaAllocator } from "../../../tests/schemaAllocator";

const { useReadSchema, useWriteSchema } = createSchemaAllocator("auth");

describe("My Tests", () => {
  // ✅ READ (SELECT only) - shares schema
  it(
    "gets data",
    useReadSchema(async ({ db }) => {
      const data = await db.$queryRaw`SELECT * FROM table`;
    })
  );

  // ✏️  WRITE (INSERT/UPDATE/DELETE) - unique schema
  it(
    "creates data",
    useWriteSchema(async ({ db }) => {
      await db.$executeRaw`INSERT INTO table (col) VALUES ('val')`;
    })
  );
});
```

### Available Services

- `'auth'`
- `'payment'`
- `'inventory'`
- `'analytics'`
- `'notification'`

### Test Context

Every test function receives:

```typescript
{
  db: PrismaClient,     // Database client for this schema
  schema: SchemaMeta,   // Full schema metadata
  schemaName: string    // Schema name (e.g., 'auth_schema_1')
}
```

---

## Running Tests

```bash
# Run all tests (recommended)
npx vitest run

# Run specific file
npx vitest run src/__tests__/microservices/your-file.test.ts

# Watch mode
npx vitest
```

---

## Rules

| Test Type                        | Schema                   | Shared?                    |
| -------------------------------- | ------------------------ | -------------------------- |
| **Read** (SELECT)                | First schema for service | ✅ Yes (all reads in file) |
| **Write** (INSERT/UPDATE/DELETE) | Next available schema    | ❌ No (unique per test)    |

---

## Example: 6 Tests in One File

```typescript
const { useReadSchema, useWriteSchema } = createSchemaAllocator("auth");

// Test 1 (read)  → auth_schema_1 (shared)
// Test 2 (read)  → auth_schema_1 (shared)
// Test 3 (write) → auth_schema_2 (unique)
// Test 4 (write) → auth_schema_3 (unique)
// Test 5 (write) → auth_schema_4 (unique)
// Test 6 (read)  → auth_schema_1 (shared)
```

---

## Common Issues

### "Database infrastructure not initialized"

Add to `vitest.config.ts`:

```typescript
test: {
  globalSetup: ["./tests/globalSetup.ts"];
}
```

### "No schemas found for service 'xyz'"

Use correct service name:

```typescript
import { getAvailableServices } from "../../../tests/schemaAllocator";
console.log(getAvailableServices());
```

---

## Full Example

```typescript
import { describe, it, expect } from "vitest";
import { createSchemaAllocator } from "../../../tests/schemaAllocator";

const { useReadSchema, useWriteSchema } = createSchemaAllocator("auth");

describe("Auth Tests", () => {
  // Read tests - all share one schema
  it(
    "lists users",
    useReadSchema(async ({ db, schemaName }) => {
      console.log(`Reading from: ${schemaName}`);
      const users = await db.$queryRaw`SELECT * FROM users`;
      expect(users).toBeDefined();
    })
  );

  it(
    "counts users",
    useReadSchema(async ({ db, schemaName }) => {
      console.log(`Reading from: ${schemaName}`); // Same schema as above!
      const count = await db.$queryRaw`SELECT COUNT(*) FROM users`;
      expect(count).toBeDefined();
    })
  );

  // Write tests - each gets unique schema
  it(
    "creates user",
    useWriteSchema(async ({ db, schemaName }) => {
      console.log(`Writing to: ${schemaName}`); // Different schema!
      await db.$executeRaw`INSERT INTO users (name) VALUES ('Alice')`;
    })
  );

  it(
    "updates user",
    useWriteSchema(async ({ db, schemaName }) => {
      console.log(`Writing to: ${schemaName}`); // Different schema again!
      await db.$executeRaw`UPDATE users SET name = 'Bob' WHERE id = 1`;
    })
  );
});
```

---

## See Also

- **Full Guide:** `docs/SCHEMA_ALLOCATION_GUIDE.md`
- **Example Test:** `src/__tests__/microservices/auth-login-new-pattern.test.ts`
- **Original Plan:** `test.md`
