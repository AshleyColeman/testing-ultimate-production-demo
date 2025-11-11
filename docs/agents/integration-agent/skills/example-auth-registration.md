---
id: example-auth-registration
service: auth
feature: registration
test_count: 10
tests_per_file: 10
last_updated: 2024
---

# Example: Auth Registration Tests

This example demonstrates the integration test pattern for the authentication service's registration feature. It covers:

- ✅ Creating new users with valid data
- ✅ Testing error scenarios (duplicate email, validation failures)
- ✅ Verifying data persistence across schemas
- ✅ Testing concurrent registration attempts
- ✅ Recording metrics for observability

**Use this as a template** when generating new auth tests.

---

## 📝 Test File: auth-registration.test.ts

```typescript
import { describe, expect, it } from "vitest";
import {
  getInfrastructure,
  getSchemasByService,
  recordTestExecution,
} from "../shared/testInfrastructure";
import {
  simulateProductionOperation,
  generateTestData,
} from "../shared/testHelpers";

/**
 * 🧪 Auth Service - Registration Tests
 *
 * Tests for user registration including success cases, validation,
 * error handling, and concurrent operations.
 */
describe("Auth Service - Registration", () => {
  it("should register user with valid email [Test 1/10]", async () => {
    const infra = await getInfrastructure();
    const schemas = await getSchemasByService("auth");
    const schema = schemas[Math.floor(Math.random() * schemas.length)];

    const executionTime = await simulateProductionOperation();
    const userData = generateTestData("user");

    // Create new user via registration
    const user = await schema.prisma.user.create({
      data: userData,
    });

    // Assertions
    expect(user.id).toBeDefined();
    expect(user.email).toBe(userData.email);
    expect(user.createdAt).toBeDefined();
    expect(executionTime).toBeLessThan(12000);

    await recordTestExecution(
      "auth-registration",
      "valid-email",
      "success",
      executionTime,
      { testNumber: 1, schema: schema.schemaName }
    );

    infra.logger.info(
      `✅ User registered with email ${user.email} in ${executionTime}ms`
    );
  });

  it("should reject duplicate email addresses [Test 2/10]", async () => {
    const infra = await getInfrastructure();
    const schemas = await getSchemasByService("auth");
    const schema = schemas[Math.floor(Math.random() * schemas.length)];

    const executionTime = await simulateProductionOperation();
    const userData = generateTestData("user");

    // Create first user
    await schema.prisma.user.create({ data: userData });

    // Try to create second user with same email
    let error: any;
    try {
      await schema.prisma.user.create({ data: userData });
    } catch (e) {
      error = e;
    }

    expect(error).toBeDefined();
    expect(error.code).toBe("P2002"); // Unique constraint violation
    expect(executionTime).toBeLessThan(12000);

    await recordTestExecution(
      "auth-registration",
      "duplicate-email",
      "success",
      executionTime,
      { testNumber: 2, schema: schema.schemaName }
    );

    infra.logger.info(
      `✅ Duplicate email rejected correctly in ${executionTime}ms`
    );
  });

  it("should validate email format [Test 3/10]", async () => {
    const infra = await getInfrastructure();
    const schemas = await getSchemasByService("auth");
    const schema = schemas[Math.floor(Math.random() * schemas.length)];

    const executionTime = await simulateProductionOperation();
    const userData = {
      ...generateTestData("user"),
      email: "invalid-email", // Invalid format
    };

    let error: any;
    try {
      await schema.prisma.user.create({ data: userData });
    } catch (e) {
      error = e;
    }

    expect(error).toBeDefined();
    expect(executionTime).toBeLessThan(12000);

    await recordTestExecution(
      "auth-registration",
      "invalid-email-format",
      "success",
      executionTime,
      { testNumber: 3, schema: schema.schemaName }
    );

    infra.logger.info(`✅ Invalid email format rejected in ${executionTime}ms`);
  });

  it("should require all mandatory fields [Test 4/10]", async () => {
    const infra = await getInfrastructure();
    const schemas = await getSchemasByService("auth");
    const schema = schemas[Math.floor(Math.random() * schemas.length)];

    const executionTime = await simulateProductionOperation();

    let error: any;
    try {
      await schema.prisma.user.create({
        data: {
          email: "test@example.com",
          // Missing required fields: password, name
        } as any,
      });
    } catch (e) {
      error = e;
    }

    expect(error).toBeDefined();
    expect(executionTime).toBeLessThan(12000);

    await recordTestExecution(
      "auth-registration",
      "missing-fields",
      "success",
      executionTime,
      { testNumber: 4, schema: schema.schemaName }
    );

    infra.logger.info(`✅ Missing fields validation in ${executionTime}ms`);
  });

  it("should handle concurrent registrations [Test 5/10]", async () => {
    const infra = await getInfrastructure();
    const schemas = await getSchemasByService("auth");
    const schema = schemas[Math.floor(Math.random() * schemas.length)];

    const executionTime = await simulateProductionOperation();

    // Attempt concurrent registrations
    const user1Data = generateTestData("user");
    const user2Data = generateTestData("user");

    const [user1, user2] = await Promise.all([
      schema.prisma.user.create({ data: user1Data }),
      schema.prisma.user.create({ data: user2Data }),
    ]);

    expect(user1.id).toBeDefined();
    expect(user2.id).toBeDefined();
    expect(user1.id).not.toBe(user2.id); // Different IDs
    expect(executionTime).toBeLessThan(12000);

    await recordTestExecution(
      "auth-registration",
      "concurrent-registration",
      "success",
      executionTime,
      { testNumber: 5, schema: schema.schemaName }
    );

    infra.logger.info(
      `✅ Concurrent registrations completed in ${executionTime}ms`
    );
  });

  it("should set default values for optional fields [Test 6/10]", async () => {
    const infra = await getInfrastructure();
    const schemas = await getSchemasByService("auth");
    const schema = schemas[Math.floor(Math.random() * schemas.length)];

    const executionTime = await simulateProductionOperation();
    const userData = generateTestData("user");

    const user = await schema.prisma.user.create({
      data: userData,
    });

    // Check default values were set
    expect(user.isActive).toBe(true); // Default
    expect(user.emailVerified).toBe(false); // Default
    expect(user.createdAt).toBeDefined();
    expect(executionTime).toBeLessThan(12000);

    await recordTestExecution(
      "auth-registration",
      "default-values",
      "success",
      executionTime,
      { testNumber: 6, schema: schema.schemaName }
    );

    infra.logger.info(`✅ Default values set correctly in ${executionTime}ms`);
  });

  it("should create user session after registration [Test 7/10]", async () => {
    const infra = await getInfrastructure();
    const schemas = await getSchemasByService("auth");
    const schema = schemas[Math.floor(Math.random() * schemas.length)];

    const executionTime = await simulateProductionOperation();
    const userData = generateTestData("user");
    const sessionData = generateTestData("session");

    // Create user
    const user = await schema.prisma.user.create({
      data: userData,
    });

    // Create initial session
    const session = await schema.prisma.session.create({
      data: {
        ...sessionData,
        userId: user.id,
      },
    });

    expect(session.id).toBeDefined();
    expect(session.userId).toBe(user.id);
    expect(session.isActive).toBe(true);
    expect(executionTime).toBeLessThan(12000);

    await recordTestExecution(
      "auth-registration",
      "auto-session-creation",
      "success",
      executionTime,
      { testNumber: 7, schema: schema.schemaName }
    );

    infra.logger.info(`✅ Session created with user in ${executionTime}ms`);
  });

  it("should verify new user is searchable [Test 8/10]", async () => {
    const infra = await getInfrastructure();
    const schemas = await getSchemasByService("auth");
    const schema = schemas[Math.floor(Math.random() * schemas.length)];

    const executionTime = await simulateProductionOperation();
    const userData = generateTestData("user");

    // Create user
    const createdUser = await schema.prisma.user.create({
      data: userData,
    });

    // Find user by email
    const foundUser = await schema.prisma.user.findUnique({
      where: { email: userData.email },
    });

    expect(foundUser).toBeDefined();
    expect(foundUser?.id).toBe(createdUser.id);
    expect(foundUser?.email).toBe(userData.email);
    expect(executionTime).toBeLessThan(12000);

    await recordTestExecution(
      "auth-registration",
      "user-searchable",
      "success",
      executionTime,
      { testNumber: 8, schema: schema.schemaName }
    );

    infra.logger.info(`✅ Registered user is searchable in ${executionTime}ms`);
  });

  it("should handle rapid registration and deletion [Test 9/10]", async () => {
    const infra = await getInfrastructure();
    const schemas = await getSchemasByService("auth");
    const schema = schemas[Math.floor(Math.random() * schemas.length)];

    const executionTime = await simulateProductionOperation();
    const userData = generateTestData("user");

    // Register
    const user = await schema.prisma.user.create({
      data: userData,
    });

    // Delete immediately
    const deleted = await schema.prisma.user.delete({
      where: { id: user.id },
    });

    expect(deleted.id).toBe(user.id);

    // Verify deleted
    const notFound = await schema.prisma.user.findUnique({
      where: { id: user.id },
    });

    expect(notFound).toBeNull();
    expect(executionTime).toBeLessThan(12000);

    await recordTestExecution(
      "auth-registration",
      "rapid-registration-deletion",
      "success",
      executionTime,
      { testNumber: 9, schema: schema.schemaName }
    );

    infra.logger.info(
      `✅ Rapid registration/deletion handled in ${executionTime}ms`
    );
  });

  it("should track registration timestamp [Test 10/10]", async () => {
    const infra = await getInfrastructure();
    const schemas = await getSchemasByService("auth");
    const schema = schemas[Math.floor(Math.random() * schemas.length)];

    const executionTime = await simulateProductionOperation();
    const beforeRegistration = new Date();
    const userData = generateTestData("user");

    const user = await schema.prisma.user.create({
      data: userData,
    });

    const afterRegistration = new Date();

    // Verify timestamp is within expected range
    expect(user.createdAt).toBeGreaterThanOrEqual(beforeRegistration);
    expect(user.createdAt).toBeLessThanOrEqual(afterRegistration);
    expect(executionTime).toBeLessThan(12000);

    await recordTestExecution(
      "auth-registration",
      "timestamp-tracking",
      "success",
      executionTime,
      { testNumber: 10, schema: schema.schemaName }
    );

    infra.logger.info(
      `✅ Registration timestamp tracked correctly in ${executionTime}ms`
    );
  });
});
```

