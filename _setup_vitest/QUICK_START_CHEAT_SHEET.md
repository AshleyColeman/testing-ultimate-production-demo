# ⚡ Quick Start Cheat Sheet

> **1-page reference for experienced developers**

## 🎯 Concept

Vitest + Testcontainers + PostgreSQL schemas = Fast parallel isolated tests

**Key Pattern:**

- Each test file gets a schema allocator
- READ tests share 1 schema (SELECT only)
- WRITE tests each get unique schema (INSERT/UPDATE/DELETE)
- 6 test files run in parallel
- 12 containers × 8 schemas = 96 total schemas

---

## 📦 Installation (5 min)

```powershell
# Dependencies
npm install --save-dev vitest @vitest/ui testcontainers
npm install @prisma/client prisma pg winston uuid
npm install --save-dev @types/pg @types/uuid tsx typescript
npx prisma generate
```

---

## 📁 Files to Create

```
vitest.config.ts          # Pool: forks, maxForks: 6, globalSetup, setupFiles
tests/
  globalSetup.ts          # Create containers/schemas, write .vitest-infra.json
  setupFile.ts            # Read .vitest-infra.json, set global.__DB_INFRA__
  schemaAllocator.ts      # READ/WRITE allocation logic (~400 lines)
src/__tests__/shared/
  testInfrastructure.ts   # Container/schema management (~400 lines)
src/utils/
  ContainerManager.ts     # Testcontainers wrapper
  Logger.ts, LRUCache.ts, MemoryManager.ts, MemoryMonitor.ts
```

**Copy from POC:** `c:\Users\Ashley\source\repos\testing-ultimate-production-demo\`

---

## 🧪 Test File Template

```typescript
import { describe, expect, it, afterAll } from "vitest";
import { createSchemaAllocator } from "../../../tests/schemaAllocator";

const { useReadSchema, useWriteSchema, cleanup } =
  createSchemaAllocator("users");

describe("User Tests", () => {
  // READ test (shares schema with other reads)
  it(
    "gets users",
    useReadSchema(async ({ db, schemaName }) => {
      const users = await db.$queryRawUnsafe(`
      SELECT * FROM "${schemaName}".user
    `);
      expect(Array.isArray(users)).toBe(true);
    })
  );

  // WRITE test (gets unique schema)
  it(
    "creates user",
    useWriteSchema(async ({ db, schemaName }) => {
      await db.$executeRawUnsafe(`
      INSERT INTO "${schemaName}".user (email, name)
      VALUES ('test@example.com', 'Test')
    `);
      const [user] = (await db.$queryRawUnsafe(`
      SELECT * FROM "${schemaName}".user WHERE email = 'test@example.com'
    `)) as any[];
      expect(user.email).toBe("test@example.com");
    })
  );

  // MANDATORY cleanup
  afterAll(async () => await cleanup());
});
```

---

## ⚙️ Key Configuration

### vitest.config.ts

```typescript
export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    testTimeout: 300000,
    pool: "forks",
    poolOptions: { forks: { maxForks: 6 } },
    globalSetup: ["./tests/globalSetup.ts"],
    setupFiles: ["./tests/setupFile.ts"],
    sequence: { concurrent: false }, // Keep deterministic
  },
});
```

### testInfrastructure.ts Constants

```typescript
export const CONTAINER_COUNT = 12;
export const SCHEMAS_PER_CONTAINER = 8;
export const TOTAL_SCHEMAS = 96;

export const SERVICES = [
  "auth",
  "users",
  "payment",
  "inventory",
  "analytics",
  "notification",
  "orders",
  "shipping",
  "notifications",
  "reporting",
  "billing",
  "audit",
];
```

---

## 🚀 Run Tests

```powershell
# All tests (parallel)
npm test

# Single file
npx vitest run src/__tests__/microservices/example.test.ts

# Watch mode
npm test -- --watch

# UI mode
npm test -- --ui
```

---

## ✅ Decision Tree: READ or WRITE?

```
Does test modify data?
  YES → useWriteSchema()
  NO  → useReadSchema()

Does test need specific setup?
  YES → useWriteSchema() (setup within test)
  NO  → useReadSchema()
```

**Examples:**

- `SELECT`, `COUNT`, `EXISTS` → **useReadSchema()**
- `INSERT`, `UPDATE`, `DELETE` → **useWriteSchema()**

---

## 📊 Resource Limits

**Per test file:**

- 1 READ schema (shared)
- 7 WRITE schemas (unique per test)
- **Max 7 write tests per file**

**If exceeded:**

```typescript
// Option 1: Split file
user-crud.test.ts (4 write tests)
user-validation.test.ts (3 write tests)

// Option 2: Increase capacity
export const SCHEMAS_PER_CONTAINER = 16; // Was 8
```

---

## 🐛 Common Issues

| Error                            | Fix                                          |
| -------------------------------- | -------------------------------------------- |
| `Docker connection refused`      | Start Docker Desktop                         |
| `Timeout waiting for infra file` | Check globalSetup in vitest.config.ts        |
| `SCHEMA EXHAUSTION`              | Split file or increase SCHEMAS_PER_CONTAINER |
| `No schemas for service`         | Add service to SERVICES array                |
| `Memory leak`                    | Add `afterAll(async () => await cleanup())`  |

---

## 🎯 Mandatory Checklist

Every test file MUST have:

- [ ] `createSchemaAllocator("service-name")`
- [ ] Schema-qualified queries: `"${schemaName}".table`
- [ ] `useReadSchema()` for SELECT-only
- [ ] `useWriteSchema()` for modifications
- [ ] `afterAll(async () => await cleanup())`

---

## 📈 Expected Results

**Performance:**

- ~6x faster (6 parallel workers)
- Setup: 60 seconds (one-time)
- Per test: <100ms (after client cache)

**Reliability:**

- 100% consistent (no flaky tests)
- True isolation (no data pollution)
- No manual cleanup needed

---

## 📚 Full Documentation

Located in: `_setup_vitest/`

- **00_README.md** - Overview
- **01_ARCHITECTURE_OVERVIEW.md** - Deep dive
- **02_INSTALLATION_GUIDE.md** - Step-by-step setup
- **03_CONFIGURATION_FILES.md** - Line-by-line explanations
- **04_WRITING_TESTS.md** - Patterns & best practices
- **05_TROUBLESHOOTING.md** - Error solutions
- **06_MIGRATION_GUIDE.md** - Converting existing tests
- **DOCUMENTATION_SUMMARY.md** - Complete overview

---

## 💡 Pro Tips

1. **Start small:** Migrate 1-2 test files first
2. **Monitor logs:** Look for schema allocation messages
3. **Check capacity:** Calculate write tests before coding
4. **Use READ wisely:** Share schemas for efficiency
5. **Cleanup always:** Memory leaks without it
6. **Schema qualify:** Always use `"${schemaName}".table`

---

**Full docs:** `_setup_vitest/00_README.md`  
**Need help?** Check `_setup_vitest/05_TROUBLESHOOTING.md`

🚀 **Happy Testing!**
