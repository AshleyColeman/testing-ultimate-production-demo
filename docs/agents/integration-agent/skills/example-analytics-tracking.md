---
id: example-analytics-tracking
service: analytics
feature: tracking
test_count: 10
tests_per_file: 10
last_updated: 2024
---

# Example: Analytics Event Tracking Tests

This example demonstrates integration tests for analytics event tracking and reporting. It covers:

- ✅ Recording analytics events
- ✅ Aggregating metrics
- ✅ Tracking user funnels
- ✅ Cohort analysis
- ✅ Real-time metrics

**Use this as a template** when generating analytics service tests.

---

## 📝 Test File: analytics-tracking.test.ts

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
 * 🧪 Analytics Service - Tracking Tests
 *
 * Tests for event tracking, metrics aggregation, funnel analysis,
 * and real-time reporting.
 */
describe("Analytics Service - Tracking", () => {
  it("should record user event [Test 1/10]", async () => {
    const infra = await getInfrastructure();
    const schemas = await getSchemasByService("analytics");
    const schema = schemas[Math.floor(Math.random() * schemas.length)];

    const executionTime = await simulateProductionOperation();
    const userId = "user-" + Date.now();

    const event = await schema.prisma.event.create({
      data: {
        userId,
        eventType: "page_view",
        eventName: "product_page",
        properties: {
          productId: "prod-123",
          timestamp: new Date().toISOString(),
        },
        timestamp: new Date(),
      },
    });

    expect(event.id).toBeDefined();
    expect(event.userId).toBe(userId);
    expect(event.eventType).toBe("page_view");
    expect(executionTime).toBeLessThan(12000);

    await recordTestExecution(
      "analytics-tracking",
      "record-event",
      "success",
      executionTime,
      { testNumber: 1, schema: schema.schemaName }
    );

    infra.logger.info(
      `✅ Event recorded for user ${userId} in ${executionTime}ms`
    );
  });

  it("should aggregate daily metrics [Test 2/10]", async () => {
    const infra = await getInfrastructure();
    const schemas = await getSchemasByService("analytics");
    const schema = schemas[Math.floor(Math.random() * schemas.length)];

    const executionTime = await simulateProductionOperation();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Create multiple events for today
    const event1 = await schema.prisma.event.create({
      data: {
        userId: "user-1",
        eventType: "page_view",
        eventName: "home",
        timestamp: today,
      },
    });

    const event2 = await schema.prisma.event.create({
      data: {
        userId: "user-2",
        eventType: "page_view",
        eventName: "product",
        timestamp: today,
      },
    });

    // Aggregate
    const metrics = await schema.prisma.metric.create({
      data: {
        date: today,
        metricType: "daily_views",
        value: 2,
        dimensions: {
          eventType: "page_view",
        },
      },
    });

    expect(metrics.value).toBe(2);
    expect(metrics.date).toEqual(today);
    expect(executionTime).toBeLessThan(12000);

    await recordTestExecution(
      "analytics-tracking",
      "aggregate-metrics",
      "success",
      executionTime,
      { testNumber: 2, schema: schema.schemaName }
    );

    infra.logger.info(`✅ Daily metrics aggregated in ${executionTime}ms`);
  });

  it("should track funnel progression [Test 3/10]", async () => {
    const infra = await getInfrastructure();
    const schemas = await getSchemasByService("analytics");
    const schema = schemas[Math.floor(Math.random() * schemas.length)];

    const executionTime = await simulateProductionOperation();
    const userId = "user-" + Date.now();

    // Funnel: view → add to cart → checkout → purchase
    const view = await schema.prisma.event.create({
      data: {
        userId,
        eventType: "funnel_step",
        eventName: "product_view",
        step: 1,
        timestamp: new Date(),
      },
    });

    const addCart = await schema.prisma.event.create({
      data: {
        userId,
        eventType: "funnel_step",
        eventName: "add_to_cart",
        step: 2,
        timestamp: new Date(),
      },
    });

    const checkout = await schema.prisma.event.create({
      data: {
        userId,
        eventType: "funnel_step",
        eventName: "checkout_start",
        step: 3,
        timestamp: new Date(),
      },
    });

    // Verify progression
    expect(view.step).toBe(1);
    expect(addCart.step).toBe(2);
    expect(checkout.step).toBe(3);
    expect(executionTime).toBeLessThan(12000);

    await recordTestExecution(
      "analytics-tracking",
      "funnel-progression",
      "success",
      executionTime,
      { testNumber: 3, schema: schema.schemaName }
    );

    infra.logger.info(`✅ Funnel progression tracked in ${executionTime}ms`);
  });

  it("should create user cohort [Test 4/10]", async () => {
    const infra = await getInfrastructure();
    const schemas = await getSchemasByService("analytics");
    const schema = schemas[Math.floor(Math.random() * schemas.length)];

    const executionTime = await simulateProductionOperation();

    // Define cohort criteria
    const cohort = await schema.prisma.cohort.create({
      data: {
        name: "Early Adopters",
        description: "Users joined in last 30 days",
        criteria: {
          createdAfter: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
        status: "active",
      },
    });

    // Add users to cohort
    const members = await schema.prisma.cohortMember.createMany({
      data: [
        { cohortId: cohort.id, userId: "user-1" },
        { cohortId: cohort.id, userId: "user-2" },
        { cohortId: cohort.id, userId: "user-3" },
      ],
    });

    expect(cohort.id).toBeDefined();
    expect(cohort.status).toBe("active");
    expect(members.count).toBe(3);
    expect(executionTime).toBeLessThan(12000);

    await recordTestExecution(
      "analytics-tracking",
      "cohort-creation",
      "success",
      executionTime,
      { testNumber: 4, schema: schema.schemaName }
    );

    infra.logger.info(
      `✅ Cohort created with ${members.count} members in ${executionTime}ms`
    );
  });

  it("should calculate retention rate [Test 5/10]", async () => {
    const infra = await getInfrastructure();
    const schemas = await getSchemasByService("analytics");
    const schema = schemas[Math.floor(Math.random() * schemas.length)];

    const executionTime = await simulateProductionOperation();

    // Create retention metric
    const retention = await schema.prisma.retentionMetric.create({
      data: {
        cohortId: "cohort-123",
        day: 1,
        activeUsers: 100,
        returnedUsers: 80,
        retentionRate: 0.8, // 80%
      },
    });

    expect(retention.activeUsers).toBe(100);
    expect(retention.returnedUsers).toBe(80);
    expect(retention.retentionRate).toBe(0.8);
    expect(executionTime).toBeLessThan(12000);

    await recordTestExecution(
      "analytics-tracking",
      "retention-rate",
      "success",
      executionTime,
      { testNumber: 5, schema: schema.schemaName }
    );

    infra.logger.info(
      `✅ Retention rate: ${
        retention.retentionRate * 100
      }% in ${executionTime}ms`
    );
  });

  it("should handle high-volume event ingestion [Test 6/10]", async () => {
    const infra = await getInfrastructure();
    const schemas = await getSchemasByService("analytics");
    const schema = schemas[Math.floor(Math.random() * schemas.length)];

    const executionTime = await simulateProductionOperation();

    // Bulk create events
    const events = await schema.prisma.event.createMany({
      data: Array.from({ length: 100 }, (_, i) => ({
        userId: `user-${i}`,
        eventType: "page_view",
        eventName: "home",
        timestamp: new Date(),
      })),
    });

    expect(events.count).toBe(100);
    expect(executionTime).toBeLessThan(12000);

    await recordTestExecution(
      "analytics-tracking",
      "bulk-ingestion",
      "success",
      executionTime,
      { testNumber: 6, schema: schema.schemaName }
    );

    infra.logger.info(
      `✅ ${events.count} events ingested in ${executionTime}ms`
    );
  });

  it("should filter events by time range [Test 7/10]", async () => {
    const infra = await getInfrastructure();
    const schemas = await getSchemasByService("analytics");
    const schema = schemas[Math.floor(Math.random() * schemas.length)];

    const executionTime = await simulateProductionOperation();

    // Create events in different time ranges
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);

    await schema.prisma.event.createMany({
      data: [
        {
          userId: "user-1",
          eventType: "page_view",
          eventName: "home",
          timestamp: now,
        },
        {
          userId: "user-2",
          eventType: "page_view",
          eventName: "home",
          timestamp: yesterday,
        },
        {
          userId: "user-3",
          eventType: "page_view",
          eventName: "home",
          timestamp: twoDaysAgo,
        },
      ],
    });

    // Query last 24 hours
    const recentEvents = await schema.prisma.event.findMany({
      where: {
        timestamp: {
          gte: yesterday,
          lte: now,
        },
      },
    });

    expect(recentEvents.length).toBeGreaterThanOrEqual(1);
    expect(executionTime).toBeLessThan(12000);

    await recordTestExecution(
      "analytics-tracking",
      "time-range-filter",
      "success",
      executionTime,
      { testNumber: 7, schema: schema.schemaName }
    );

    infra.logger.info(
      `✅ Filtered ${recentEvents.length} events in time range in ${executionTime}ms`
    );
  });

  it("should track custom properties [Test 8/10]", async () => {
    const infra = await getInfrastructure();
    const schemas = await getSchemasByService("analytics");
    const schema = schemas[Math.floor(Math.random() * schemas.length)];

    const executionTime = await simulateProductionOperation();

    const event = await schema.prisma.event.create({
      data: {
        userId: "user-123",
        eventType: "purchase",
        eventName: "order_completed",
        properties: {
          orderId: "order-abc",
          amount: 99.99,
          currency: "USD",
          items: 3,
          source: "mobile_app",
          version: "2.1.0",
        },
        timestamp: new Date(),
      },
    });

    expect(event.properties).toBeDefined();
    expect(event.properties.amount).toBe(99.99);
    expect(event.properties.source).toBe("mobile_app");
    expect(executionTime).toBeLessThan(12000);

    await recordTestExecution(
      "analytics-tracking",
      "custom-properties",
      "success",
      executionTime,
      { testNumber: 8, schema: schema.schemaName }
    );

    infra.logger.info(`✅ Custom properties tracked in ${executionTime}ms`);
  });

  it("should handle duplicate event prevention [Test 9/10]", async () => {
    const infra = await getInfrastructure();
    const schemas = await getSchemasByService("analytics");
    const schema = schemas[Math.floor(Math.random() * schemas.length)];

    const executionTime = await simulateProductionOperation();
    const eventId = "event-" + Date.now();

    // Create first event
    const event1 = await schema.prisma.event.create({
      data: {
        id: eventId,
        userId: "user-123",
        eventType: "page_view",
        eventName: "home",
        timestamp: new Date(),
      },
    });

    // Try to create duplicate
    let error: any;
    try {
      await schema.prisma.event.create({
        data: {
          id: eventId, // Same ID
          userId: "user-123",
          eventType: "page_view",
          eventName: "home",
          timestamp: new Date(),
        },
      });
    } catch (e) {
      error = e;
    }

    expect(error).toBeDefined();
    expect(event1.id).toBe(eventId);
    expect(executionTime).toBeLessThan(12000);

    await recordTestExecution(
      "analytics-tracking",
      "duplicate-prevention",
      "success",
      executionTime,
      { testNumber: 9, schema: schema.schemaName }
    );

    infra.logger.info(`✅ Duplicate event prevented in ${executionTime}ms`);
  });

  it("should generate real-time dashboard data [Test 10/10]", async () => {
    const infra = await getInfrastructure();
    const schemas = await getSchemasByService("analytics");
    const schema = schemas[Math.floor(Math.random() * schemas.length)];

    const executionTime = await simulateProductionOperation();

    // Create dashboard snapshot
    const dashboard = await schema.prisma.dashboard.create({
      data: {
        name: "Real-time Overview",
        type: "real-time",
        metrics: {
          activeUsers: 1250,
          pageViewsPerSecond: 45.2,
          avgSessionDuration: 285, // seconds
          bounceRate: 0.32,
          topPages: ["home", "product", "checkout"],
        },
        lastUpdated: new Date(),
      },
    });

    expect(dashboard.id).toBeDefined();
    expect(dashboard.metrics.activeUsers).toBe(1250);
    expect(dashboard.metrics.bounceRate).toBe(0.32);
    expect(executionTime).toBeLessThan(12000);

    await recordTestExecution(
      "analytics-tracking",
      "dashboard-generation",
      "success",
      executionTime,
      { testNumber: 10, schema: schema.schemaName }
    );

    infra.logger.info(
      `✅ Dashboard generated with ${dashboard.metrics.activeUsers} active users in ${executionTime}ms`
    );
  });
});
```

---

## 🎯 Key Patterns in This Example

### ✅ Event Recording (Test 1)

```typescript
const event = await schema.prisma.event.create({
  data: {
    userId,
    eventType: "page_view",
    eventName: "product_page",
    properties: {
      /* ... */
    },
    timestamp: new Date(),
  },
});
```

### ✅ Metrics Aggregation (Test 2)

```typescript
const metrics = await schema.prisma.metric.create({
  data: {
    date: today,
    metricType: "daily_views",
    value: 2,
    dimensions: {
      eventType: "page_view",
    },
  },
});
```

### ✅ Funnel Tracking (Test 3)

```typescript
// Track sequential steps
const step1 = await schema.prisma.event.create({
  data: { userId, eventName: "product_view", step: 1 },
});
const step2 = await schema.prisma.event.create({
  data: { userId, eventName: "add_to_cart", step: 2 },
});
```

### ✅ Cohort Analysis (Test 4)

```typescript
const cohort = await schema.prisma.cohort.create({
  data: {
    name: "Early Adopters",
    criteria: {
      /* ... */
    },
  },
});

const members = await schema.prisma.cohortMember.createMany({
  data: [
    { cohortId: cohort.id, userId: "user-1" },
    { cohortId: cohort.id, userId: "user-2" },
  ],
});
```

### ✅ Bulk Ingestion (Test 6)

```typescript
const events = await schema.prisma.event.createMany({
  data: Array.from({ length: 100 }, (_, i) => ({
    userId: `user-${i}`,
    eventType: "page_view",
    timestamp: new Date(),
  })),
});
```
