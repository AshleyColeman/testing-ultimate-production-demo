---
name: perform-crud-operations
description: >
  Create, read, update, delete data via Prisma client.
  Use when: every test needs database operations on schema.prisma tables.
  Fits in workflow: after select-schema, before test-error-scenarios. Required in every test.
---

# Perform CRUD Operations

**PURPOSE**: Execute database operations (Create, Read, Update, Delete) using Prisma.
All 10 tests use CRUD operations on schema.prisma tables.

## When to use

- **Triggers**: "create record", "fetch data", "update field", "delete row", "query table"
- **Input**: schema.prisma client, table name, data/filters
- **Output**: Created/fetched/updated/deleted database records
- **Not for**: Creating schemas (pre-built); raw SQL (use Prisma)
- **Required**: In every integration test

## Quick start

1. Get schema: `const schema = schemas[Math.floor(Math.random() * schemas.length)]`
2. Create: `await schema.prisma.users.create({ data: {...} })`
3. Read: `await schema.prisma.users.findUnique({ where: {id} })`
4. Update: `await schema.prisma.users.update({ where: {id}, data: {...} })`
5. Delete: `await schema.prisma.users.delete({ where: {id} })`

## Workflow

- **Gather**: Know table names and schema from schema.prisma
- **Execute**: Call appropriate Prisma method (create/find/update/delete)
- **Validate**: Record has expected properties; operations succeeded

## File & tool use

- Read: Reference schema.prisma for table/field names
- Run: None required (Prisma handles database operations)
- Prefer: schema.prisma methods over raw SQL

## Guardrails

- Use schema.prisma only (not global PrismaClient)
- Table names from schema.prisma (case-sensitive)
- Always await Prisma calls (they're async)
- Use where clauses for updates/deletes (no global updates)

## Examples

**Example A**: CREATE a record

```typescript
const user = await schema.prisma.users.create({
  data: {
    email: "alice@example.com",
    password: "hash",
    role: "user",
  },
});
expect(user.id).toBeDefined();
```

**Example B**: READ a record

```typescript
const user = await schema.prisma.users.findUnique({
  where: { id: userId },
});
expect(user.email).toBe("alice@example.com");
```

**Example C**: UPDATE a record

```typescript
const updated = await schema.prisma.users.update({
  where: { id: userId },
  data: { role: "admin" },
});
expect(updated.role).toBe("admin");
```

**Example D**: DELETE a record

```typescript
await schema.prisma.users.delete({
  where: { id: userId },
});
const found = await schema.prisma.users.findUnique({
  where: { id: userId },
});
expect(found).toBeNull();
```

## Troubleshooting

- **"Unknown table" error** → Check table name in schema.prisma (case-sensitive)
- **"Required field missing"** → Check required fields in schema
- **Record not saved** → Ensure await; Prisma is async
- **Can't find record after create** → Verify data was actually created; check where clause

## Changelog

- v0.2 – Refactored to minimal skill format
- v0.1 – Comprehensive CRUD patterns

---

**Related**: select-schema, generate-test-data, test-error-scenarios
**Next**: include-realistic-delays (wrap CRUD with timing)

---

## Common Prisma Operations

| Operation  | Signature                                    | Returns             |
| ---------- | -------------------------------------------- | ------------------- |
| create     | `.create({ data: {...} })`                   | Created record      |
| findUnique | `.findUnique({ where: {...} })`              | Record or null      |
| findMany   | `.findMany({ where: {...} })`                | Array of records    |
| findFirst  | `.findFirst({ where: {...} })`               | First match or null |
| update     | `.update({ where: {...}, data: {...} })`     | Updated record      |
| updateMany | `.updateMany({ where: {...}, data: {...} })` | Count updated       |
| delete     | `.delete({ where: {...} })`                  | Deleted record      |
| deleteMany | `.deleteMany({ where: {...} })`              | Count deleted       |
| count      | `.count({ where: {...} })`                   | Number of records   |

All methods are async; always await them.
token: "token-1",
expiresAt: new Date(Date.now() + 86400000), // 24h
},
{
token: "token-2",
expiresAt: new Date(Date.now() + 86400000),
},
],
},
},
include: {
sessions: true, // Include related sessions in response
},
});

expect(user.sessions).toHaveLength(2);
});

````

### Create Many (Bulk Insert)

