---
name: record-test-metrics
description: >
  Log execution metrics, performance data, and error information for observability.
  Use when: at end of each test to record execution time, status, and context.
  Fits in workflow: final step in every test; wrap all operations with recording.
---

# Record Test Metrics

**PURPOSE**: Log test execution metrics for observability and debugging.
Recording captures execution time, status, and context for each test.

## When to use

- **Triggers**: "record metrics", "log execution", "track performance", "observability"
- **Input**: Test name, scenario, status (success/failure), execution time, metadata
- **Output**: Database entry in metrics table (logged automatically)
- **Not for**: Testing application logic (use assertions); this is observability
- **Required**: Last line of every test (after assertions)

## Quick start

1. Import: `const { recordTestExecution } = require("../shared/testInfrastructure")`
2. Call at end of test: `await recordTestExecution(name, scenario, status, time, metadata)`
3. Example: `recordTestExecution("auth-login", "valid-credentials", "success", 150, {testNumber: 1, schema: schema.schemaName})`

## Workflow

- **Gather**: Have execution time from simulateProductionOperation()
- **Execute**: Call recordTestExecution with test info
- **Validate**: Metrics recorded (no errors); observability complete

## File & tool use

- Read: None required
- Run: None required
- Import: `import { recordTestExecution } from "../shared/testInfrastructure"`

## Guardrails

- Always call recordTestExecution (last line of test)
- Status must be "success" or "failure"
- Execution time from simulateProductionOperation (not measured separately)
- Metadata should include testNumber and schema name

## Examples

**Example A**: Record successful CRUD operation

```typescript
it("creates user [Test 1/10]", async () => {
  const infra = await getInfrastructure();
  const schemas = await getSchemasByService("auth");
  const schema = schemas[0];
  const time = await simulateProductionOperation();

  const user = await schema.prisma.users.create({
    data: { email: "test@example.com", ... }
  });

  expect(user.id).toBeDefined();

  await recordTestExecution("auth-login", "create", "success", time, {
    testNumber: 1,
    schema: schema.schemaName
  });
});
```

**Example B**: Record error scenario

```typescript
it("rejects duplicate [Test 7/10]", async () => {
  const schema = /* ... */;
  const time = await simulateProductionOperation();

  let error;
  try {
    await schema.prisma.users.create({ data: duplicate });
  } catch (e) {
    error = e;
  }

  expect(error).toBeDefined();

  await recordTestExecution("auth-duplicate", "constraint", "success", time, {
    testNumber: 7,
    schema: schema.schemaName
  });
});
```

**Example C**: Record multi-service operation

```typescript
it("creates order in payment [Test 9/10]", async () => {
  const paymentSchema = /* ... */;
  const time = await simulateProductionOperation();

  const order = await paymentSchema.prisma.orders.create({
    data: { customerId: "c123", total: 99.99, ... }
  });

  expect(order.id).toBeDefined();

  await recordTestExecution("payment-order", "create-order", "success", time, {
    testNumber: 9,
    schema: paymentSchema.schemaName
  });
});
```

## Troubleshooting

- **Metrics not recorded** → Check recordTestExecution is called with all 5 parameters
- **Status is confusing** → "success" means test passed (error or not); "failure" means test broke
- **Time is zero** → Use simulateProductionOperation(); don't measure separately
- **Missing metadata** → Always include testNumber and schema name

## Changelog

- v0.2 – Refactored to minimal skill format
- v0.1 – Test recording documentation

---

**Related**: perform-crud-operations, include-realistic-delays, verify-test-quality
**Next**: None — this is the final observability step

---

## Recording Signature

```typescript
recordTestExecution(
  testName: string,        // "auth-login", "payment-checkout"
  scenario: string,        // "create", "constraint", "timeout"
  status: "success" | "failure",  // "success" if test passed
  executionTime: number,   // from simulateProductionOperation()
  metadata: {              // context object
    testNumber: number,    // 1-10
    schema: string         // schema.schemaName
  }
)
```

**Rule**: Call recordTestExecution() as the last line of every test.
await recordTestExecution(
"auth-login", // file/feature name
"username-password", // operation name
"success", // status
executionTime, // how long in ms
{ testNumber: 1, schema: schema.schemaName } // metadata
);
});

````

---

## Parameters

| Parameter       | Type   | Example                                 | Notes                                                 |
| --------------- | ------ | --------------------------------------- | ----------------------------------------------------- |
| `file`          | string | "auth-login"                            | Name of test file (matches filename without .test.ts) |
| `operation`     | string | "username-password"                     | What operation was tested                             |
| `status`        | string | "success" \| "error"                    | Did it pass?                                          |
| `executionTime` | number | 234                                     | Milliseconds                                          |
| `metadata`      | object | `{ testNumber: 1, schema: "auth_..." }` | Additional context                                    |

