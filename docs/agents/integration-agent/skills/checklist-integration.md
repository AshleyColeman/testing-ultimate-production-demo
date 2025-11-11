---
name: verify-test-quality
description: >
  Validate test structure, coverage, and quality before/after generation.
  Use when: before generating a test (pre-generation checklist) or after (post-generation validation).
  Fits in workflow: final validation skill, after perform-crud-operations and record-test-metrics.
---

# Verify Test Quality

**PURPOSE**: Ensure tests follow patterns and quality standards before running.
Pre-generation checklist ensures readiness; post-generation validates output.

## When to use

- **Triggers**: "validate test", "before generating", "after generation", "checklist", "quality check"
- **Input**: Test file (generated or planned), service name, list of tests
- **Output**: Checklist results (pass/fail items)
- **Not for**: Running actual tests; use vitest for that
- **Required**: Before committing any test file

## Quick start

1. **Pre-generation**: Use checklist before you start writing/generating
2. **Post-generation**: Use checklist after test file is created
3. **Verify**: Run `npm run build` and `npm run lint` to catch errors

## Workflow

- **Gather**: Identify service name, understand test patterns, review test file
- **Execute**: Go through relevant checklist (pre or post), mark items as done
- **Validate**: Ensure all checks pass before committing

## File & tool use

- Read: Service-specific rules (auth, payment, inventory, analytics, notification)
- Run: `npm run build` (TypeScript), `npm run lint` (ESLint), `npx vitest run <file>` (tests)
- Prefer: Running build/lint before manual code review

## Guardrails

- Use pre-generation checklist for planning
- Use post-generation checklist for validation
- Don't skip any items (they catch real issues)
- Run npm build/lint before submitting

## Examples

**Example A**: Pre-generation validation

```
✅ Service identified (auth)
✅ File name determined (auth-login.test.ts)
✅ Infrastructure understanding confirmed
✅ Ready to generate
```

**Example B**: Post-generation validation

```
✅ File created in correct location
✅ Has 10 tests with [Test N/10] markers
✅ All imports present and correct
✅ npm run build passes (no TypeScript errors)
```

**Example C**: Common error found

```
❌ Test uses hardcoded UUID (should use generateTestData)
→ Fix: Replace UUID with generateTestData("user")
```

## Troubleshooting

- **Test has TypeScript errors** → Run `npm run build`, fix reported errors
- **Test has ESLint warnings** → Run `npm run lint`, follow suggestions
- **Missing infrastructure call** → Add `const infra = await getInfrastructure()` as first line
- **Test doesn't record metrics** → Add `recordTestExecution(...)` before closing test

## Changelog

- v0.2 – Refactored to minimal skill format, split into pre/post sections
- v0.1 – Original comprehensive checklist

---

**Related**: perform-crud-operations, record-test-metrics, place-test-file
**Next**: None — this is the final validation skill

---

## Pre-Generation Checklist (Before You Start)

Use this to ensure you're ready to generate a test file:

### ✅ File Planning

- [ ] Service identified (auth, payment, inventory, analytics, notification)
- [ ] Feature identified (e.g., "login" for auth, "processing" for payment)
- [ ] File name determined: `<service>-<feature>.test.ts`
- [ ] File location confirmed: `src/__tests__/microservices/<file-name>`
- [ ] No existing file with this name (check for duplicates)

### ✅ Infrastructure Understanding

- [ ] Can list 5 services: auth, payment, inventory, analytics, notification
- [ ] Can list 4 schemas per service (instance1-4)
- [ ] Understand: infrastructure initialized once, reused by all tests
- [ ] Know how to call: `const infra = await getInfrastructure()`
- [ ] Know how to call: `const schemas = await getSchemasByService("SERVICE")`

### ✅ Database Understanding

- [ ] Know which tables exist in target service's schema
- [ ] Know table relationships (foreign keys, etc.)
- [ ] Have write permission to all tables
- [ ] Know primary key column names
- [ ] Understand: schema.prisma is read-only, Prisma client manages operations

### ✅ Test Pattern Understanding

