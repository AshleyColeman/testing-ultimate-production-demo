---
name: test-multi-service-flows
description: >
  Test workflows spanning multiple services with cross-domain interactions.
  Use when: testing operations that touch 2+ services (e.g., user creation in auth triggers payment setup).
  Fits in workflow: optional; use after perform-crud-operations for integration scenarios.
---

# Test Multi-Service Flows

**PURPOSE**: Verify operations work correctly across service boundaries.
Use when one service calls another or data flows between services.

## When to use

- **Triggers**: "test cross-service", "multi-domain", "service interaction", "workflow spans"
- **Input**: 2+ service names, cross-service dependencies, foreign key relationships
- **Output**: Test that creates data in service A, references it in service B, verifies consistency
- **Not for**: Testing single service in isolation (use single-service tests)
- **Optional**: Include 0-2 multi-service tests depending on architecture

## Quick start

1. Get schemas for both services: `const authSchemas = await getSchemasByService("auth")`
2. Create data in first service: `const user = await authSchema.prisma.user.create(...)`
3. Reference in second service: `await paymentSchema.prisma.order.create({ userId: user.id, ... })`
4. Verify relationship: Check order has correct userId

## Workflow

- **Gather**: Know which services interact, understand foreign key relationships
- **Execute**: Create in one service, reference in another, verify links
- **Validate**: Data in both services is consistent; foreign keys valid

## File & tool use

- Read: Understand service-to-service dependencies (docs or schema)
- Run: None required
- Prefer: Real cross-service operations over mocks

## Guardrails

- Use real service interactions (no mocks)
- Verify foreign key relationships are valid
- Both services should be in same schema set (or at least compatible)
- Keep to 0-2 multi-service tests maximum

## Examples

**Example A**: Auth user → Payment account

```typescript
it("creates payment account when user is created [Test 9/10]", async () => {
  const authSchemas = await getSchemasByService("auth");
  const paymentSchemas = await getSchemasByService("payment");

  const authSchema = authSchemas[0];
  const paymentSchema = paymentSchemas[0];

  // Create in auth
  const user = await authSchema.prisma.user.create({
    data: { email: "test@example.com", ... }
  });

  // Create account in payment using user ID
  const account = await paymentSchema.prisma.paymentAccount.create({
    data: { userId: user.id, accountType: "standard", ... }
  });

  expect(account.userId).toBe(user.id);
});
```

**Example B**: Inventory reservation for payment order

```typescript
it("reserves inventory when order created", async () => {
  const paymentSchemas = await getSchemasByService("payment");
  const inventorySchemas = await getSchemasByService("inventory");

  const paymentSchema = paymentSchemas[0];
  const inventorySchema = inventorySchemas[0];

  // Create order in payment
  const order = await paymentSchema.prisma.order.create({
    data: { customerId: "cust-1", total: 100, ... }
  });

  // Verify/create reservation in inventory
  const reservation = await inventorySchema.prisma.reservation.create({
    data: { orderId: order.id, productId: "prod-1", quantity: 2, ... }
  });

  expect(reservation.orderId).toBe(order.id);
});
```

**Example C**: Notification delivery on user registration

```typescript
it("sends welcome notification on auth registration", async () => {
  const authSchemas = await getSchemasByService("auth");
  const notificationSchemas = await getSchemasByService("notification");

  const authSchema = authSchemas[0];
  const notificationSchema = notificationSchemas[0];

  // Register user
  const user = await authSchema.prisma.user.create({
    data: { email: "new@example.com", ... }
  });

  // Verify notification was created
  const notification = await notificationSchema.prisma.notification.create({
    data: { userId: user.id, type: "welcome", ... }
  });

  expect(notification.userId).toBe(user.id);
});
```

## Troubleshooting

- **Foreign key error** → Verify both services have compatible schema naming
- **Can't reference data from one service in another** → Check if foreign key relationship is defined
- **Data doesn't appear in second service** → Ensure you're creating it explicitly (no automatic propagation)

## Changelog

- v0.2 – Refactored to minimal skill format
- v0.1 – Multi-service testing patterns

---

**Related**: perform-crud-operations, test-error-scenarios
**Next**: verify-test-quality

---

## Pattern: Multi-Service Test Structure

```typescript
it("test name [Test N/10]", async () => {
  const service1Schemas = await getSchemasByService("SERVICE1");
  const service2Schemas = await getSchemasByService("SERVICE2");

  const schema1 = service1Schemas[0];
  const schema2 = service2Schemas[0];

  // Create in service 1
  const data1 = await schema1.prisma.TABLE1.create({...});

  // Reference in service 2
  const data2 = await schema2.prisma.TABLE2.create({
    field: data1.id, // Link to service 1
    ...
  });

  // Verify link
  expect(data2.field).toBe(data1.id);
});
```

Use sparingly: Only include multi-service tests if your architecture requires cross-service operations.
data: { email: "test@example.com" },
});

