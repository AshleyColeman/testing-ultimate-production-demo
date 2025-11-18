---
name: place-test-file
description: >
  Determine test file location, naming, and structure within the test orchestrator.
  Use when: creating a new test file (where to put it, how to name it, what structure to use).
  Fits in workflow: first skill; determines file location before generating test content.
---

# Place Test File

**PURPOSE**: Determine correct file location, naming pattern, and structure.
Tests are co-located with source files and auto-discovered by the test runner.

## When to use

- **Triggers**: "place file", "file location", "naming convention", "where does test go"
- **Input**: Service name, action/feature name
- **Output**: File path (e.g., `src/services/users/__test__/createUserAction.action.test.ts`)
- **Not for**: Organizing files; they auto-discover
- **Required**: Before generating any test file

## Quick start

1. **CRITICAL**: Always check if `src/services/[serviceName]/__test__/` directory exists
2. If directory doesn't exist, create it: `mkdir -p src/services/[serviceName]/__test__/`
3. **CO-LOCATE** tests next to source files: `src/services/[serviceName]/__test__/`
4. **NEVER** use legacy location: `src/__tests__/microservices/`
5. Name format: `[actionName].action.test.ts` for actions, `[serviceName].service.test.ts` for services
6. Example: `createUserAction.action.test.ts`, `searchUsersAction.action.test.ts`

## Workflow

- **Gather**: Know service name (users, auth, payment, inventory, analytics, notification) and action name
- **Check Directory**: Verify `src/services/[serviceName]/__test__/` exists
- **Create Directory**: If missing, create with: `mkdir -p src/services/[serviceName]/__test__/`
- **Execute**: Place test file in service's __test__ folder with proper naming
- **Validate**: File is in correct location and imports work

## File & tool use

- Read: Look at examples in `src/services/[serviceName]/__test__/` for naming pattern
- Bash: Use `mkdir -p src/services/[serviceName]/__test__/` if directory doesn't exist
- Prefer: Co-location with source files (tests next to actions they test)

## Guardrails

- **ALWAYS** check/create the `__test__` directory before creating test files
- **ALWAYS** co-locate tests: `src/services/[serviceName]/__test__/`
- **NEVER** use legacy location: `src/__tests__/microservices/`
- **ONE** test file per action: `[actionName].action.test.ts`
- **SAME-LEVEL imports**: Use relative paths: `"../actions"`, `"../_data/userSchema"`
- **CROSS-DIRECTORY imports**: Use @/ alias: `"@/tests/schemaAllocator"`, `"@/__tests__/shared/testHelpers"` (for generateTestData only)
- **TYPESCRIPT SAFETY**: Import `type TestContext` and type all parameters: `async ({ db, schemaName }: TestContext)`
- **REQUIRED IMPORTS**: Always include `import { PrismaClient } from "@prisma/client"`
- **CLEAN CODE**: Use @/ alias for cross-directory imports, relative for same-level clarity

## Examples

**Example A**: User service action test

```
Service: users
Action: createUserAction
Directory: src/services/users/__test__/ (create if missing)
File: src/services/users/__test__/createUserAction.action.test.ts
```

**Example B**: User service search action test

```
Service: users
Action: searchUsersAction
Directory: src/services/users/__test__/ (create if missing)
File: src/services/users/__test__/searchUsersAction.action.test.ts
```

**Example C**: Auth service action test

```
Service: auth
Action: loginAction
Directory: src/services/auth/__test__/ (create if missing)
File: src/services/auth/__test__/loginAction.action.test.ts
```

**Example D**: Payment service test

```
Service: payment
Action: processPaymentAction
Directory: src/services/payment/__test__/ (create if missing)
File: src/services/payment/__test__/processPaymentAction.action.test.ts
```

## Troubleshooting