- [ ] Know file will have exactly 10 tests
- [ ] Know each test is numbered [Test 1/10] through [Test 10/10]
- [ ] Know each test is independent (cleanup handled)
- [ ] Know tests run in order within file
- [ ] Know beforeEach/afterEach not needed (automatic cleanup)

### ✅ Operation Types

- [ ] Understand CRUD operations (Create, Read, Update, Delete)
- [ ] Can write Prisma queries: create, findUnique, findMany, update, delete
- [ ] Can handle filters in findMany
- [ ] Can handle updates with where clause
- [ ] Can use deleteMany for cleanup

### ✅ Test Data Preparation

- [ ] Know generateTestData() is available
- [ ] Can list test data types: user, session, transaction, payment, order, product, coupon, notification
- [ ] Know generateTestData() creates random data each time
- [ ] Can override default values: `{...defaultData, email: "custom@test.com"}`
- [ ] Know not to hardcode test data

### ✅ Timing & Delays

- [ ] Know production delays are 50-10000ms
- [ ] Know to call: `const time = await simulateProductionOperation()`
- [ ] Can write timing assertions: `expect(time).toBeLessThan(12000)`
- [ ] Understand timing distribution (70% fast, 20% medium, 10% slow)
- [ ] Know delays are important for realistic testing

### ✅ Error Scenarios

- [ ] Know 3-4 tests should test error cases
- [ ] Can list error types: validation, not-found, duplicate, constraint, timeout, concurrent, etc.
- [ ] Know how to use try/catch for error testing
- [ ] Can check error properties: `expect(error.code).toBe("P2002")`
- [ ] Understand: errors should be testable, not cause test failure

### ✅ Multi-Service Testing (if applicable)

- [ ] Know which other services interact with target service
- [ ] Can get schemas for both services
- [ ] Can reference data from one service in another
- [ ] Understand foreign key relationships
- [ ] Know to test cross-service workflows

### ✅ Recording & Logging

- [ ] Know recordTestExecution() is available
- [ ] Know signature: recordTestExecution(testName, scenario, status, time, metadata)
- [ ] Can create metadata object: `{testNumber: 1, schema: schema.schemaName}`
- [ ] Know when to record: after test passes or fails
- [ ] Understand: recording is for observability, not test logic

### ✅ Test Coverage Planning

- [ ] Planned at least 5 happy-path tests (success cases)
- [ ] Planned at least 3-4 error tests (failure cases)
- [ ] Planned at least 1 multi-service test (if applicable)
- [ ] Planned assertions for: success, errors, timing, data integrity
- [ ] Total = 10 tests

---

## Post-Generation Checklist (After Tests are Created)

Use this to verify generated tests are correct before running:

### ✅ File Structure

- [ ] File created in correct location: `src/__tests__/microservices/<name>.test.ts`
- [ ] File name matches pattern: lowercase with dashes, no underscores
- [ ] File has exactly 10 test blocks (count `it("` occurrences)
- [ ] All tests numbered: [Test 1/10] through [Test 10/10]
- [ ] describe() block at top level
- [ ] All tests inside describe() block

### ✅ Imports & Setup

- [ ] Has import from "vitest": `describe`, `it`, `expect`
- [ ] Imports from shared: `getInfrastructure`, `getSchemasByService`
- [ ] Imports from helpers: `simulateProductionOperation`, `generateTestData`
- [ ] Imports from helpers: `recordTestExecution`
- [ ] No other imports (no external APIs, no MSW, no mocks)
- [ ] No database setup code (infrastructure is pre-initialized)

### ✅ Test Structure (Per Test)

For each test, verify:

- [ ] Has unique test name describing what it tests
- [ ] Has [Test N/10] marker in test name
- [ ] `async` keyword on test function
- [ ] First line: `const infra = await getInfrastructure()`
- [ ] Second line: `const schemas = await getSchemasByService("SERVICE")`
- [ ] Third line: random schema selection (or use specific schema if intentional)
- [ ] Each test is independent (doesn't depend on previous test)
- [ ] No shared state between tests
- [ ] No `beforeEach` or `afterEach` (not needed)

### ✅ Infrastructure Access

For each test, verify:

- [ ] Calls `getInfrastructure()` and stores in `infra`
- [ ] Calls `getSchemasByService()` for correct service
- [ ] Uses service name from: auth, payment, inventory, analytics, notification
- [ ] Selects random schema: `schemas[Math.floor(Math.random() * schemas.length)]`
- [ ] Stores selected schema for use
- [ ] Never creates own schema or container
- [ ] Never calls infrastructure setup code

### ✅ Database Operations

For each test, verify:

- [ ] Uses `schema.prisma` to access database
- [ ] Only uses valid operations: create, findUnique, findMany, findFirst, update, updateMany, delete, deleteMany, count
- [ ] All operations are `await`ed
- [ ] Operations match target service tables
- [ ] CREATE operations use valid table names
- [ ] READ operations use valid filters
- [ ] UPDATE operations have both `data` and `where`
- [ ] DELETE operations have valid `where` clause
- [ ] No raw SQL queries

### ✅ Test Data

For each test, verify:

- [ ] Uses `generateTestData(TYPE)` for data generation
- [ ] Valid types only: user, session, transaction, payment, order, product, coupon, notification
- [ ] Data is generated fresh each time (not hardcoded)
- [ ] Can override defaults if needed: `{...generated, field: "value"}`
- [ ] Never uses hardcoded UUIDs or IDs
- [ ] Never uses hardcoded timestamps
- [ ] Never uses hardcoded email addresses (except custom overrides)

### ✅ Timing & Delays

For each test, verify:

- [ ] Calls `const time = await simulateProductionOperation()`
- [ ] Uses the returned `time` value in assertions
- [ ] Has assertion: `expect(time).toBeLessThan(12000)` or similar
- [ ] Never hardcodes delays (use simulateProductionOperation)
- [ ] Never uses `setTimeout`
- [ ] Timing assertions are realistic: < 12000ms (10s + buffer)

### ✅ Error Handling (in error tests)

For error tests, verify:

- [ ] Uses try/catch block
- [ ] Operation in try block that should fail
- [ ] Error captured in catch block
- [ ] Error assertions check for specific error properties
- [ ] Assertions check: error code, error message, or error type
- [ ] Never swallows errors without testing them
- [ ] Test still passes even when operation fails

### ✅ Assertions

For each test, verify:

- [ ] Has at least 1 assertion: `expect(...)`
- [ ] Assertions are meaningful (not just `expect(result).toBeDefined()`)
- [ ] Check returned data: `expect(result.id).toBeDefined()`
- [ ] Check data integrity: `expect(result.email).toBe(userData.email)`
- [ ] Check operations worked: `expect(result).toHaveProperty("id")`
- [ ] Happy-path tests assert success
- [ ] Error tests assert errors occurred

### ✅ Recording (Observability)

For each test, verify:

- [ ] Has call to `recordTestExecution()`
- [ ] First param: test name (e.g., "auth-login")
- [ ] Second param: scenario/operation (e.g., "username-password")
- [ ] Third param: status ("success" or "failure")
- [ ] Fourth param: execution time from simulateProductionOperation
- [ ] Fifth param: metadata object with testNumber and schema name
- [ ] Example: `recordTestExecution("auth-login", "username-password", "success", time, {testNumber: 1, schema: schema.schemaName})`

### ✅ Multi-Service (if applicable)

If test uses multiple services, verify:

- [ ] Gets schemas for both services
- [ ] Creates data in first service
- [ ] References that data in second service
- [ ] Foreign key relationships are valid
- [ ] Both services share same schema naming pattern
- [ ] Service names are valid (auth, payment, inventory, analytics, notification)

### ✅ Error Scenarios

Verify across all 10 tests:

- [ ] At least 3-4 tests are error scenarios
- [ ] Error types covered include: validation, not-found, duplicate
- [ ] Each error test has try/catch
- [ ] Error messages are specific
- [ ] Errors are testable without breaking test

### ✅ Code Quality

For entire file, verify:

- [ ] No TypeScript errors (run `npm run build`)
- [ ] No ESLint warnings
- [ ] Consistent indentation (2 spaces)
- [ ] Consistent code style
- [ ] No commented-out code
- [ ] No TODO comments
- [ ] No console.log statements
- [ ] All variables properly typed or inferred
- [ ] No unused imports
- [ ] No unused variables

### ✅ Service-Specific Rules

Verify for your service:

**Auth Service:**

- [ ] Tests cover: login, logout, registration, token refresh, MFA, password reset, permissions
- [ ] Uses auth tables: users, sessions, tokens, permissions
- [ ] Password operations don't expose plaintext

**Payment Service:**

- [ ] Tests cover: processing, refunds, validation, error handling
- [ ] Uses payment tables: transactions, invoices, payments
- [ ] Amount fields are verified

**Inventory Service:**

- [ ] Tests cover: stock adjustment, reservation, allocation, transfer
- [ ] Uses inventory tables: products, stock, reservations, transfers
- [ ] Quantity operations are atomic

**Analytics Service:**

- [ ] Tests cover: events, metrics, reporting, cohorts
- [ ] Uses analytics tables: events, metrics, dashboards
- [ ] Timestamps are realistic

**Notification Service:**

- [ ] Tests cover: email, SMS, push, in-app, scheduling
- [ ] Uses notification tables: notifications, templates, preferences
- [ ] Delivery status tracking works

### ✅ Ready to Run?

- [ ] File has no syntax errors
- [ ] All imports resolve
- [ ] All function calls are valid
- [ ] All assertions are correct
- [ ] File would not break other tests
- [ ] File follows all patterns in skills documentation
- [ ] **YES** → Ready to commit and run!

---

## Common Issues & Fixes

### ❌ Test uses hardcoded UUID

```typescript
// ❌ WRONG
const userId = "550e8400-e29b-41d4-a716-446655440000";

// ✅ CORRECT
const userData = generateTestData("user");
await schema.prisma.user.create({ data: userData });
// Use generated ID
```

### ❌ Test doesn't check for errors

```typescript
// ❌ WRONG
await schema.prisma.user.create({ data: invalidData });

// ✅ CORRECT
let error;
try {
  await schema.prisma.user.create({ data: invalidData });
} catch (e) {
  error = e;
}
expect(error).toBeDefined();
```

### ❌ Test doesn't record execution

```typescript
// ❌ WRONG
expect(time).toBeLessThan(12000);

// ✅ CORRECT
expect(time).toBeLessThan(12000);
await recordTestExecution("auth-login", "username-password", "success", time, {
  testNumber: 1,
  schema: schema.schemaName,
});
```

### ❌ Test is missing timing

```typescript
// ❌ WRONG
const user = await schema.prisma.user.findUnique({ where: { id } });
expect(user).toBeDefined();

// ✅ CORRECT
const time = await simulateProductionOperation();
const user = await schema.prisma.user.findUnique({ where: { id } });
expect(user).toBeDefined();
expect(time).toBeLessThan(12000);
```

### ❌ Test doesn't get infrastructure

```typescript
// ❌ WRONG
describe("Auth", () => {
  it("logs in", async () => {
    const user = await schema.prisma.user.create({...});
  });
});

// ✅ CORRECT
describe("Auth", () => {
  it("logs in", async () => {
    const infra = await getInfrastructure();
    const schemas = await getSchemasByService("auth");
    const schema = schemas[Math.floor(Math.random() * schemas.length)];
    const user = await schema.prisma.user.create({...});
  });
});
```

---

## Verification Commands

Run these to verify your test file:

```bash
# Check TypeScript errors
npm run build

# Check ESLint issues
npm run lint

# Run just your test file
npx vitest run src/__tests__/microservices/<your-file>.test.ts

# Run all tests
npx vitest run src/__tests__/ultimateProductionDemo.test.ts
```

---

**Before generation**: Use pre-generation checklist
**After generation**: Use post-generation checklist
**Before committing**: Run verification commands

✅ All checks passed? → Ready to ship!
