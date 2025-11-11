---
name: select-random-schema
description: >
  Pick a random database schema for a service (auth, payment, inventory, analytics, notification).
  Use when: each test needs to access a schema for CRUD operations. Simulates production load
  distribution across 4 instances per service. Required after getInfrastructure() and before schema.prisma.
---

# Select Random Schema

**PURPOSE**: Distribute test load across all database instances (4 per service).
This simulates production where requests go to instance1, instance2, instance3, or instance4 randomly.

## When to use

- **Triggers**: "select schema", "pick database", "load distribution", "access schema"
- **Input**: service name (auth | payment | inventory | analytics | notification)
- **Output**: schema object with `.prisma` (Prisma client) and `.schemaName`
- **Not for**: Creating schemas; they're pre-built. Use this to SELECT one
- **Required**: For every test that does CRUD operations

## Quick start

1. Get schemas for service: `const schemas = await getSchemasByService("auth")`
2. Pick random: `const schema = schemas[Math.floor(Math.random() * schemas.length)]`
3. Use in test: `await schema.prisma.user.create({...})`

## Workflow

- **Gather**: Know service name (5 valid: auth, payment, inventory, analytics, notification)
- **Execute**: Call `getSchemasByService(service)`, randomly select from returned array
- **Validate**: schema has `.prisma` client and `.schemaName` property (e.g., "auth_prod-us-east_instance1")

````

### Step 2: Get All Schemas for a Service

```typescript
it("my test", async () => {
  // Get all 4 auth schemas
  const authSchemas = await getSchemasByService("auth");

  // authSchemas = [
  //   { schemaName: "auth_prod-us-east_instance1", prisma: ... },
  //   { schemaName: "auth_prod-us-east_instance2", prisma: ... },
  //   { schemaName: "auth_prod-us-east_instance3", prisma: ... },
  //   { schemaName: "auth_prod-us-east_instance4", prisma: ... },
  // ]

  expect(authSchemas).toHaveLength(4);
});
````

### Step 3: Randomly Pick One

```typescript
it("my test", async () => {
  const schemas = await getSchemasByService("auth");

  // Pick a random one
  const schema = schemas[Math.floor(Math.random() * schemas.length)];

  // schema now has:
  // - schema.schemaName: "auth_prod-us-east_instance2"
  // - schema.prisma: Prisma client connected to that database
  // - schema.service: "auth"
  // - schema.environment: "prod-us-east"
  // - schema.containerIndex: 0
  // - schema.connectionUri: "postgresql://..."
});
```

### Step 4: Use the Prisma Client

```typescript
it("my test", async () => {
  const schemas = await getSchemasByService("auth");
  const schema = schemas[Math.floor(Math.random() * schemas.length)];

  // Use schema.prisma to interact with the database
  const user = await schema.prisma.user.create({
    data: {
      email: "test@example.com",
      role: "user",
    },
  });

  const found = await schema.prisma.user.findUnique({
    where: { id: user.id },
  });

  expect(found.email).toBe("test@example.com");
});
```

---

## Valid Service Names

Always use these exact service names:

```typescript
await getSchemasByService("auth"); // ✅ Auth schemas
await getSchemasByService("payment"); // ✅ Payment schemas
await getSchemasByService("inventory"); // ✅ Inventory schemas
await getSchemasByService("analytics"); // ✅ Analytics schemas
await getSchemasByService("notification"); // ✅ Notification schemas

await getSchemasByService("invalid"); // ❌ Throws error
```

---

## Schema Config Interface

```typescript
interface SchemaConfig {
  containerIndex: number; // Which container (0-4)
  schemaName: string; // Full name: auth_prod-us-east_instance1
  connectionUri: string; // PostgreSQL connection string
  prisma: PrismaClient; // Ready-to-use Prisma client
  service: string; // "auth", "payment", etc.
  environment: string; // "prod-us-east", "prod-us-west", etc.
}
```

---

## Complete Example

```typescript
import { describe, it, expect } from "vitest";
import { getSchemasByService } from "../shared/testInfrastructure";