- **Directory doesn't exist** → Create it with: `mkdir -p src/services/[serviceName]/__test__/`
- **Module not found errors** → Use @/ alias for cross-directory: `"@/tests/schemaAllocator"` (NOT relative paths)
- **TypeScript implicit any errors** → Add type annotation: `async ({ db, schemaName }: TestContext)`
- **Missing PrismaClient** → Add import: `import { PrismaClient } from "@prisma/client"`
- **Prisma query type errors** → Type raw queries: `db.$queryRawUnsafe<UserRow[]>(...)` (not untyped)
- **Path alias not working** → Verify both `tsconfig.json` and `vitest.config.ts` have `@/` alias configured
- **Import errors** → Use relative for same-level (`../actions`), @/ for cross-directory (`@/tests/schemaAllocator`)
- **Name conflicts** → Each action gets its own file: `[actionName].action.test.ts`
- **Wrong location** → Tests should be next to source files, NOT in src/__tests__/microservices/
- **Mixed import styles** → Use relative for same-level clarity, @/ for cross-directory consistency
- **Unknown type errors** → Add typing to Prisma queries: `await db.$queryRawUnsafe<UserRow[]>(...)` not `await db.$queryRawUnsafe(...)`

## Changelog

- v0.2 – Refactored to minimal skill format
- v0.1 – Orchestrator pattern documentation

---

**Related**: access-infrastructure, verify-test-quality
**Next**: perform-crud-operations (after file is placed)

---

## Auto-Discovery Pattern

```
src/
├── services/
│   ├── users/
│   │   ├── __test__/                    ← Test files for user service
│   │   │   ├── createUserAction.action.test.ts
│   │   │   ├── searchUsersAction.action.test.ts
│   │   │   └── updateUserAction.action.test.ts
│   │   ├── actions.ts                  ← Server actions
│   │   └── _data/                      ← Data layer
│   │
│   ├── auth/
│   │   ├── __test__/                    ← Test files for auth service
│   │   │   ├── loginAction.action.test.ts
│   │   │   └── registerAction.action.test.ts
│   │   ├── actions.ts                  ← Server actions
│   │   └── _data/                      ← Data layer
│   │
│   └── payment/
│       ├── __test__/                    ← Test files for payment service
│       │   └── processPaymentAction.action.test.ts
│       ├── actions.ts                  ← Server actions
│       └── _data/                      ← Data layer
│
└── __tests__/                            ← Legacy location (NO LONGER USED)
    └── shared/                          ← Shared test utilities only
```

**Rule**: Tests are CO-LOCATED with source files. Test runner discovers all `src/services/**/__test__/*.test.ts` files automatically. No registration needed.
getInfrastructure,
getSchemasByService,
recordTestExecution,
} from "../shared/testInfrastructure";
import {
simulateProductionOperation,
generateTestData,
} from "../shared/testHelpers";

describe("Auth Service - Login", () => {
// 10 tests here
it("should handle username password [Test 1/10]", async () => {
const infra = await getInfrastructure(); // Already initialized!
const schemas = await getSchemasByService("auth"); // Already created!
// Your test code...
});
// ... 9 more tests
});

```

---

## File Naming Convention

```

src/**tests**/microservices/

auth-login.test.ts ✅ Good
auth-logout.test.ts ✅ Good
auth-registration.test.ts ✅ Good
payment-processing.test.ts ✅ Good
inventory-adjustment.test.ts ✅ Good

test.ts ❌ Bad (too generic)
auth.ts ❌ Bad (missing .test.ts)
auth_login.test.ts ❌ Bad (underscore instead of dash)

```

The orchestrator finds all `*.test.ts` files using glob pattern: `src/__tests__/microservices/**/*.test.ts`

---

## Directory Structure

```