---

## Complete Example

```typescript
import { describe, it, expect } from "vitest";
import {
  getSchemasByService,
  recordTestExecution,
} from "../shared/testInfrastructure";
import {
  simulateProductionOperation,
  generateTestData,
} from "../shared/testHelpers";

describe("Auth Service - Login", () => {
  it("should handle username password [Test 1/10]", async () => {
    const schemas = await getSchemasByService("auth");
    const schema = schemas[Math.floor(Math.random() * schemas.length)];
    const executionTime = await simulateProductionOperation();
    const userData = generateTestData("user");

    const user = await schema.prisma.user.create({
      data: userData,
    });

    expect(user.id).toBeDefined();

    // Record execution
    await recordTestExecution(
      "auth-login",
      "username-password",
      "success",
      executionTime,
      {
        testNumber: 1,
        schema: schema.schemaName,
        email: user.email,
      }
    );
  });

  it("should handle social login [Test 2/10]", async () => {
    const schemas = await getSchemasByService("auth");
    const schema = schemas[Math.floor(Math.random() * schemas.length)];
    const executionTime = await simulateProductionOperation();
    const userData = generateTestData("user");

    const user = await schema.prisma.user.create({
      data: userData,
    });

    expect(user.id).toBeDefined();

    // Record execution
    await recordTestExecution(
      "auth-login",
      "social-login",
      "success",
      executionTime,
      {
        testNumber: 2,
        schema: schema.schemaName,
        provider: "google",
      }
    );
  });

  it("should reject invalid password [Test 7/10]", async () => {
    const schemas = await getSchemasByService("auth");
    const schema = schemas[Math.floor(Math.random() * schemas.length)];
    const executionTime = await simulateProductionOperation();

    // This test verifies error handling
    let error;
    try {
      await schema.prisma.user.create({
        data: {
          email: "test@example.com",
          passwordHash: "", // Invalid!
          role: "user",
        },
      });
    } catch (e) {
      error = e;
    }

    expect(error).toBeDefined();

    // Record the error execution
    await recordTestExecution(
      "auth-login",
      "invalid-password",
      "success", // Test itself succeeded (caught error)
      executionTime,
      {
        testNumber: 7,
        schema: schema.schemaName,
        errorType: error?.code || "unknown",
      }
    );
  });
});
````

---

## Metadata Best Practices

### Test-Specific Metadata

```typescript
await recordTestExecution(
  "auth-login",
  "username-password",
  "success",
  executionTime,
  {
    testNumber: 1, // Which test in the file (1-10)
    schema: schema.schemaName, // Which database instance
    email: user.email, // User created
  }
);
```

### Error Metadata

```typescript
await recordTestExecution(
  "auth-login",
  "invalid-password",
  "success", // The test itself passed (error was expected)
  executionTime,
  {
    testNumber: 7,
    schema: schema.schemaName,
    errorType: error.code, // P2002, P2003, etc.
    errorMessage: error.message,
  }
);
```

### Multi-Service Metadata

```typescript
await recordTestExecution(
  "payment-workflow",
  "create-profile",
  "success",
  executionTime,
  {
    testNumber: 1,
    authSchema: authSchema.schemaName,
    paymentSchema: paymentSchema.schemaName,
    userId: user.id,
    profileId: profile.id,
  }
);
```

---

## What Gets Logged?

Records are stored in the `TestExecution` table with:

```typescript
{
  id: "uuid",
  file: "auth-login",
  operation: "username-password",
  status: "success",
  executionTime: 234,          // milliseconds
  metadata: {
    testNumber: 1,
    schema: "auth_prod-us-east_instance1",
    email: "alice@example.com"
  },
  timestamp: "2025-11-11T14:30:00.000Z",
  schemaName: "auth_prod-us-east_instance1"
}
```

---

## Viewing Recordings

### In Logs

Check `logs/demo.log` for execution traces:

```
[2025-11-11T14:30:00.000Z] ✅ auth-login: username-password completed in 234ms
[2025-11-11T14:30:00.234Z] ✅ auth-login: social-login completed in 567ms
[2025-11-11T14:30:00.801Z] ✅ auth-login: invalid-password completed in 123ms
```

### In Database

Query the TestExecution table directly:

```typescript
const executions = await schema.prisma.testExecution.findMany({
  where: { file: "auth-login" },
  orderBy: { timestamp: "desc" },
});

console.log(executions); // All recorded executions
```

---

## Key Points

1. **Call after every test** — record all executions
2. **Use consistent operation names** — makes queries easier
3. **Include metadata** — test number, schema, user IDs
4. **Record even on error** — helps debugging
5. **executionTime is required** — always pass it from simulateProductionOperation()

---

**Next**: Read `orchestrator-pattern.md` to understand how tests fit into the master orchestrator.
