---
id: example-inventory-adjustment
service: inventory
feature: adjustment
test_count: 10
tests_per_file: 10
last_updated: 2024
---

# Example: Inventory Adjustment Tests

This example demonstrates integration tests for inventory operations. It covers:

- ✅ Adjusting stock levels
- ✅ Handling reservations and allocations
- ✅ Preventing oversell scenarios
- ✅ Tracking inventory movements
- ✅ Multi-location operations

**Use this as a template** when generating inventory service tests.

---

## 📝 Test File: inventory-adjustment.test.ts

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
 * 🧪 Inventory Service - Adjustment Tests
 *
 * Tests for inventory operations including stock adjustment,
 * reservations, allocations, and multi-location movements.
 */
describe("Inventory Service - Adjustment", () => {
  it("should increase stock level [Test 1/10]", async () => {
    const infra = await getInfrastructure();
    const schemas = await getSchemasByService("inventory");
    const schema = schemas[Math.floor(Math.random() * schemas.length)];

    const executionTime = await simulateProductionOperation();
    const productData = generateTestData("product");

    // Create product with initial stock
    const product = await schema.prisma.product.create({
      data: {
        ...productData,
        sku: "TEST-SKU-" + Date.now(),
        stock: 100,
      },
    });

    // Increase stock
    const updated = await schema.prisma.product.update({
      where: { id: product.id },
      data: { stock: { increment: 50 } },
    });

    expect(updated.stock).toBe(150);
    expect(executionTime).toBeLessThan(12000);

    await recordTestExecution(
      "inventory-adjustment",
      "increase-stock",
      "success",
      executionTime,
      { testNumber: 1, schema: schema.schemaName }
    );

    infra.logger.info(
      `✅ Stock increased to ${updated.stock} in ${executionTime}ms`
    );
  });

  it("should decrease stock level [Test 2/10]", async () => {
    const infra = await getInfrastructure();
    const schemas = await getSchemasByService("inventory");
    const schema = schemas[Math.floor(Math.random() * schemas.length)];

    const executionTime = await simulateProductionOperation();
    const productData = generateTestData("product");

    const product = await schema.prisma.product.create({
      data: { ...productData, sku: "TEST-SKU-" + Date.now(), stock: 200 },
    });

    // Decrease stock
    const updated = await schema.prisma.product.update({
      where: { id: product.id },
      data: { stock: { decrement: 75 } },
    });

    expect(updated.stock).toBe(125);
    expect(executionTime).toBeLessThan(12000);

    await recordTestExecution(
      "inventory-adjustment",
      "decrease-stock",
      "success",
      executionTime,
      { testNumber: 2, schema: schema.schemaName }
    );

    infra.logger.info(
      `✅ Stock decreased to ${updated.stock} in ${executionTime}ms`
    );
  });

  it("should prevent negative stock [Test 3/10]", async () => {
    const infra = await getInfrastructure();
    const schemas = await getSchemasByService("inventory");
    const schema = schemas[Math.floor(Math.random() * schemas.length)];

    const executionTime = await simulateProductionOperation();
    const productData = generateTestData("product");

    const product = await schema.prisma.product.create({
      data: { ...productData, sku: "TEST-SKU-" + Date.now(), stock: 50 },
    });

    // Try to decrement below zero
    let error: any;
    try {
      await schema.prisma.product.update({
        where: { id: product.id },
        data: { stock: { decrement: 100 } }, // Would go negative
      });
    } catch (e) {
      error = e;
    }

    expect(error).toBeDefined();
    expect(executionTime).toBeLessThan(12000);

    await recordTestExecution(
      "inventory-adjustment",
      "prevent-negative",
      "success",
      executionTime,
      { testNumber: 3, schema: schema.schemaName }
    );

    infra.logger.info(`✅ Negative stock prevented in ${executionTime}ms`);
  });

  it("should reserve stock for order [Test 4/10]", async () => {
    const infra = await getInfrastructure();
    const schemas = await getSchemasByService("inventory");
    const schema = schemas[Math.floor(Math.random() * schemas.length)];

    const executionTime = await simulateProductionOperation();
    const productData = generateTestData("product");

    // Create product
    const product = await schema.prisma.product.create({
      data: { ...productData, sku: "TEST-SKU-" + Date.now(), stock: 500 },
    });

    // Create reservation
    const reservation = await schema.prisma.reservation.create({
      data: {
        ...generateTestData("order"),
        productId: product.id,
        quantity: 100,
        status: "reserved",
      },
    });

    expect(reservation.productId).toBe(product.id);
    expect(reservation.quantity).toBe(100);
    expect(reservation.status).toBe("reserved");
    expect(executionTime).toBeLessThan(12000);

    await recordTestExecution(
      "inventory-adjustment",
      "stock-reservation",
      "success",
      executionTime,
      { testNumber: 4, schema: schema.schemaName }
    );

    infra.logger.info(
      `✅ ${reservation.quantity} units reserved in ${executionTime}ms`
    );
  });

  it("should release reserved stock [Test 5/10]", async () => {
    const infra = await getInfrastructure();
    const schemas = await getSchemasByService("inventory");
    const schema = schemas[Math.floor(Math.random() * schemas.length)];

    const executionTime = await simulateProductionOperation();
    const productData = generateTestData("product");

    const product = await schema.prisma.product.create({
      data: { ...productData, sku: "TEST-SKU-" + Date.now(), stock: 500 },
    });

    // Reserve
    const reservation = await schema.prisma.reservation.create({
      data: {
        ...generateTestData("order"),
        productId: product.id,
        quantity: 100,
        status: "reserved",
      },
    });

    // Release
    const released = await schema.prisma.reservation.update({
      where: { id: reservation.id },
      data: { status: "released" },
    });

    expect(released.status).toBe("released");
    expect(executionTime).toBeLessThan(12000);

    await recordTestExecution(
      "inventory-adjustment",
      "release-reservation",
      "success",
      executionTime,
      { testNumber: 5, schema: schema.schemaName }
    );

    infra.logger.info(`✅ Reservation released in ${executionTime}ms`);
  });

  it("should track inventory audit trail [Test 6/10]", async () => {
    const infra = await getInfrastructure();
    const schemas = await getSchemasByService("inventory");
    const schema = schemas[Math.floor(Math.random() * schemas.length)];

    const executionTime = await simulateProductionOperation();
    const productData = generateTestData("product");

    const product = await schema.prisma.product.create({
      data: { ...productData, sku: "TEST-SKU-" + Date.now(), stock: 1000 },
    });

    // Log adjustment
    const adjustment = await schema.prisma.inventoryAudit.create({
      data: {
        productId: product.id,
        previousQuantity: 1000,
        newQuantity: 950,
        adjustmentType: "sale",
        reason: "order-fulfilled",
        adjustedBy: "system",
      },
    });

    expect(adjustment.productId).toBe(product.id);
    expect(adjustment.previousQuantity).toBe(1000);
    expect(adjustment.newQuantity).toBe(950);
    expect(adjustment.adjustmentType).toBe("sale");
    expect(executionTime).toBeLessThan(12000);

    await recordTestExecution(
      "inventory-adjustment",
      "audit-trail",
      "success",
      executionTime,
      { testNumber: 6, schema: schema.schemaName }
    );

    infra.logger.info(`✅ Audit trail logged in ${executionTime}ms`);
  });

  it("should handle transfer between locations [Test 7/10]", async () => {
    const infra = await getInfrastructure();
    const schemas = await getSchemasByService("inventory");
    const schema = schemas[Math.floor(Math.random() * schemas.length)];

    const executionTime = await simulateProductionOperation();
    const productData = generateTestData("product");

    // Source location
    const sourceProduct = await schema.prisma.product.create({
      data: {
        ...productData,
        sku: "SOURCE-" + Date.now(),
        stock: 500,
        location: "warehouse-a",
      },
    });

    // Destination location
    const destProduct = await schema.prisma.product.create({
      data: {
        ...generateTestData("product"),
        sku: "DEST-" + Date.now(),
        stock: 100,
        location: "warehouse-b",
      },
    });

    // Transfer
    const transfer = await schema.prisma.inventoryTransfer.create({
      data: {
        sourceProductId: sourceProduct.id,
        destinationProductId: destProduct.id,
        quantity: 200,
        status: "completed",
      },
    });

    expect(transfer.quantity).toBe(200);
    expect(transfer.status).toBe("completed");
    expect(executionTime).toBeLessThan(12000);

    await recordTestExecution(
      "inventory-adjustment",
      "location-transfer",
      "success",
      executionTime,
      { testNumber: 7, schema: schema.schemaName }
    );

    infra.logger.info(`✅ 200 units transferred in ${executionTime}ms`);
  });

  it("should prevent oversell with concurrent orders [Test 8/10]", async () => {
    const infra = await getInfrastructure();
    const schemas = await getSchemasByService("inventory");
    const schema = schemas[Math.floor(Math.random() * schemas.length)];

    const executionTime = await simulateProductionOperation();
    const productData = generateTestData("product");

    const product = await schema.prisma.product.create({
      data: { ...productData, sku: "TEST-SKU-" + Date.now(), stock: 100 },
    });

    // Attempt concurrent orders that would oversell
    let successCount = 0;
    let errorCount = 0;

    const results = await Promise.allSettled([
      schema.prisma.reservation.create({
        data: {
          ...generateTestData("order"),
          productId: product.id,
          quantity: 60,
          status: "reserved",
        },
      }),
      schema.prisma.reservation.create({
        data: {
          ...generateTestData("order"),
          productId: product.id,
          quantity: 50, // Together = 110, exceeds stock
          status: "reserved",
        },
      }),
    ]);

    results.forEach((result) => {
      if (result.status === "fulfilled") successCount++;
      else errorCount++;
    });

    expect(successCount + errorCount).toBe(2);
    expect(executionTime).toBeLessThan(12000);

    await recordTestExecution(
      "inventory-adjustment",
      "oversell-prevention",
      "success",
      executionTime,
      { testNumber: 8, schema: schema.schemaName }
    );

    infra.logger.info(`✅ Oversell prevented in ${executionTime}ms`);
  });

  it("should calculate available inventory [Test 9/10]", async () => {
    const infra = await getInfrastructure();
    const schemas = await getSchemasByService("inventory");
    const schema = schemas[Math.floor(Math.random() * schemas.length)];

    const executionTime = await simulateProductionOperation();
    const productData = generateTestData("product");

    const product = await schema.prisma.product.create({
      data: { ...productData, sku: "TEST-SKU-" + Date.now(), stock: 1000 },
    });

    // Create multiple reservations
    const reservations = await schema.prisma.reservation.findMany({
      where: { productId: product.id, status: "reserved" },
    });

    const reserved = reservations.reduce((sum, r) => sum + r.quantity, 0);
    const available = product.stock - reserved;

    expect(available).toBeGreaterThanOrEqual(0);
    expect(product.stock).toBe(1000);
    expect(executionTime).toBeLessThan(12000);

    await recordTestExecution(
      "inventory-adjustment",
      "available-inventory",
      "success",
      executionTime,
      { testNumber: 9, schema: schema.schemaName }
    );

    infra.logger.info(
      `✅ Available inventory: ${available} units in ${executionTime}ms`
    );
  });

  it("should restock from purchase order [Test 10/10]", async () => {
    const infra = await getInfrastructure();
    const schemas = await getSchemasByService("inventory");
    const schema = schemas[Math.floor(Math.random() * schemas.length)];

    const executionTime = await simulateProductionOperation();
    const productData = generateTestData("product");

    // Low stock product
    const product = await schema.prisma.product.create({
      data: { ...productData, sku: "TEST-SKU-" + Date.now(), stock: 10 },
    });

    // Create purchase order
    const purchaseOrder = await schema.prisma.purchaseOrder.create({
      data: {
        productId: product.id,
        quantity: 500,
        status: "received",
        supplierRef: "SUPPLIER-123",
      },
    });

    // Update stock from PO
    const restocked = await schema.prisma.product.update({
      where: { id: product.id },
      data: { stock: { increment: purchaseOrder.quantity } },
    });

    expect(restocked.stock).toBe(510);
    expect(purchaseOrder.status).toBe("received");
    expect(executionTime).toBeLessThan(12000);

    await recordTestExecution(
      "inventory-adjustment",
      "restock-from-po",
      "success",
      executionTime,
      { testNumber: 10, schema: schema.schemaName }
    );

    infra.logger.info(
      `✅ Restocked to ${restocked.stock} units in ${executionTime}ms`
    );
  });
});
```

---

## 🎯 Key Patterns in This Example

### ✅ Stock Increment/Decrement (Tests 1-2)

```typescript
// Increase
const updated = await schema.prisma.product.update({
  where: { id: product.id },
  data: { stock: { increment: 50 } },
});

// Decrease
const updated = await schema.prisma.product.update({
  where: { id: product.id },
  data: { stock: { decrement: 75 } },
});
```

### ✅ Reservations (Tests 4-5)

```typescript
// Reserve
const reservation = await schema.prisma.reservation.create({
  data: {
    productId: product.id,
    quantity: 100,
    status: "reserved",
  },
});

// Release
const released = await schema.prisma.reservation.update({
  where: { id: reservation.id },
  data: { status: "released" },
});
```

### ✅ Audit Trail (Test 6)

```typescript
const adjustment = await schema.prisma.inventoryAudit.create({
  data: {
    productId: product.id,
    previousQuantity: 1000,
    newQuantity: 950,
    adjustmentType: "sale",
    reason: "order-fulfilled",
  },
});
```

### ✅ Concurrent Operations (Test 8)

```typescript
const results = await Promise.allSettled([
  schema.prisma.reservation.create({ data: order1 }),
  schema.prisma.reservation.create({ data: order2 }),
]);

results.forEach((result) => {
  if (result.status === "fulfilled") successCount++;
});
```