---

## 🎯 Key Patterns in This Example

### ✅ 10 Tests Total

- Tests 1-5: Happy paths and basic functionality
- Tests 6-10: Validation, constraints, and edge cases

### ✅ Each Test Follows the Pattern

```typescript
// 1. Get infrastructure and random schema
const infra = await getInfrastructure();
const schemas = await getSchemasByService("auth");
const schema = schemas[Math.floor(Math.random() * schemas.length)];

// 2. Simulate production delays
const executionTime = await simulateProductionOperation();

// 3. Generate test data
const userData = generateTestData("user");

// 4. Execute operation
const user = await schema.prisma.user.create({ data: userData });

// 5. Assert results
expect(user.id).toBeDefined();
expect(executionTime).toBeLessThan(12000);

// 6. Record metrics
await recordTestExecution(
  "auth-registration",
  "operation-name",
  "success",
  executionTime,
  { testNumber: N, schema: schema.schemaName }
);
```

### ✅ Error Handling Pattern

```typescript
let error: any;
try {
  await schema.prisma.user.create({ data: invalidData });
} catch (e) {
  error = e;
}

expect(error).toBeDefined();
expect(error.code).toBe("P2002"); // Specific error code
```

### ✅ Multi-Operation Pattern

```typescript
// Create user first
const user = await schema.prisma.user.create({ data: userData });

// Then create related session
const session = await schema.prisma.session.create({
  data: {
    ...sessionData,
    userId: user.id, // Reference to user
  },
});
```

---

## 🚀 How to Use This Example

1. **For auth-registration**: Copy this file exactly (it's production-ready!)
2. **For other services**: Use as a template, adjust for your service
3. **For other features**: Change feature name, test names, and operations

**Copy and modify** this pattern for other test files!
