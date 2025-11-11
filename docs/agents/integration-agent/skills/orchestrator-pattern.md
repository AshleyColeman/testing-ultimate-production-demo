---
name: place-test-file
description: >
  Determine test file location, naming, and structure within the test orchestrator.
  Use when: creating a new test file (where to put it, how to name it, what structure to use).
  Fits in workflow: first skill; determines file location before generating test content.
---

# Place Test File

**PURPOSE**: Determine correct file location, naming pattern, and structure.
The orchestrator auto-discovers and runs files in `src/__tests__/microservices/<name>.test.ts`.

## When to use

- **Triggers**: "place file", "file location", "naming convention", "where does test go"
- **Input**: Service name, feature name
- **Output**: File path (e.g., `src/__tests__/microservices/auth-login.test.ts`)
- **Not for**: Organizing files; they auto-discover
- **Required**: Before generating any test file

## Quick start

1. File goes in: `src/__tests__/microservices/`
2. Name format: `<service>-<feature>.test.ts` (kebab-case, lowercase)
3. Example: `auth-login.test.ts`, `payment-checkout.test.ts`

## Workflow

- **Gather**: Know service name (auth, payment, inventory, analytics, notification) and feature
- **Execute**: Place file in microservices/ folder with kebab-case name
- **Validate**: File is in correct location and imports work

## File & tool use

- Read: Look at examples in `src/__tests__/microservices/` for naming pattern
- Run: None required
- Prefer: Auto-discovery (orchestrator finds files automatically)

## Guardrails

- Always use kebab-case (auth-login, not auth_login or authLogin)
- Always place in microservices/ folder (not in examples/)
- File name = <service>-<feature>, not <service>-<feature>-test
- Don't create new folders (use microservices/)

## Examples

**Example A**: Auth login test

```
Service: auth
Feature: login
File: src/__tests__/microservices/auth-login.test.ts
```

**Example B**: Payment checkout

```
Service: payment
Feature: checkout
File: src/__tests__/microservices/payment-checkout.test.ts
```

**Example C**: Inventory transfer

```
Service: inventory
Feature: transfer
File: src/__tests__/microservices/inventory-transfer.test.ts
```

## Troubleshooting

- **File not discovered by orchestrator** → Check location (must be src/**tests**/microservices/\*.test.ts)
- **Import errors** → Verify file is in microservices/ folder and imports are correct
- **Name conflicts** → Check if file already exists; use different feature name

## Changelog

- v0.2 – Refactored to minimal skill format
- v0.1 – Orchestrator pattern documentation

---

**Related**: access-infrastructure, verify-test-quality
**Next**: perform-crud-operations (after file is placed)

---

## Auto-Discovery Pattern

```
src/__tests__/
├── microservices/              ← Your test files go here
│   ├── auth-login.test.ts      ← Discovered automatically
│   ├── auth-mfa.test.ts
│   ├── payment-checkout.test.ts
│   ├── inventory-transfer.test.ts
│   └── ... (all *.test.ts files)
└── ultimateProductionDemo.test.ts  ← Master orchestrator
    (discovers and runs all files above)
```

**Rule**: Save file in microservices/, orchestrator finds it automatically. No registration needed.
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