describe("Schema Selection Example", () => {
  it("selects random auth schema", async () => {
    // Get all 4 auth schemas
    const schemas = await getSchemasByService("auth");
    expect(schemas).toHaveLength(4);

    // Pick a random one
    const schema = schemas[Math.floor(Math.random() * schemas.length)];

    // Verify schema properties
    expect(schema.schemaName).toMatch(/^auth_/);
    expect(schema.service).toBe("auth");
    expect(schema.prisma).toBeDefined();
  });

  it("uses selected schema for database operations", async () => {
    const schemas = await getSchemasByService("auth");
    const schema = schemas[Math.floor(Math.random() * schemas.length)];

    // Create a user
    const user = await schema.prisma.user.create({
      data: {
        email: "user@example.com",
        passwordHash: "hashed-password",
        role: "user",
      },
    });

    // Read it back
    const retrieved = await schema.prisma.user.findUnique({
      where: { id: user.id },
    });

    expect(retrieved).toBeDefined();
    expect(retrieved.schemaName).toBe(schema.schemaName);
  });

  it("different tests pick different schemas", async () => {
    // Test 1 picks one schema
    const test1Schema = (await getSchemasByService("auth"))[0];

    // Test 2 might pick a different one (due to random selection)
    const test2Schema = (await getSchemasByService("auth"))[
      Math.floor(Math.random() * 4)
    ];

    // Both are valid auth schemas
    expect(test1Schema.service).toBe("auth");
    expect(test2Schema.service).toBe("auth");

    // Might be different instances (simulates load distribution)
    console.log(`Test 1 uses: ${test1Schema.schemaName}`);
    console.log(`Test 2 uses: ${test2Schema.schemaName}`);
  });

  it("each service has 4 independent schemas", async () => {
    const auth = await getSchemasByService("auth");
    const payment = await getSchemasByService("payment");
    const inventory = await getSchemasByService("inventory");
    const analytics = await getSchemasByService("analytics");
    const notification = await getSchemasByService("notification");

    expect(auth).toHaveLength(4);
    expect(payment).toHaveLength(4);
    expect(inventory).toHaveLength(4);
    expect(analytics).toHaveLength(4);
    expect(notification).toHaveLength(4);

    // Each has different service name
    expect(auth[0].service).toBe("auth");
    expect(payment[0].service).toBe("payment");
    expect(inventory[0].service).toBe("inventory");
    expect(analytics[0].service).toBe("analytics");
    expect(notification[0].service).toBe("notification");
  });
});
```

---

## Pattern in Your Test Files

This is how you'll use it in every test:

```typescript
describe("Auth Service - Login", () => {
  it("should handle username password [Test 1/10]", async () => {
    // 1. Get infrastructure (for logger, etc.)
    const infra = await getInfrastructure();

    // 2. Get schemas for this service
    const schemas = await getSchemasByService("auth");

    // 3. Pick a random one
    const schema = schemas[Math.floor(Math.random() * schemas.length)];

    // 4. Use it!
    const user = await schema.prisma.user.create({
      data: { email: "test@example.com" },
    });

    // 5. Verify
    expect(user.id).toBeDefined();
  });
});
```

---

## Key Points

1. **Always use same random selection pattern** across all test files
2. **Never hardcode schema names** — always use getSchemasByService()
3. **Never create your own schemas** — they're pre-created by orchestrator
4. **Always get a Prisma client from schema** — schema.prisma
5. **Schema selection is automatic** — just pick randomly from the array

---

## Troubleshooting

### ❌ "getSchemasByService returned empty array"

Make sure:

## Troubleshooting

- **Error: "getSchemasByService returned empty array"** → Service name is wrong or orchestrator hasn't initialized; check service is lowercase (auth, NOT Auth)
- **Error: "Prisma connection failed"** → Using wrong schema object; verify you called getSchemasByService and selected from result
- **All tests use same schema** → You're not randomizing; always use `Math.floor(Math.random() * schemas.length)`

## Changelog

- v0.2 – Refactored to minimal skill format with clear triggers and validation
- v0.1 – Initial comprehensive documentation

---

**Next**: Use the selected schema with `prisma-crud-patterns.md` to perform CRUD operations.