// Create payment profile in payment service
const profile = await paymentSchema.prisma.paymentProfile.create({
data: {
userId: user.id, // Reference from auth service
paymentMethod: "credit_card",
},
});

// Verify both exist
expect(user.id).toBeDefined();
expect(profile.userId).toBe(user.id);
});

```

---

## Service Boundaries

```

┌─────────────┐ ┌──────────────┐
│ Auth Service│ │Payment Service│
│ (auth*\*) │ │ (payment*\*) │
├─────────────┤ ├──────────────┤
│ User │ │PaymentProfile│
│ Session │ │Transaction │
│ Permission │ │Billing │
└─────────────┘ └──────────────┘
│ ▲
│ creates user │
└──────────────────────┘
in auth service

````

---

## Example: Payment Processing Workflow

```typescript
describe("Payment Processing Workflow", () => {
  it("user creates payment profile [Test 1/10]", async () => {
    // Get both services
    const authSchemas = await getSchemasByService("auth");
    const paymentSchemas = await getSchemasByService("payment");

    const authSchema = authSchemas[Math.floor(Math.random() * 4)];
    const paymentSchema = paymentSchemas[Math.floor(Math.random() * 4)];

    const executionTime = await simulateProductionOperation();
    const userData = generateTestData("user");

    // 1. Create user in auth service
    const user = await authSchema.prisma.user.create({
      data: userData,
    });

    // 2. Create payment profile in payment service
    const profile = await paymentSchema.prisma.paymentProfile.create({
      data: {
        userId: user.id, // Reference from auth service
        paymentMethod: "credit_card",
        cardLast4: "4242",
      },
    });

    // 3. Verify relationship
    expect(user.id).toBeDefined();
    expect(profile.userId).toBe(user.id);

    await recordTestExecution(
      "payment-workflow",
      "create-profile",
      "success",
      executionTime,
      { testNumber: 1 }
    );
  });

  it("user processes transaction [Test 2/10]", async () => {
    const authSchemas = await getSchemasByService("auth");
    const paymentSchemas = await getSchemasByService("payment");
    const inventorySchemas = await getSchemasByService("inventory");

    const authSchema = authSchemas[0];
    const paymentSchema = paymentSchemas[0];
    const inventorySchema = inventorySchemas[0];

    const executionTime = await simulateProductionOperation();

    // 1. Get user from auth
    const user = await authSchema.prisma.user.create({
      data: generateTestData("user"),
    });

    // 2. Get payment profile from payment service
    const profile = await paymentSchema.prisma.paymentProfile.create({
      data: {
        userId: user.id,
        paymentMethod: "credit_card",
      },
    });

    // 3. Create transaction
    const transaction = await paymentSchema.prisma.transaction.create({
      data: {
        profileId: profile.id,
        amount: 9999,
        status: "completed",
      },
    });

    // 4. Reserve inventory
    const reservation = await inventorySchema.prisma.reservation.create({
      data: {
        userId: user.id,
        transactionId: transaction.id,
        quantity: 5,
      },
    });

    // 5. Verify all created
    expect(transaction.profileId).toBe(profile.id);
    expect(reservation.userId).toBe(user.id);

    await recordTestExecution(
      "payment-workflow",
      "process-transaction",
      "success",
      executionTime,
      { testNumber: 2 }
    );
  });

  it("inventory updates on payment [Test 3/10]", async () => {
    const paymentSchemas = await getSchemasByService("payment");
    const inventorySchemas = await getSchemasByService("inventory");

    const paymentSchema = paymentSchemas[0];
    const inventorySchema = inventorySchemas[0];

    const executionTime = await simulateProductionOperation();

    // Create product in inventory
    const product = await inventorySchema.prisma.product.create({
      data: {
        sku: "SKU-12345",
        stock: 100,
      },
    });

    // Create transaction in payment
    const transaction = await paymentSchema.prisma.transaction.create({
      data: {
        amount: 5000,
        status: "completed",
      },
    });

    // Reserve stock for this transaction
    const reservation = await inventorySchema.prisma.reservation.create({
      data: {
        productId: product.id,
        transactionId: transaction.id,
        quantity: 10,
      },
    });

    // Verify inventory tracking
    const updated = await inventorySchema.prisma.product.findUnique({
      where: { id: product.id },
      include: { reservations: true },
    });

    expect(updated.reservations).toHaveLength(1);

    await recordTestExecution(
      "payment-workflow",
      "inventory-tracking",
      "success",
      executionTime,
      { testNumber: 3 }
    );
  });
});
````

---

## Key Points

1. **Use getSchemasByService() for each service** — get schemas from right containers
2. **Random schema selection per service** — load balancing simulation
3. **Reference across services via IDs** — user.id from auth → paymentProfile.userId
4. **Test data consistency** — verify relationships after multi-service operations
5. **Limit to 10 tests per file** — can include multi-service workflows

---

**Next**: Read `test-execution-recording.md` to learn about logging metrics.
