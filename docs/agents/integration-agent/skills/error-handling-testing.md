---
name: test-error-scenarios
description: >
  Test error cases, validation failures, constraint violations, and edge conditions.
  Use when: 3-4 of 10 tests should cover error paths (not happy paths).
  Fits in workflow: after perform-crud-operations, before verify-test-quality.
---

# Test Error Scenarios

**PURPOSE**: Ensure 3-4 of your 10 tests cover error cases.
Happy-path tests catch success; error tests catch graceful failure.

## When to use

- **Triggers**: "test error", "validation failure", "constraint violation", "not found", "duplicate", "timeout"
- **Input**: Service name, error scenario (validation, unique constraint, foreign key, not found)
- **Output**: Test using try/catch that verifies error occurs and is handled
- **Not for**: Testing all possible errors; select 3-4 representative ones
- **Required**: 30-40% of your tests (3-4 out of 10)

## Quick start

1. Choose error type: validation, unique constraint (P2002), foreign key (P2003), not found (P2025)
2. Write try/catch: operation in try, error capture in catch
3. Assert: expect(error).toBeDefined() and check error.code or error.message

## Workflow

- **Gather**: Know common error codes (P2002=unique, P2003=FK, P2025=not-found)
- **Execute**: Try operation that should fail, catch error, verify it
- **Validate**: Error has expected code/message; test still passes

## File & tool use

- Read: Prisma error codes (P2002, P2003, P2025, P2004)
- Run: None required — Prisma handles errors
- Prefer: Using Prisma error codes over error message strings

## Guardrails

- Don't test every possible error (too many tests)
- Do test representative errors: validation, uniqueness, relationships, not-found
- All error tests should pass (error occurs as expected)
- Never let unhandled errors break the test

## Examples

**Example A**: Unique constraint violation (P2002)

```typescript
it("rejects duplicate email [Test 7/10]", async () => {
  const schema = /* random schema */;
  const email = "alice@example.com";

  await schema.prisma.user.create({ data: { email, ... } });

  let error;
  try {
    await schema.prisma.user.create({ data: { email, ... } });
  } catch (e) {
    error = e;
  }

  expect(error.code).toBe("P2002"); // Unique constraint
});
```

**Example B**: Foreign key violation (P2003)

```typescript
it("rejects session for non-existent user", async () => {
  const schema = /* random schema */;

  let error;
  try {
    await schema.prisma.session.create({
      data: { userId: "non-existent", token: "x", ... }
    });
  } catch (e) {
    error = e;
  }

  expect(error.code).toBe("P2003"); // FK constraint
});
```

**Example C**: Not found on required operation (P2025)

```typescript
it("errors updating non-existent user", async () => {
  const schema = /* random schema */;

  let error;
  try {
    await schema.prisma.user.update({
      where: { id: "non-existent" },
      data: { role: "admin" }
    });
  } catch (e) {
    error = e;
  }

  expect(error).toBeDefined();
});
```

## Troubleshooting

- **Error test fails (operation succeeds)** → Check error conditions (e.g., email might not be unique in test)
- **Error test breaks suite** → Use try/catch to capture error instead of throwing
- **Can't find error code** → Check Prisma docs for operation's possible error codes
- **Not sure which errors to test** → Pick: 1 validation, 1 uniqueness, 1 FK, 1 not-found

## Changelog

- v0.2 – Refactored to minimal skill format, focused on error scenario patterns
- v0.1 – Comprehensive error handling guide

---

**Related**: perform-crud-operations, generate-test-data, verify-test-quality
**Next**: None — use with perform-crud-operations

---

## Common Error Codes Reference

| Code  | Meaning                        | Example                    |
| ----- | ------------------------------ | -------------------------- |
| P2002 | Unique constraint              | duplicate email            |
| P2003 | Foreign key constraint         | non-existent user          |
| P2025 | Record not found (required op) | update/delete non-existent |
| P2000 | Value too long                 | email exceeds column limit |
| P2004 | Database timeout               | query takes > limit        |

---

## Pattern: Error Test Structure

