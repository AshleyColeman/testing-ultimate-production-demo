---
name: include-realistic-delays
description: >
  Add realistic timing between operations to simulate production behavior.
  Use when: every CRUD operation should have timing to catch race conditions and timeouts.
  Fits in workflow: wrap perform-crud-operations with delays and timing assertions.
---

# Include Realistic Delays

**PURPOSE**: Simulate real production latency (50-10000ms) to catch timing bugs.
Operations without delays (0ms) miss race conditions, timeout handlers, circuit breakers.

## When to use

- **Triggers**: "add delay", "realistic timing", "simulate production", "catch race condition"
- **Input**: Executed operation (database query, API call)
- **Output**: executionTime value (milliseconds); use in assertions
- **Not for**: Actual delays (don't use setTimeout); this simulates delays
- **Required**: Every test should have at least one timing assertion

## Quick start

1. Call: `const time = await simulateProductionOperation()`
2. Execute: Do your CRUD operation
3. Assert: `expect(time).toBeLessThan(12000)`

## Workflow

- **Gather**: Know typical operation times: 70% < 500ms, 20% 500-2000ms, 10% 2000-10000ms
- **Execute**: Call simulateProductionOperation, do operation, record time
- **Validate**: Timing is within expected range; catches slow queries

## File & tool use

- Read: None required
- Run: None required
- Import: `const { simulateProductionOperation } = require("../shared/testHelpers")`

## Guardrails

- Don't use setTimeout (use simulateProductionOperation instead)
- Timing assertions are required in every test
- Timeout buffer is 12000ms (10s + 2s buffer)
- Don't hard-code operation times

## Examples

**Example A**: Timing assertion for typical operation

```typescript
it("creates user with realistic delay [Test 1/10]", async () => {
  const schema = /* schema */;
  const time = await simulateProductionOperation();

  const user = await schema.prisma.user.create({
    data: { email: "test@example.com", ... }
  });

  // Timing assertion (required)
  expect(time).toBeLessThan(12000);
  expect(user.id).toBeDefined();
});
```

**Example B**: Different assertions for different operations

```typescript
it("fetches many users [Test 2/10]", async () => {
  const schema = /* schema */;
  const time = await simulateProductionOperation();

  const users = await schema.prisma.user.findMany();

  // Large queries may take longer
  expect(time).toBeLessThan(5000);
  expect(users).toHaveLength(expect.any(Number));
});
```

**Example C**: Using time for conditional assertions

```typescript
it("query time scales with result size", async () => {
  const schema = /* schema */;
  const time = await simulateProductionOperation();

  const users = await schema.prisma.user.findMany();

  // More results = more time
  if (users.length > 100) {
    expect(time).toBeGreaterThan(500);
  } else {
    expect(time).toBeLessThan(500);
  }
});
```

## Troubleshooting

- **Test timing varies widely** → Normal (random distribution); use expect(...).toBeLessThan()
- **All operations are "fast"** → simulateProductionOperation adds realistic variation (70/20/10 split)
- **Want fixed timing** → Not recommended; realistic distribution is better for finding bugs
- **Timeout assertions failing** → Increase buffer (12000ms) or check for slow operations

## Changelog

- v0.2 – Refactored to minimal skill format
- v0.1 – Production delays pattern

---

**Related**: perform-crud-operations, test-error-scenarios
**Next**: record-test-metrics

---

## Distribution Pattern

| Range        | Percentage | Scenario                      |
| ------------ | ---------- | ----------------------------- |
| 0-500ms      | 70%        | Cache hits, simple queries    |
| 500-2000ms   | 20%        | Joins, API calls, transforms  |
| 2000-10000ms | 10%        | Analytics, batch, external    |
| 10000ms+     | 0% (rare)  | Timeouts caught by assertions |

Every test MUST have a timing assertion: `expect(time).toBeLessThan(12000)`---

## Complete Example with Delays

```typescript
import { describe, it, expect } from "vitest";
import {
  getInfrastructure,
  getSchemasByService,
  recordTestExecution,
} from "../shared/testInfrastructure";
import {
  simulateProductionOperation,
  generateTestData,
} from "../shared/testHelpers";

describe("Auth Service - Login with Realistic Delays", () => {
  it("should handle username password [Test 1/10]", async () => {
    const infra = await getInfrastructure();
    const schemas = await getSchemasByService("auth");
    const schema = schemas[Math.floor(Math.random() * schemas.length)];

    // Include production-like delay
    const executionTime = await simulateProductionOperation();

    // Generate test data
    const testData = generateTestData("user");

    // Create user in database
    const user = await schema.prisma.user.create({
      data: {
        email: testData.email,
        passwordHash: testData.passwordHash,
        role: "user",
      },
    });

    // Assertions with timing expectations
    expect(user.id).toBeDefined();
    expect(executionTime).toBeGreaterThan(0);
    expect(executionTime).toBeLessThan(12000);

    // Record metrics for observability
    await recordTestExecution(
      "auth-login",
      "username-password",
      "success",
      executionTime,
      { testNumber: 1, schema: schema.schemaName }
    );

    infra.logger.info(`✅ Auth login completed in ${executionTime}ms`);
  });

  it("should reject invalid password [Test 7/10]", async () => {
    const infra = await getInfrastructure();
    const schemas = await getSchemasByService("auth");
    const schema = schemas[Math.floor(Math.random() * schemas.length)];
    const executionTime = await simulateProductionOperation();

    // Create user
    const user = await schema.prisma.user.create({
      data: {
        email: "test@example.com",
        passwordHash: "correct-hash",
        role: "user",
      },
    });

    // Simulate password validation (happens in your application code)
    const password = "wrong-password";
    const passwordMatches = user.passwordHash === password;

    expect(passwordMatches).toBe(false);
    expect(executionTime).toBeGreaterThan(0);

    await recordTestExecution(
      "auth-login",
      "invalid-password",
      "success",
      executionTime,
      { testNumber: 7, schema: schema.schemaName }
    );
  });

  it("should handle concurrent login attempts [Test 8/10]", async () => {
    const schemas = await getSchemasByService("auth");
    const schema = schemas[Math.floor(Math.random() * schemas.length)];

    // Create a user
    const user = await schema.prisma.user.create({
      data: {
        email: "test@example.com",
        passwordHash: "hash",
        role: "user",
      },
    });

    // Simulate concurrent login attempts
    const executionTime = await simulateProductionOperation();

    // Attempt multiple sessions
    const promises = [
      schema.prisma.session.create({
        data: { userId: user.id, token: "token-1", expiresAt: new Date() },
      }),
      schema.prisma.session.create({
        data: { userId: user.id, token: "token-2", expiresAt: new Date() },
      }),
      schema.prisma.session.create({
        data: { userId: user.id, token: "token-3", expiresAt: new Date() },
      }),
    ];

    const sessions = await Promise.all(promises);

    expect(sessions).toHaveLength(3);
    expect(executionTime).toBeLessThan(12000);

    // Verify all sessions exist
    const count = await schema.prisma.session.count({
      where: { userId: user.id },
    });
    expect(count).toBe(3);
  });
});
```

---

## Timing Patterns by Operation Type

### Fast Operations (50-500ms)

```typescript
// Simple create
const user = await schema.prisma.user.create({ data: {...} });

// Find by ID
const found = await schema.prisma.user.findUnique({
  where: { id: userId },
});

// Count
const total = await schema.prisma.user.count();
```

### Medium Operations (500-2000ms)

```typescript
// Find with complex where clause
const users = await schema.prisma.user.findMany({
  where: {
    AND: [
      { role: "admin" },
      { active: true },
      { email: { contains: "example" } },
    ],
  },
});

// Update multiple fields
const updated = await schema.prisma.user.update({
  where: { id: userId },
  data: { email: "new@example.com", passwordHash: "hash", role: "admin" },
});

// Create with relations
const user = await schema.prisma.user.create({
  data: {
    email: "test@example.com",
    sessions: { create: [{ token: "..." }, { token: "..." }] },
  },
  include: { sessions: true },
});
```

### Slow Operations (2000-10000ms)

```typescript
// Large findMany (many results)
const allUsers = await schema.prisma.user.findMany();

// Complex aggregation
const result = await schema.prisma.user.groupBy({
  by: ["role"],
  _count: { id: true },
});

// Bulk operations
await schema.prisma.user.createMany({
  data: [{ ... }, { ... }, { ... }, /* 100+ items */],
});
```

---

## Key Points

1. **Always call simulateProductionOperation()** — includes realistic delay
2. **Always verify timing** — `expect(executionTime).toBeLessThan(12000)`
3. **Record execution time** — use `recordTestExecution()`
4. **Don't add extra delays** — let simulateProductionOperation() handle it
5. **Delays are random** — same test runs in different times (realistic)

---

## Assertion Helpers

```typescript
// Check that operation completed
expect(executionTime).toBeGreaterThan(0);

// Check that operation didn't timeout
expect(executionTime).toBeLessThan(12000);

// Check specific ranges
if (isComplexQuery) {
  expect(executionTime).toBeGreaterThan(500);
  expect(executionTime).toBeLessThan(5000);
} else {
  expect(executionTime).toBeLessThan(500);
}
```

---

**Next**: Read `test-data-factories.md` to learn how to generate realistic test data.
