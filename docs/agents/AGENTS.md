# INTEGRATION AGENT — Rules for Test Generation

**Purpose:** Agent generates **integration tests only** — no service code changes.

Tests use **real PostgreSQL databases**, **shared infrastructure**, and **production-like delays**.

## Workflow (Plan‑First)

### 1. Plan Phase

- Understand the service/feature to be tested (auth, payment, inventory, analytics, notification)
- Review existing test patterns in `src/__tests__/microservices/`
- Check for API contracts, validation rules, and error scenarios
- Plan the test structure:
  - **File location**: `src/__tests__/microservices/<feature>.test.ts`
  - **Test count**: Always 10 tests per file (matching pattern)
  - **Service focus**: Which service(s) to test?
  - **Schema requirement**: Which service schema to use? (auth, payment, inventory, analytics, notification)
  - **Error cases**: What can go wrong? (validation, timeouts, constraint violations, duplicate keys, etc.)

### 2. Generate Phase

- Generate tests following the orchestrator pattern
- **Framework**: Vitest
- **Database**: Prisma Client + Real PostgreSQL (from shared infrastructure)
- **Location**: `src/__tests__/microservices/<feature>.test.ts`
- **Pattern**: Follow existing file structure (10 tests, production delays, infrastructure singleton access)
- Output **test code only** — no service code changes

### 3. Auto-Discovery & Integration

- Tests are automatically discovered by glob in orchestrator (`src/__tests__/microservices/*.test.ts`)
- Tests are dynamically imported and executed as part of the 530-test suite
- **No orchestrator changes needed** — new tests are included automatically
- Infrastructure is already initialized by master orchestrator

### 4. Verify

- Human reviews generated test code for:
  - ✅ No service code changes
  - ✅ Uses `getInfrastructure()` to access shared containers
  - ✅ Uses `getSchemasByService()` to pick random schema
  - ✅ Uses Prisma for database operations (real DB, not mocks)
  - ✅ Includes realistic production delays (50ms-10s)
  - ✅ Includes `recordTestExecution()` for metrics
  - ✅ Covers happy path + error scenarios
  - ✅ No external network calls
  - ✅ No console warnings
- All 10 tests should pass
- New test count added to total (e.g., 530 → 540 with one new file)

## Key Rules

### Infrastructure Access (Every Test)

```typescript
// EVERY TEST MUST:
// 1. Get the shared infrastructure singleton
const infra = await getInfrastructure();

// 2. Get schemas for the service being tested
const schemas = await getSchemasByService("auth"); // or "payment", "inventory", etc.

// 3. Randomly pick one schema (simulates production load distribution)
const schema = schemas[Math.floor(Math.random() * schemas.length)];

// 4. Use Prisma client from that schema to interact with database
const result = await schema.prisma.user.create({ data: userData });
```

### Test Structure (Always 10 Tests Per File)

- Each file = 1 feature/operation = 10 tests
- Naming: `[Test 1/10]`, `[Test 2/10]`, ..., `[Test 10/10]`
- Mix happy paths and error scenarios:
  - 6-7 happy path variations
  - 3-4 error/edge case scenarios

### Realistic Production Delays (Every Test)

```typescript
// Every async operation should include realistic delays
const executionTime = await simulateProductionOperation(); // Returns 50-10000ms
expect(executionTime).toBeGreaterThan(0);
expect(executionTime).toBeLessThan(12000); // With safety buffer
```

### Test Data Factories (Always Use Them)

```typescript
// Don't hardcode data — use factories
const testData = generateTestData("user"); // Returns realistic data
const testData = generateTestData("session");
const testData = generateTestData("transaction");

// Or use Prisma to insert real data
const user = await schema.prisma.user.create({
  data: { email: "test@example.com", role: "user" },
});
```

### Error Handling (Test All Scenarios)

- ✅ Validation errors (invalid input, missing required fields)
- ✅ Not found errors (querying non-existent records)
- ✅ Constraint violations (unique constraint, foreign key)
- ✅ Authorization errors (if applicable)
- ✅ Timeout scenarios (operation takes too long)
- ✅ Concurrent operations (race conditions)

### Database Operations (Prisma Patterns)

```typescript
// CREATE
await schema.prisma.serviceLog.create({ data: userData });

// READ
const record = await schema.prisma.serviceLog.findUnique({ where: { id: 1 } });
const records = await schema.prisma.serviceLog.findMany({ where: { ... } });

// UPDATE
await schema.prisma.serviceLog.update({ where: { id: 1 }, data: updates });

// DELETE
await schema.prisma.serviceLog.delete({ where: { id: 1 } });

// COUNT
const count = await schema.prisma.serviceLog.count({ where: { ... } });
```

### Recording Test Execution (Every Test)

```typescript
// After each test operation, record the execution
await recordTestExecution(
  "auth-login", // file name
  "username-password", // operation name
  "success", // status
  executionTime, // how long it took
  { testNumber: 1, schema: schema.schemaName } // metadata
);
```

### Service Boundaries (Focus on One Service)

- Each file should focus on **one service**: auth, payment, inventory, analytics, or notification
- One file = One feature/operation in that service
- If you need to test interactions between services, create a separate file for that workflow

### No External Dependencies

- ✅ All data comes from shared infrastructure (database)
- ✅ No real API calls
- ✅ No file system access
- ✅ No environment variables needed (all provided by infrastructure)
- ❌ No HTTP calls to external services
- ❌ No third-party API mocking (use database for all state)

### Determinism (No Flaky Tests)

- ✅ Use explicit Prisma queries instead of timeouts
- ✅ Random schema selection (already handled by pattern)
- ✅ Production delays are randomized (already in simulateProductionOperation)
- ❌ Don't add extra `await new Promise(...)` delays
- ❌ Don't use `setTimeout` in assertions
- ❌ Don't rely on timing for logic (use Prisma findMany + filtering)
