---
id: example-payment-processing
service: payment
feature: processing
test_count: 10
tests_per_file: 10
last_updated: 2024
---

# Example: Payment Processing Tests

This example demonstrates integration tests for payment processing across multiple services. It covers:

- ✅ Creating payment transactions
- ✅ Testing validation (amount, currency)
- ✅ Handling concurrent payments
- ✅ Cross-service references (auth + payment)
- ✅ Error scenarios and rollback

**Use this as a template** when generating payment service tests.

---

## 📝 Test File: payment-processing.test.ts

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
 * 🧪 Payment Service - Processing Tests
 *
 * Tests for payment processing including transactions, validations,
 * multi-service workflows, and error handling.
 */
describe("Payment Service - Processing", () => {
  it("should process payment with valid amount [Test 1/10]", async () => {
    const infra = await getInfrastructure();
    const schemas = await getSchemasByService("payment");
    const schema = schemas[Math.floor(Math.random() * schemas.length)];

    const executionTime = await simulateProductionOperation();
    const paymentData = generateTestData("payment");

    const transaction = await schema.prisma.transaction.create({
      data: {
        ...paymentData,
        amount: 99.99,
        currency: "USD",
        status: "completed",
      },
    });

    expect(transaction.id).toBeDefined();
    expect(transaction.amount).toBe(99.99);
    expect(transaction.status).toBe("completed");
    expect(executionTime).toBeLessThan(12000);

    await recordTestExecution(
      "payment-processing",
      "valid-amount",
      "success",
      executionTime,
      { testNumber: 1, schema: schema.schemaName }
    );

    infra.logger.info(
      `✅ Payment of $${transaction.amount} processed in ${executionTime}ms`
    );
  });

  it("should reject negative amounts [Test 2/10]", async () => {
    const infra = await getInfrastructure();
    const schemas = await getSchemasByService("payment");
    const schema = schemas[Math.floor(Math.random() * schemas.length)];

    const executionTime = await simulateProductionOperation();
    const paymentData = generateTestData("payment");

    let error: any;
    try {
      await schema.prisma.transaction.create({
        data: {
          ...paymentData,
          amount: -50.0, // Invalid: negative
          currency: "USD",
        },
      });
    } catch (e) {
      error = e;
    }

    expect(error).toBeDefined();
    expect(executionTime).toBeLessThan(12000);

    await recordTestExecution(
      "payment-processing",
      "negative-amount-rejected",
      "success",
      executionTime,
      { testNumber: 2, schema: schema.schemaName }
    );

    infra.logger.info(`✅ Negative amount rejected in ${executionTime}ms`);
  });

  it("should validate currency code [Test 3/10]", async () => {
    const infra = await getInfrastructure();
    const schemas = await getSchemasByService("payment");
    const schema = schemas[Math.floor(Math.random() * schemas.length)];

    const executionTime = await simulateProductionOperation();
    const paymentData = generateTestData("payment");

    let error: any;
    try {
      await schema.prisma.transaction.create({
        data: {
          ...paymentData,
          amount: 100.0,
          currency: "INVALID", // Invalid currency code
        },
      });
    } catch (e) {
      error = e;
    }

    expect(error).toBeDefined();
    expect(executionTime).toBeLessThan(12000);

    await recordTestExecution(
      "payment-processing",
      "invalid-currency",
      "success",
      executionTime,
      { testNumber: 3, schema: schema.schemaName }
    );

    infra.logger.info(`✅ Invalid currency rejected in ${executionTime}ms`);
  });

  it("should link payment to user via auth service [Test 4/10]", async () => {
    const infra = await getInfrastructure();

    // Get schemas for both services
    const authSchemas = await getSchemasByService("auth");
    const paymentSchemas = await getSchemasByService("payment");
    const authSchema =
      authSchemas[Math.floor(Math.random() * authSchemas.length)];
    const paymentSchema =
      paymentSchemas[Math.floor(Math.random() * paymentSchemas.length)];

    const executionTime = await simulateProductionOperation();
    const userData = generateTestData("user");
    const paymentData = generateTestData("payment");

    // Create user in auth service
    const user = await authSchema.prisma.user.create({
      data: userData,
    });

    // Create payment linked to user
    const transaction = await paymentSchema.prisma.transaction.create({
      data: {
        ...paymentData,
        userId: user.id, // Cross-service reference
        amount: 150.0,
        currency: "USD",
      },
    });

    expect(transaction.userId).toBe(user.id);
    expect(transaction.id).toBeDefined();
    expect(executionTime).toBeLessThan(12000);

    await recordTestExecution(
      "payment-processing",
      "multi-service-user-link",
      "success",
      executionTime,
      { testNumber: 4, schema: paymentSchema.schemaName }
    );

    infra.logger.info(
      `✅ Multi-service payment linked to user in ${executionTime}ms`
    );
  });

  it("should handle concurrent payment processing [Test 5/10]", async () => {
    const infra = await getInfrastructure();
    const schemas = await getSchemasByService("payment");
    const schema = schemas[Math.floor(Math.random() * schemas.length)];

    const executionTime = await simulateProductionOperation();

    // Process multiple payments concurrently
    const payment1 = generateTestData("payment");
    const payment2 = generateTestData("payment");
    const payment3 = generateTestData("payment");

    const [trans1, trans2, trans3] = await Promise.all([
      schema.prisma.transaction.create({
        data: { ...payment1, amount: 100.0, currency: "USD" },
      }),
      schema.prisma.transaction.create({
        data: { ...payment2, amount: 200.0, currency: "USD" },
      }),
      schema.prisma.transaction.create({
        data: { ...payment3, amount: 300.0, currency: "USD" },
      }),
    ]);

    expect(trans1.id).toBeDefined();
    expect(trans2.id).toBeDefined();
    expect(trans3.id).toBeDefined();
    expect(trans1.id).not.toBe(trans2.id);
    expect(executionTime).toBeLessThan(12000);

    await recordTestExecution(
      "payment-processing",
      "concurrent-payments",
      "success",
      executionTime,
      { testNumber: 5, schema: schema.schemaName }
    );

    infra.logger.info(
      `✅ 3 concurrent payments processed in ${executionTime}ms`
    );
  });

  it("should track payment status transitions [Test 6/10]", async () => {
    const infra = await getInfrastructure();
    const schemas = await getSchemasByService("payment");
    const schema = schemas[Math.floor(Math.random() * schemas.length)];

    const executionTime = await simulateProductionOperation();
    const paymentData = generateTestData("payment");

    // Create pending payment
    const transaction = await schema.prisma.transaction.create({
      data: {
        ...paymentData,
        amount: 250.0,
        currency: "USD",
        status: "pending",
      },
    });

    // Transition to processing
    const updated = await schema.prisma.transaction.update({
      where: { id: transaction.id },
      data: { status: "processing" },
    });

    expect(updated.status).toBe("processing");
    expect(executionTime).toBeLessThan(12000);

    await recordTestExecution(
      "payment-processing",
      "status-transition",
      "success",
      executionTime,
      { testNumber: 6, schema: schema.schemaName }
    );

    infra.logger.info(
      `✅ Status transitioned to ${updated.status} in ${executionTime}ms`
    );
  });

  it("should calculate total amount for multiple transactions [Test 7/10]", async () => {
    const infra = await getInfrastructure();
    const schemas = await getSchemasByService("payment");
    const schema = schemas[Math.floor(Math.random() * schemas.length)];

    const executionTime = await simulateProductionOperation();

    // Create multiple transactions
    const userData = generateTestData("user");
    const user = { id: userData.id }; // Use user ID for grouping

    const trans1 = await schema.prisma.transaction.create({
      data: {
        ...generateTestData("payment"),
        userId: user.id,
        amount: 100.0,
        currency: "USD",
        status: "completed",
      },
    });

    const trans2 = await schema.prisma.transaction.create({
      data: {
        ...generateTestData("payment"),
        userId: user.id,
        amount: 200.0,
        currency: "USD",
        status: "completed",
      },
    });

    // Calculate total
    const transactions = await schema.prisma.transaction.findMany({
      where: { userId: user.id, status: "completed" },
    });

    const total = transactions.reduce((sum, t) => sum + t.amount, 0);

    expect(transactions.length).toBe(2);
    expect(total).toBe(300.0);
    expect(executionTime).toBeLessThan(12000);

    await recordTestExecution(
      "payment-processing",
      "transaction-aggregation",
      "success",
      executionTime,
      { testNumber: 7, schema: schema.schemaName }
    );

    infra.logger.info(`✅ Total calculated: $${total} in ${executionTime}ms`);
  });

  it("should handle payment timeout [Test 8/10]", async () => {
    const infra = await getInfrastructure();
    const schemas = await getSchemasByService("payment");
    const schema = schemas[Math.floor(Math.random() * schemas.length)];

    const executionTime = await simulateProductionOperation();
    const paymentData = generateTestData("payment");

    // Create transaction with timeout status
    const transaction = await schema.prisma.transaction.create({
      data: {
        ...paymentData,
        amount: 500.0,
        currency: "USD",
        status: "timeout",
        retryCount: 3,
      },
    });

    expect(transaction.status).toBe("timeout");
    expect(transaction.retryCount).toBe(3);
    expect(executionTime).toBeLessThan(12000);

    await recordTestExecution(
      "payment-processing",
      "payment-timeout",
      "success",
      executionTime,
      { testNumber: 8, schema: schema.schemaName }
    );

    infra.logger.info(`✅ Timeout handled correctly in ${executionTime}ms`);
  });

  it("should verify refund reverses amount [Test 9/10]", async () => {
    const infra = await getInfrastructure();
    const schemas = await getSchemasByService("payment");
    const schema = schemas[Math.floor(Math.random() * schemas.length)];

    const executionTime = await simulateProductionOperation();
    const paymentData = generateTestData("payment");

    // Create original payment
    const original = await schema.prisma.transaction.create({
      data: {
        ...paymentData,
        amount: 500.0,
        currency: "USD",
        status: "completed",
        type: "payment",
      },
    });

    // Create refund
    const refund = await schema.prisma.transaction.create({
      data: {
        ...paymentData,
        amount: -500.0, // Reversed amount
        currency: "USD",
        status: "completed",
        type: "refund",
        relatedTransactionId: original.id,
      },
    });

    expect(refund.amount).toBe(-original.amount);
    expect(refund.type).toBe("refund");
    expect(executionTime).toBeLessThan(12000);

    await recordTestExecution(
      "payment-processing",
      "refund-reversal",
      "success",
      executionTime,
      { testNumber: 9, schema: schema.schemaName }
    );

    infra.logger.info(
      `✅ Refund reversed amount correctly in ${executionTime}ms`
    );
  });

  it("should prevent duplicate transaction processing [Test 10/10]", async () => {
    const infra = await getInfrastructure();
    const schemas = await getSchemasByService("payment");
    const schema = schemas[Math.floor(Math.random() * schemas.length)];

    const executionTime = await simulateProductionOperation();
    const paymentData = generateTestData("payment");
    const idempotencyKey = "unique-key-" + Date.now();

    // Create first transaction
    const trans1 = await schema.prisma.transaction.create({
      data: {
        ...paymentData,
        amount: 100.0,
        currency: "USD",
        idempotencyKey,
      },
    });

    // Try to create duplicate with same idempotency key
    let error: any;
    try {
      await schema.prisma.transaction.create({
        data: {
          ...paymentData,
          amount: 100.0,
          currency: "USD",
          idempotencyKey, // Same key = duplicate
        },
      });
    } catch (e) {
      error = e;
    }

    expect(error).toBeDefined(); // Should fail on uniqueness
    expect(trans1.id).toBeDefined();
    expect(executionTime).toBeLessThan(12000);

    await recordTestExecution(
      "payment-processing",
      "duplicate-prevention",
      "success",
      executionTime,
      { testNumber: 10, schema: schema.schemaName }
    );

    infra.logger.info(
      `✅ Duplicate transaction prevented in ${executionTime}ms`
    );
  });
});
```

---

## 🎯 Key Patterns in This Example

### ✅ Multi-Service Testing (Test 4)

```typescript
// Get schemas for both services
const authSchemas = await getSchemasByService("auth");
const paymentSchemas = await getSchemasByService("payment");

// Create in first service
const user = await authSchema.prisma.user.create({ data: userData });

// Reference in second service
const transaction = await paymentSchema.prisma.transaction.create({
  data: {
    ...paymentData,
    userId: user.id, // Cross-service reference
  },
});
```

### ✅ Concurrent Operations (Test 5)

```typescript
const [trans1, trans2, trans3] = await Promise.all([
  schema.prisma.transaction.create({ data: payment1 }),
  schema.prisma.transaction.create({ data: payment2 }),
  schema.prisma.transaction.create({ data: payment3 }),
]);
```

### ✅ Status Transitions (Test 6)

```typescript
// Create with initial status
const transaction = await schema.prisma.transaction.create({
  data: { ...paymentData, status: "pending" },
});

// Update status
const updated = await schema.prisma.transaction.update({
  where: { id: transaction.id },
  data: { status: "processing" },
});
```

### ✅ Aggregation (Test 7)

```typescript
const transactions = await schema.prisma.transaction.findMany({
  where: { userId: user.id, status: "completed" },
});

const total = transactions.reduce((sum, t) => sum + t.amount, 0);
```