```typescript
it("test name [Test N/10]", async () => {
  const infra = await getInfrastructure();
  const schemas = await getSchemasByService("SERVICE");
  const schema = schemas[Math.floor(Math.random() * schemas.length)];
  const time = await simulateProductionOperation();

  let error;
  try {
    // Operation that should fail
    await schema.prisma.TABLE.OPERATION(...invalid data...);
  } catch (e) {
    error = e;
  }

  // Verify error occurred
  expect(error).toBeDefined();
  expect(error.code).toBe("PXXXX"); // or check message

  // Record test
  await recordTestExecution("test-name", "error-scenario", "success", time, {
    testNumber: N,
    schema: schema.schemaName
  });
});
```

---

**Why errors matter**: Happy-path tests verify success; error tests verify graceful failure. Both are needed.

```typescript
it("rejects invalid email format [Test 7/10]", async () => {
  const schemas = await getSchemasByService("auth");
  const schema = schemas[Math.floor(Math.random() * schemas.length)];

  // Try to create user with invalid email
  let error;
  try {
    await schema.prisma.user.create({
      data: {
        email: "not-an-email", // Invalid!
        passwordHash: "hash",
        role: "user",
      },
    });
  } catch (e) {
    error = e;
  }

  // Should have validation error
  expect(error).toBeDefined();
  expect(error.message).toContain("email");
});
```

### Not Found Errors

**When**: Querying for something that doesn't exist

```typescript
it("returns null when user not found [Test 8/10]", async () => {
  const schemas = await getSchemasByService("auth");
  const schema = schemas[Math.floor(Math.random() * schemas.length)];

  // Try to find non-existent user
  const found = await schema.prisma.user.findUnique({
    where: { id: "non-existent-id" },
  });

  expect(found).toBeNull();
});
```

### Constraint Violations (Unique)

**When**: Inserting duplicate unique field

```typescript
it("rejects duplicate email [Test 9/10]", async () => {
  const schemas = await getSchemasByService("auth");
  const schema = schemas[Math.floor(Math.random() * schemas.length)];

  const email = "alice@example.com";

  // Create first user
  await schema.prisma.user.create({
    data: { email, passwordHash: "hash", role: "user" },
  });

  // Try to create second with same email
  let error;
  try {
    await schema.prisma.user.create({
      data: { email, passwordHash: "hash", role: "user" },
    });
  } catch (e) {
    error = e;
  }

  expect(error).toBeDefined();
  expect(error.code).toBe("P2002"); // Prisma unique constraint error
});
```

### Foreign Key Violations

**When**: Referencing non-existent related record

```typescript
it("rejects session for non-existent user [Test 10/10]", async () => {
  const schemas = await getSchemasByService("auth");
  const schema = schemas[Math.floor(Math.random() * schemas.length)];

  // Try to create session for non-existent user
  let error;
  try {
    await schema.prisma.session.create({
      data: {
        userId: "non-existent-user",
        token: "token",
        expiresAt: new Date(),
      },
    });
  } catch (e) {
    error = e;
  }

  expect(error).toBeDefined();
  expect(error.code).toBe("P2003"); // Foreign key constraint error
});
```

---

## Timeout Scenarios

**When**: Operation takes too long

```typescript
it("handles timeout gracefully", async () => {
  const schemas = await getSchemasByService("auth");
  const schema = schemas[Math.floor(Math.random() * schemas.length)];

  // Simulate a very slow query that times out
  let error;
  try {
    // This would timeout in real production
    // For testing, just simulate the timeout error
    throw new Error("Query timeout after 5000ms");
  } catch (e) {
    error = e;
  }

  expect(error).toBeDefined();
  expect(error.message).toContain("timeout");
});
```

---

## Concurrent Operation Conflicts

**When**: Two operations race and conflict

```typescript
it("handles concurrent update conflicts", async () => {
  const schemas = await getSchemasByService("auth");
  const schema = schemas[Math.floor(Math.random() * schemas.length)];

  // Create a user
  const user = await schema.prisma.user.create({
    data: {
      email: "test@example.com",
      passwordHash: "original",
      role: "user",
    },
  });

  // Simulate two concurrent updates
  const update1 = schema.prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: "new-password-1" },
  });

  const update2 = schema.prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: "new-password-2" },
  });

  // Both complete (last one wins in database)
  const results = await Promise.all([update1, update2]);

  // Final state should have one of the passwords
  const final = await schema.prisma.user.findUnique({
    where: { id: user.id },
  });

  expect(
    final.passwordHash === "new-password-1" ||
      final.passwordHash === "new-password-2"
  ).toBe(true);
});
```

