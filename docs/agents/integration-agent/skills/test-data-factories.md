---
name: generate-test-data
description: >
  Generate realistic test data using factory functions instead of hardcoding.
  Use when: creating test records (don't hardcode email, UUID, timestamps).
  Fits in workflow: before perform-crud-operations; provides realistic data for operations.
---

# Generate Test Data

**PURPOSE**: Create realistic, randomized test data without hardcoding values.
Factories ensure each test run has different data (prevents conflicts).

## When to use

- **Triggers**: "generate data", "test factory", "create realistic data", "random values"
- **Input**: Data type (user, session, transaction, payment, order, product, coupon, notification)
- **Output**: Object with realistic values (emails, hashes, UUIDs, etc.)
- **Not for**: Hardcoding test data (use factories instead)
- **Required**: Every test that creates data

## Quick start

1. Import: `const { generateTestData } = require("../shared/testHelpers")`
2. Call: `const userData = generateTestData("user")`
3. Use: `const user = await schema.prisma.users.create({ data: userData })`
4. Override if needed: `{ ...userData, email: "custom@example.com" }`

## Workflow

- **Gather**: Know available types (user, session, transaction, payment, order, product, coupon, notification)
- **Execute**: Call generateTestData(TYPE), get realistic object
- **Validate**: Data is different each call; no hardcoded values

## File & tool use

- Read: None required
- Run: None required
- Import: `import { generateTestData } from "../shared/testHelpers"`

## Guardrails

- Never hardcode email, UUID, timestamp, or phone
- Use generateTestData() for all test data
- Can override specific fields if needed
- Never use same data object in multiple tests

## Examples

**Example A**: User data

```typescript
const userData = generateTestData("user");
// Returns: {
//   email: "alice.johnson@example.com",
//   password: "SecureHash...",
//   role: "user"
// }

const user = await schema.prisma.users.create({ data: userData });
```

**Example B**: Override specific field

```typescript
const userData = generateTestData("user");
const customUser = { ...userData, email: "specific@test.com" };

const user = await schema.prisma.users.create({ data: customUser });
```

**Example C**: Payment data

```typescript
const paymentData = generateTestData("payment");
// Returns: {
//   amount: 99.99,
//   currency: "USD",
//   status: "pending"
// }

const payment = await schema.prisma.payments.create({ data: paymentData });
```

## Troubleshooting

- **Data conflicts between tests** → Use generateTestData(); it generates unique values
- **Need specific value** → Override field: `{ ...data, field: value }`
- **Don't know available types** → Check function signature or docs (user, session, transaction, payment, order, product, coupon, notification)

## Changelog

- v0.2 – Refactored to minimal skill format
- v0.1 – Test data factories guide

---

**Related**: perform-crud-operations, test-error-scenarios
**Next**: include-realistic-delays

---

## Available Data Types

| Type         | Fields                    | Example             |
| ------------ | ------------------------- | ------------------- |
| user         | email, password, role     | alice@example.com   |
| session      | token, expiresAt, userId  | token-uuid-xxx      |
| transaction  | amount, status, type      | 99.99, pending      |
| payment      | amount, currency, method  | 50.00, USD          |
| order        | customerId, total, status | order-uuid-xxx      |
| product      | name, price, sku          | Product Name, 29.99 |
| coupon       | code, discount, expiresAt | CODE2024            |
| notification | userId, type, message     | Welcome email       |

All values are randomized and realistic per call.
// email: "alice.smith@example.com",
// passwordHash: "hashed-password-value",
// role: "user"
// }

// Each call generates different data
const user2 = generateTestData("user");
// Returns:
// {
// email: "bob.jones@example.com",
// passwordHash: "hashed-password-value",
// role: "user"
// }

````

### Session Data

```typescript
const sessionData = generateTestData("session");
// Returns:
// {
//   token: "session-token-12345",
//   expiresAt: Date (future date),
//   userId: "user-123"
// }
````

### Transaction Data

```typescript
const transactionData = generateTestData("transaction");
// Returns:
// {
//   amount: 5999,
//   currency: "USD",
//   status: "pending",
//   timestamp: Date (now)
// }
```

### Other Types

```typescript
generateTestData("payment"); // Payment data
generateTestData("order"); // Order data
generateTestData("product"); // Product data
generateTestData("coupon"); // Coupon data
generateTestData("notification"); // Notification data
```

---

## How to Use Factories

### Simple Case

```typescript
it("creates user with factory data", async () => {
  const schema = await getSchemasByService("auth");
  const userData = generateTestData("user");

  const user = await schema[0].prisma.user.create({
    data: userData, // Use generated data
  });

  expect(user.email).toBe(userData.email);
});
```

### Multiple Data Types

```typescript
it("creates user with sessions", async () => {
  const schema = await getSchemasByService("auth");
  const userData = generateTestData("user");
  const sessionData = generateTestData("session");

  const user = await schema[0].prisma.user.create({
    data: {
      ...userData,
      sessions: {
        create: [sessionData, generateTestData("session")],
      },
    },
    include: { sessions: true },
  });

  expect(user.sessions).toHaveLength(2);
});
```

### Override Specific Fields

```typescript
it("creates admin user", async () => {
  const schema = await getSchemasByService("auth");
  const userData = generateTestData("user");

  const admin = await schema[0].prisma.user.create({
    data: {
      ...userData,
      role: "admin", // Override the role
    },
  });

  expect(admin.role).toBe("admin");
  expect(admin.email).toMatch(/^[a-z]+\.[a-z]+@example\.com$/); // From factory
});
```

### Bulk Creation with Factories

```typescript
it("creates multiple users", async () => {
  const schema = await getSchemasByService("auth");

  // Generate data for 5 users
  const users = Array.from({ length: 5 }, () => generateTestData("user"));

  await schema[0].prisma.user.createMany({
    data: users,
  });

  const count = await schema[0].prisma.user.count();
  expect(count).toBe(5);

  // All have different emails
  const allUsers = await schema[0].prisma.user.findMany();
  const emails = allUsers.map((u) => u.email);
  const uniqueEmails = new Set(emails);
  expect(uniqueEmails.size).toBe(5);
});
```

---

## Factory Output Examples

### User Factory

```typescript
generateTestData("user");
// {
//   email: "james.wilson@example.com",
//   passwordHash: "$2b$10$...", // bcrypt-like
//   role: "user"
// }

generateTestData("user");
// {
//   email: "sophia.taylor@example.com",
//   passwordHash: "$2b$10$...",
//   role: "user"
// }
```

### Session Factory

```typescript
generateTestData("session");
// {
//   token: "sess_1234567890abcdef",
//   expiresAt: 2025-11-12T14:30:00.000Z, // 24h from now
//   userId: "user_9876543210"
// }
```

### Transaction Factory

```typescript
generateTestData("transaction");
// {
//   amount: 12950, // Random amount in cents
//   currency: "USD",
//   status: "pending",
//   timestamp: 2025-11-11T14:30:00.000Z
// }
```

### Payment Factory

```typescript
generateTestData("payment");
// {
//   cardLast4: "4242",
//   method: "credit_card",
//   amount: 5999,
//   status: "authorized"
// }
```

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

describe("User Management with Factories", () => {
  it("creates user with generated data [Test 1/10]", async () => {
    const schemas = await getSchemasByService("auth");
    const schema = schemas[Math.floor(Math.random() * schemas.length)];
    const executionTime = await simulateProductionOperation();

    // Generate random user data
    const userData = generateTestData("user");

    const user = await schema.prisma.user.create({ data: userData });

    expect(user.id).toBeDefined();
    expect(user.email).toBe(userData.email);

    await recordTestExecution(
      "auth-user",
      "create-with-factory",
      "success",
      executionTime,
      { testNumber: 1 }
    );
  });

  it("creates user with multiple sessions [Test 2/10]", async () => {
    const schemas = await getSchemasByService("auth");
    const schema = schemas[Math.floor(Math.random() * schemas.length)];
    const executionTime = await simulateProductionOperation();

    const userData = generateTestData("user");
    const sessionData1 = generateTestData("session");
    const sessionData2 = generateTestData("session");

    const user = await schema.prisma.user.create({
      data: {
        ...userData,
        sessions: {
          create: [sessionData1, sessionData2],
        },
      },
      include: { sessions: true },
    });

    expect(user.sessions).toHaveLength(2);
    expect(user.sessions[0].token).toBe(sessionData1.token);

    await recordTestExecution(
      "auth-user",
      "create-with-sessions",
      "success",
      executionTime,
      { testNumber: 2 }
    );
  });

  it("bulk creates users [Test 3/10]", async () => {
    const schemas = await getSchemasByService("auth");
    const schema = schemas[Math.floor(Math.random() * schemas.length)];
    const executionTime = await simulateProductionOperation();

    // Create 10 random users
    const users = Array.from({ length: 10 }, () => generateTestData("user"));

    await schema.prisma.user.createMany({ data: users });

    const count = await schema.prisma.user.count();
    expect(count).toBeGreaterThanOrEqual(10);

    await recordTestExecution(
      "auth-user",
      "bulk-create",
      "success",
      executionTime,
      { testNumber: 3, userCount: 10 }
    );
  });

  it("finds users by generated email pattern [Test 4/10]", async () => {
    const schemas = await getSchemasByService("auth");
    const schema = schemas[Math.floor(Math.random() * schemas.length)];
    const executionTime = await simulateProductionOperation();

    const userData = generateTestData("user");

    await schema.prisma.user.create({ data: userData });

    // Find by the generated email
    const found = await schema.prisma.user.findUnique({
      where: { email: userData.email },
    });

    expect(found).toBeDefined();

    await recordTestExecution(
      "auth-user",
      "find-by-email",
      "success",
      executionTime,
      { testNumber: 4 }
    );
  });

  it("updates user from factory data [Test 5/10]", async () => {
    const schemas = await getSchemasByService("auth");
    const schema = schemas[Math.floor(Math.random() * schemas.length)];
    const executionTime = await simulateProductionOperation();

    const userData = generateTestData("user");

    const user = await schema.prisma.user.create({ data: userData });

    // Create update data
    const updateData = generateTestData("user");

    const updated = await schema.prisma.user.update({
      where: { id: user.id },
      data: updateData,
    });

    expect(updated.email).toBe(updateData.email);

    await recordTestExecution(
      "auth-user",
      "update-to-factory-data",
      "success",
      executionTime,
      { testNumber: 5 }
    );
  });
});
```

---

## Best Practices

1. **Always use factories** — never hardcode test data
2. **Mix factory data with overrides** — `{ ...generateTestData("user"), role: "admin" }`
3. **Don't reuse factory results** — each call generates new data
4. **Use appropriate types** — `generateTestData("session")` for sessions
5. **Verify generated data** — `expect(user.email).toBeDefined()`

---

## Troubleshooting

### ❌ "generateTestData is not defined"

Make sure to import it:

```typescript
import { generateTestData } from "../shared/testHelpers";
```

### ❌ "Unknown data type 'xyz'"

Use one of the valid types: user, session, transaction, payment, order, product, coupon, notification

### ❌ "Multiple tests have same data"

Each call generates different data — if two tests reuse the same factory result, that's the problem:

```typescript
// ❌ Bad: Reused data
const data = generateTestData("user");
test1(() => { ...data });
test2(() => { ...data }); // Same email!

// ✅ Good: Fresh data each time
test1(() => { const data = generateTestData("user"); ...data });
test2(() => { const data = generateTestData("user"); ...data }); // Different
```

---

**Next**: Read `error-handling-testing.md` to learn how to test error scenarios.