```typescript
it("creates multiple users at once", async () => {
  const schema = /* ...get schema... */;

  const result = await schema.prisma.user.createMany({
    data: [
      { email: "user1@example.com", passwordHash: "hash1", role: "user" },
      { email: "user2@example.com", passwordHash: "hash2", role: "user" },
      { email: "user3@example.com", passwordHash: "hash3", role: "admin" },
    ],
  });

  expect(result.count).toBe(3);
});
````

---

## READ (Query Data)

### Find By ID

```typescript
it("finds user by ID", async () => {
  const schema = /* ...get schema... */;

  // First create
  const created = await schema.prisma.user.create({
    data: { email: "test@example.com", passwordHash: "hash", role: "user" },
  });

  // Then find
  const found = await schema.prisma.user.findUnique({
    where: { id: created.id },
  });

  expect(found).toBeDefined();
  expect(found.email).toBe("test@example.com");
});
```

### Find by Unique Field

```typescript
it("finds user by email", async () => {
  const schema = /* ...get schema... */;

  const created = await schema.prisma.user.create({
    data: { email: "alice@example.com", passwordHash: "hash", role: "user" },
  });

  // Find by email (if email is @unique in schema)
  const found = await schema.prisma.user.findUnique({
    where: { email: "alice@example.com" },
  });

  expect(found.id).toBe(created.id);
});
```

### Find First (First Match)

```typescript
it("finds first admin user", async () => {
  const schema = /* ...get schema... */;

  // Create some test data
  await schema.prisma.user.createMany({
    data: [
      { email: "user1@example.com", passwordHash: "h1", role: "user" },
      { email: "admin1@example.com", passwordHash: "h2", role: "admin" },
      { email: "admin2@example.com", passwordHash: "h3", role: "admin" },
    ],
  });

  // Find first admin
  const admin = await schema.prisma.user.findFirst({
    where: { role: "admin" },
  });

  expect(admin.role).toBe("admin");
});
```

### Find Many (All Matching)

```typescript
it("finds all users in a role", async () => {
  const schema = /* ...get schema... */;

  // Create test data
  await schema.prisma.user.createMany({
    data: [
      { email: "user1@example.com", passwordHash: "h1", role: "user" },
      { email: "user2@example.com", passwordHash: "h2", role: "user" },
      { email: "admin@example.com", passwordHash: "h3", role: "admin" },
    ],
  });

  // Find all users
  const users = await schema.prisma.user.findMany({
    where: { role: "user" },
  });

  expect(users).toHaveLength(2);
  expect(users.every((u) => u.role === "user")).toBe(true);
});
```

### Find with Relations

```typescript
it("finds user with their sessions", async () => {
  const schema = /* ...get schema... */;

  const user = await schema.prisma.user.create({
    data: {
      email: "test@example.com",
      passwordHash: "hash",
      role: "user",
      sessions: {
        create: [
          { token: "token-1", expiresAt: new Date() },
          { token: "token-2", expiresAt: new Date() },
        ],
      },
    },
  });

  // Find with include
  const found = await schema.prisma.user.findUnique({
    where: { id: user.id },
    include: {
      sessions: true, // Include sessions array
    },
  });

  expect(found.sessions).toHaveLength(2);
});
```

### Find with Filters

```typescript
it("finds users with complex filters", async () => {
  const schema = /* ...get schema... */;

  await schema.prisma.user.createMany({
    data: [
      { email: "alice@example.com", passwordHash: "hash", role: "user" },
      { email: "bob@example.com", passwordHash: "hash", role: "user" },
      { email: "charlie@example.com", passwordHash: "hash", role: "admin" },
    ],
  });

  // Find users whose email contains "a"
  const usersWithA = await schema.prisma.user.findMany({
    where: {
      email: {
        contains: "a", // Case-sensitive
      },
    },
  });

  // Should find: alice, charlie
  expect(usersWithA.length).toBeGreaterThan(0);
});
```

### Count Records

```typescript
it("counts users by role", async () => {
  const schema = /* ...get schema... */;

  await schema.prisma.user.createMany({
    data: [
      { email: "u1@example.com", passwordHash: "h", role: "user" },
      { email: "u2@example.com", passwordHash: "h", role: "user" },
      { email: "a1@example.com", passwordHash: "h", role: "admin" },
    ],
  });

  const userCount = await schema.prisma.user.count({
    where: { role: "user" },
  });

  expect(userCount).toBe(2);
});
```

---

## UPDATE (Modify Data)

### Update by ID

```typescript
it("updates user role", async () => {
  const schema = /* ...get schema... */;

  const user = await schema.prisma.user.create({
    data: { email: "test@example.com", passwordHash: "hash", role: "user" },
  });

  const updated = await schema.prisma.user.update({
    where: { id: user.id },
    data: {
      role: "admin", // Change role
    },
  });

  expect(updated.role).toBe("admin");
});
```

### Update Multiple Fields

```typescript
it("updates multiple fields", async () => {
  const schema = /* ...get schema... */;

  const user = await schema.prisma.user.create({
    data: {
      email: "old@example.com",
      passwordHash: "oldhash",
      role: "user",
    },
  });

  const updated = await schema.prisma.user.update({
    where: { id: user.id },
    data: {
      email: "new@example.com",
      passwordHash: "newhash",
      role: "admin",
    },
  });

  expect(updated.email).toBe("new@example.com");
  expect(updated.passwordHash).toBe("newhash");
  expect(updated.role).toBe("admin");
});
```

### Update Many

```typescript
it("updates all users in a role", async () => {
  const schema = /* ...get schema... */;

  await schema.prisma.user.createMany({
    data: [
      { email: "u1@example.com", passwordHash: "h", role: "user" },
      { email: "u2@example.com", passwordHash: "h", role: "user" },
    ],
  });

  const result = await schema.prisma.user.updateMany({
    where: { role: "user" },
    data: {
      role: "member", // Bulk change
    },
  });

  expect(result.count).toBe(2);
});
```

### Increment/Decrement

```typescript
it("increments login count", async () => {
  const schema = /* ...get schema... */;

  const user = await schema.prisma.user.create({
    data: {
      email: "test@example.com",
      passwordHash: "hash",
      role: "user",
      loginCount: 0,
    },
  });

  const updated = await schema.prisma.user.update({
    where: { id: user.id },
    data: {
      loginCount: {
        increment: 1, // loginCount becomes 1
      },
    },
  });

  expect(updated.loginCount).toBe(1);
});
```

---

## DELETE (Remove Data)

### Delete by ID

```typescript
it("deletes a user", async () => {
  const schema = /* ...get schema... */;

  const user = await schema.prisma.user.create({
    data: { email: "temp@example.com", passwordHash: "hash", role: "user" },
  });

  await schema.prisma.user.delete({
    where: { id: user.id },
  });

  // Verify it's gone
  const found = await schema.prisma.user.findUnique({
    where: { id: user.id },
  });

  expect(found).toBeNull();
});
```

### Delete Many

```typescript
it("deletes all inactive users", async () => {
  const schema = /* ...get schema... */;

  await schema.prisma.user.createMany({
    data: [
      { email: "u1@example.com", passwordHash: "h", role: "user", active: true },
      { email: "u2@example.com", passwordHash: "h", role: "user", active: false },
      { email: "u3@example.com", passwordHash: "h", role: "user", active: false },
    ],
  });

  const result = await schema.prisma.user.deleteMany({
    where: { active: false },
  });

  expect(result.count).toBe(2);

  const remaining = await schema.prisma.user.count();
  expect(remaining).toBe(1);
});
```

---

## Complete CRUD Example

```typescript
import { describe, it, expect } from "vitest";
import { getSchemasByService } from "../shared/testInfrastructure";