src/**tests**/
├── ultimateProductionDemo.test.ts ← Master orchestrator (don't edit)
│
├── shared/
│ ├── testInfrastructure.ts ← Infrastructure singleton
│ └── testHelpers.ts ← Helper functions
│
└── microservices/
├── auth-login.test.ts ← Your tests go here
├── auth-logout.test.ts ← Your tests go here
├── auth-registration.test.ts ← Your tests go here
├── payment-processing.test.ts ← Your tests go here
├── inventory-adjustment.test.ts ← Your tests go here
└── ... (many more)

````

---

## How Auto-Discovery Works

### Step 1: Glob Pattern

The orchestrator finds all test files:

```typescript
// In ultimateProductionDemo.test.ts
const pattern = "src/__tests__/microservices/**/*.test.ts";
const testFiles = await glob(pattern);

// Returns array of all test files:
// [
//   "src/__tests__/microservices/auth-login.test.ts",
//   "src/__tests__/microservices/auth-logout.test.ts",
//   "src/__tests__/microservices/payment-processing.test.ts",
//   ... (all matching files)
// ]
````

### Step 2: Dynamic Import

For each file, it's imported:

```typescript
for (const testFile of testFiles) {
  try {
    await import(testFile); // Your tests run here! ✓
  } catch (error) {
    // Handle import errors
  }
}
```

### Step 3: Your Tests Execute

When your file is imported, your `describe()` and `it()` blocks run:

```typescript
// When auth-login.test.ts is imported:
describe("Auth Service - Login", () => {
  // Registered
  it("should handle username password", () => {
    // Registered
    // Test code runs when Vitest executes the test
  });
});
```

---

## What You Need to Do

### ✅ DO:

1. **Create file in correct location**: `src/__tests__/microservices/<feature>.test.ts`
2. **Name file with dashes**: `auth-login.test.ts` not `auth_login.test.ts`
3. **Include .test.ts suffix**: Required for glob pattern
4. **Use describe + it**: Standard Vitest syntax
5. **Import from shared/**: `getInfrastructure()`, etc.

### ❌ DON'T:

1. **Edit ultimateProductionDemo.test.ts** — It finds your files automatically
2. **Change glob pattern** — It's tuned to find all microservice tests
3. **Create files outside microservices/** — They won't be discovered
4. **Export your tests** — Just use describe/it
5. **Initialize infrastructure** — Orchestrator does it

---

## Auto-Discovery Examples

### New File: Payment Processing

```typescript
// src/__tests__/microservices/payment-processing.test.ts
import { describe, it, expect } from "vitest";
// ...

describe("Payment Service - Processing", () => {
  it("processes payment successfully [Test 1/10]", async () => {
    // Your test code
  });
  // ... 9 more tests
});
```

**Result**: Automatically discovered and run! ✅

No changes needed to orchestrator.

### New File: Inventory Adjustment

```typescript
// src/__tests__/microservices/inventory-adjustment.test.ts
import { describe, it, expect } from "vitest";
// ...

describe("Inventory Service - Adjustment", () => {
  it("adjusts stock level [Test 1/10]", async () => {
    // Your test code
  });
  // ... 9 more tests
});
```

**Result**: Automatically discovered and run! ✅

No changes needed to orchestrator.

---

## Test Count Tracking

### How Total Tests are Counted

```
Master Orchestrator discovers all *.test.ts files in microservices/

Before: 52 files × 10 tests = 520 tests
├── auth-*.test.ts (10 files × 10 = 100 tests)
├── payment-*.test.ts (10 files × 10 = 100 tests)
├── inventory-*.test.ts (10 files × 10 = 100 tests)
├── analytics-*.test.ts (10 files × 10 = 100 tests)
├── notification-*.test.ts (10 files × 10 = 100 tests)
└── error-demo.test.ts (2 files × 10 = 20 tests)

After you add 1 file: 53 files × 10 tests = 530 tests ✅
```

The orchestrator automatically includes your new file!

---

## Running Everything

To run all tests (including yours):

```bash
npx vitest run src/__tests__/ultimateProductionDemo.test.ts
```

This runs:

1. ✅ Master orchestrator setup
2. ✅ All 53 test files (including your new ones)
3. ✅ All 530 tests
4. ✅ Cleanup

---

## Key Points

1. **Orchestrator finds your tests automatically** — No manual registration
2. **Just create files with correct naming** — They're included
3. **Infrastructure is pre-initialized** — Use getInfrastructure()
4. **No changes needed to orchestrator** — It handles discovery
5. **Glob pattern is fixed** — All microservices/\*_/_.test.ts files

---

## Troubleshooting

### ❌ "My test file isn't running"

Check:

1. File is in `src/__tests__/microservices/` directory
2. File ends with `.test.ts`
3. File contains `describe()` blocks
4. No syntax errors (check `npm run build`)

### ❌ "Infrastructure isn't initialized in my test"

Make sure you call:

```typescript
const infra = await getInfrastructure();
```

Don't create your own infrastructure!

### ❌ "Test count is different than expected"

The orchestrator reports actual test count:

```
Found 53 test files
✅ All 53 files loaded successfully (530 tests executed)
```

Count = (number of .test.ts files) × 10

---

**Next**: Read `checklist-integration.md` to verify your tests are ready.