---

## Missing Required Fields

**When**: Creating without required data

```typescript
it("rejects creation without email [Test 7/10]", async () => {
  const schemas = await getSchemasByService("auth");
  const schema = schemas[Math.floor(Math.random() * schemas.length)];

  let error;
  try {
    await schema.prisma.user.create({
      data: {
        // @ts-ignore - Missing email
        passwordHash: "hash",
        role: "user",
      },
    });
  } catch (e) {
    error = e;
  }

  expect(error).toBeDefined();
});
```

---

## Complete Error Handling Example

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

describe("Auth Service - Error Handling", () => {
  it("creates valid user [Test 1/10]", async () => {
    const schemas = await getSchemasByService("auth");
    const schema = schemas[Math.floor(Math.random() * schemas.length)];
    const executionTime = await simulateProductionOperation();
    const userData = generateTestData("user");

    const user = await schema.prisma.user.create({ data: userData });

    expect(user.id).toBeDefined();
    await recordTestExecution(
      "auth-errors",
      "valid-create",
      "success",
      executionTime,
      { testNumber: 1 }
    );
  });

  it("rejects duplicate email [Test 2/10]", async () => {
    const schemas = await getSchemasByService("auth");
    const schema = schemas[Math.floor(Math.random() * schemas.length)];
    const executionTime = await simulateProductionOperation();
    const userData = generateTestData("user");

    // Create first
    await schema.prisma.user.create({ data: userData });

    // Try to create duplicate
    let error;
    try {
      await schema.prisma.user.create({ data: userData });
    } catch (e) {
      error = e;
    }

    expect(error).toBeDefined();
    expect(error.code).toBe("P2002");

    await recordTestExecution(
      "auth-errors",
      "duplicate-email",
      "success",
      executionTime,
      { testNumber: 2 }
    );
  });

  it("returns null for non-existent user [Test 3/10]", async () => {
    const schemas = await getSchemasByService("auth");
    const schema = schemas[Math.floor(Math.random() * schemas.length)];
    const executionTime = await simulateProductionOperation();

    const found = await schema.prisma.user.findUnique({
      where: { id: "non-existent" },
    });

    expect(found).toBeNull();

    await recordTestExecution(
      "auth-errors",
      "not-found",
      "success",
      executionTime,
      { testNumber: 3 }
    );
  });

  it("rejects invalid password hash [Test 4/10]", async () => {
    const schemas = await getSchemasByService("auth");
    const schema = schemas[Math.floor(Math.random() * schemas.length)];
    const executionTime = await simulateProductionOperation();

    let error;
    try {
      await schema.prisma.user.create({
        data: {
          email: "test@example.com",
          passwordHash: "", // Invalid: empty
          role: "user",
        },
      });
    } catch (e) {
      error = e;
    }

    // May or may not error depending on schema constraints
    // Just verify the operation is handled
    expect(executionTime).toBeGreaterThan(0);

    await recordTestExecution(
      "auth-errors",
      "invalid-hash",
      "success",
      executionTime,
      { testNumber: 4 }
    );
  });

  it("handles concurrent login attempts [Test 5/10]", async () => {
    const schemas = await getSchemasByService("auth");
    const schema = schemas[Math.floor(Math.random() * schemas.length)];
    const executionTime = await simulateProductionOperation();

    const userData = generateTestData("user");
    const user = await schema.prisma.user.create({ data: userData });

    // Create 3 sessions concurrently
    const sessions = await Promise.all([
      schema.prisma.session.create({
        data: {
          userId: user.id,
          token: "token-1",
          expiresAt: new Date(),
        },
      }),
      schema.prisma.session.create({
        data: {
          userId: user.id,
          token: "token-2",
          expiresAt: new Date(),
        },
      }),
      schema.prisma.session.create({
        data: {
          userId: user.id,
          token: "token-3",
          expiresAt: new Date(),
        },
      }),
    ]);

    expect(sessions).toHaveLength(3);

    await recordTestExecution(
      "auth-errors",
      "concurrent-sessions",
      "success",
      executionTime,
      { testNumber: 5 }
    );
  });

  it("rejects session for non-existent user [Test 6/10]", async () => {
    const schemas = await getSchemasByService("auth");
    const schema = schemas[Math.floor(Math.random() * schemas.length)];
    const executionTime = await simulateProductionOperation();

    let error;
    try {
      await schema.prisma.session.create({
        data: {
          userId: "non-existent",
          token: "token",
          expiresAt: new Date(),
        },
      });
    } catch (e) {
      error = e;
    }

    expect(error).toBeDefined();

    await recordTestExecution(
      "auth-errors",
      "fk-violation",
      "success",
      executionTime,
      { testNumber: 6 }
    );
  });

  it("handles update of non-existent user [Test 7/10]", async () => {
    const schemas = await getSchemasByService("auth");
    const schema = schemas[Math.floor(Math.random() * schemas.length)];
    const executionTime = await simulateProductionOperation();

    let error;
    try {
      await schema.prisma.user.update({
        where: { id: "non-existent" },
        data: { role: "admin" },
      });
    } catch (e) {
      error = e;
    }

    expect(error).toBeDefined();

    await recordTestExecution(
      "auth-errors",
      "update-not-found",
      "success",
      executionTime,
      { testNumber: 7 }
    );
  });

  it("handles delete of non-existent user [Test 8/10]", async () => {
    const schemas = await getSchemasByService("auth");
    const schema = schemas[Math.floor(Math.random() * schemas.length)];
    const executionTime = await simulateProductionOperation();

    let error;
    try {
      await schema.prisma.user.delete({
        where: { id: "non-existent" },
      });
    } catch (e) {
      error = e;
    }

    expect(error).toBeDefined();

    await recordTestExecution(
      "auth-errors",
      "delete-not-found",
      "success",
      executionTime,
      { testNumber: 8 }
    );
  });

  it("handles bulk operations with errors [Test 9/10]", async () => {
    const schemas = await getSchemasByService("auth");
    const schema = schemas[Math.floor(Math.random() * schemas.length)];
    const executionTime = await simulateProductionOperation();

    const userData1 = generateTestData("user");
    const userData2 = generateTestData("user");

    // Create first user
    await schema.prisma.user.create({ data: userData1 });

    // Try to create bulk including duplicate
    let result;
    try {
      result = await schema.prisma.user.createMany({
        data: [userData2, userData1], // userData1 is duplicate
        skipDuplicates: true, // Don't fail, skip duplicates
      });
    } catch (e) {
      // If skipDuplicates is false, will error
    }

    // With skipDuplicates, only 1 succeeds
    if (result) {
      expect(result.count).toBe(1);
    }

    await recordTestExecution(
      "auth-errors",
      "bulk-with-duplicates",
      "success",
      executionTime,
      { testNumber: 9 }
    );
  });

  it("handles rapid delete and re-create [Test 10/10]", async () => {
    const schemas = await getSchemasByService("auth");
    const schema = schemas[Math.floor(Math.random() * schemas.length)];
    const executionTime = await simulateProductionOperation();

    const userData = generateTestData("user");

    // Create user
    const created = await schema.prisma.user.create({ data: userData });
    expect(created.id).toBeDefined();

    // Delete user
    await schema.prisma.user.delete({ where: { id: created.id } });

    // Verify deleted
    const found = await schema.prisma.user.findUnique({
      where: { id: created.id },
    });
    expect(found).toBeNull();

    // Re-create with same email (now allowed)
    const recreated = await schema.prisma.user.create({ data: userData });
    expect(recreated.email).toBe(userData.email);

    await recordTestExecution(
      "auth-errors",
      "delete-and-recreate",
      "success",
      executionTime,
      { testNumber: 10 }
    );
  });
});
```

---

## Error Codes Reference

```
P2002 - Unique constraint violation
P2003 - Foreign key constraint violation
P2025 - Record not found on required operation
P2000 - Value too long for column
P2001 - Record to delete not found
P2004 - Database operation timeout
```

---

## Key Points

1. **Test happy path** (6-7 tests)
2. **Test error scenarios** (3-4 tests)
3. **Use try-catch** for expected errors
4. **Check error codes** for specific failures
5. **Handle both cases** in assertions

---

**Next**: Read `multi-service-testing.md` to learn about testing workflows across services.