describe("Prisma CRUD Operations", () => {
  it("creates, reads, updates, and deletes a user", async () => {
    const schemas = await getSchemasByService("auth");
    const schema = schemas[Math.floor(Math.random() * schemas.length)];

    // CREATE
    const created = await schema.prisma.user.create({
      data: {
        email: "john@example.com",
        passwordHash: "oldpassword",
        role: "user",
      },
    });
    expect(created.id).toBeDefined();

    // READ
    const found = await schema.prisma.user.findUnique({
      where: { id: created.id },
    });
    expect(found.email).toBe("john@example.com");

    // UPDATE
    const updated = await schema.prisma.user.update({
      where: { id: created.id },
      data: {
        passwordHash: "newpassword",
        role: "admin",
      },
    });
    expect(updated.role).toBe("admin");

    // DELETE
    await schema.prisma.user.delete({
      where: { id: created.id },
    });

    const deleted = await schema.prisma.user.findUnique({
      where: { id: created.id },
    });
    expect(deleted).toBeNull();
  });
});
```

---

## Key Points

1. **Always use schema.prisma** — never create your own Prisma client
2. **Use include/select** for relations — brings back related data
3. **Use where clauses** — filters queries efficiently
4. **Use createMany/updateMany** — bulk operations are faster
5. **Use findUnique** — fastest for ID or unique fields
6. **Verify after operations** — read back to confirm changes

---

**Next**: Read `production-delays.md` to learn how to add realistic timing to your tests.
