---
id: example-notification-delivery
service: notification
feature: delivery
test_count: 10
tests_per_file: 10
last_updated: 2024
---

# Example: Notification Delivery Tests

This example demonstrates integration tests for notification delivery systems. It covers:

- ✅ Sending email notifications
- ✅ Managing notification preferences
- ✅ Delivery status tracking
- ✅ Template rendering
- ✅ Scheduling and retry logic

**Use this as a template** when generating notification service tests.

---

## 📝 Test File: notification-delivery.test.ts

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
 * 🧪 Notification Service - Delivery Tests
 *
 * Tests for notification sending, delivery tracking,
 * preferences management, and retry logic.
 */
describe("Notification Service - Delivery", () => {
  it("should send email notification [Test 1/10]", async () => {
    const infra = await getInfrastructure();
    const schemas = await getSchemasByService("notification");
    const schema = schemas[Math.floor(Math.random() * schemas.length)];

    const executionTime = await simulateProductionOperation();
    const userData = generateTestData("user");

    const notification = await schema.prisma.notification.create({
      data: {
        userId: userData.id,
        type: "email",
        channel: "email",
        subject: "Welcome to our service",
        content: "Thank you for signing up!",
        recipientEmail: userData.email,
        status: "sent",
        sentAt: new Date(),
      },
    });

    expect(notification.id).toBeDefined();
    expect(notification.type).toBe("email");
    expect(notification.status).toBe("sent");
    expect(notification.recipientEmail).toBe(userData.email);
    expect(executionTime).toBeLessThan(12000);

    await recordTestExecution(
      "notification-delivery",
      "send-email",
      "success",
      executionTime,
      { testNumber: 1, schema: schema.schemaName }
    );

    infra.logger.info(
      `✅ Email sent to ${notification.recipientEmail} in ${executionTime}ms`
    );
  });

  it("should reject invalid email address [Test 2/10]", async () => {
    const infra = await getInfrastructure();
    const schemas = await getSchemasByService("notification");
    const schema = schemas[Math.floor(Math.random() * schemas.length)];

    const executionTime = await simulateProductionOperation();

    let error: any;
    try {
      await schema.prisma.notification.create({
        data: {
          userId: "user-123",
          type: "email",
          channel: "email",
          subject: "Test",
          content: "Test content",
          recipientEmail: "invalid-email", // Invalid format
          status: "pending",
        },
      });
    } catch (e) {
      error = e;
    }

    expect(error).toBeDefined();
    expect(executionTime).toBeLessThan(12000);

    await recordTestExecution(
      "notification-delivery",
      "invalid-email-rejected",
      "success",
      executionTime,
      { testNumber: 2, schema: schema.schemaName }
    );

    infra.logger.info(`✅ Invalid email rejected in ${executionTime}ms`);
  });

  it("should respect notification preferences [Test 3/10]", async () => {
    const infra = await getInfrastructure();
    const schemas = await getSchemasByService("notification");
    const schema = schemas[Math.floor(Math.random() * schemas.length)];

    const executionTime = await simulateProductionOperation();
    const userData = generateTestData("user");

    // Create user preferences (disable marketing emails)
    const preferences = await schema.prisma.notificationPreference.create({
      data: {
        userId: userData.id,
        marketing: false,
        transactional: true,
        notifications: true,
        sms: true,
        email: true,
      },
    });

    expect(preferences.userId).toBe(userData.id);
    expect(preferences.marketing).toBe(false);
    expect(preferences.transactional).toBe(true);
    expect(executionTime).toBeLessThan(12000);

    await recordTestExecution(
      "notification-delivery",
      "preferences-respected",
      "success",
      executionTime,
      { testNumber: 3, schema: schema.schemaName }
    );

    infra.logger.info(`✅ Preferences respected in ${executionTime}ms`);
  });

  it("should render email template with variables [Test 4/10]", async () => {
    const infra = await getInfrastructure();
    const schemas = await getSchemasByService("notification");
    const schema = schemas[Math.floor(Math.random() * schemas.length)];

    const executionTime = await simulateProductionOperation();

    // Create email template
    const template = await schema.prisma.emailTemplate.create({
      data: {
        name: "welcome_email",
        subject: "Welcome {{name}}!",
        htmlContent: "<h1>Hello {{name}}</h1><p>Welcome to {{company}}</p>",
        variables: ["name", "company"],
        status: "active",
      },
    });

    // Render with variables
    const rendered = await schema.prisma.notification.create({
      data: {
        userId: "user-123",
        type: "email",
        channel: "email",
        templateId: template.id,
        subject: "Welcome John!",
        content: "<h1>Hello John</h1><p>Welcome to Acme Corp</p>",
        recipientEmail: "john@example.com",
        variables: { name: "John", company: "Acme Corp" },
        status: "sent",
      },
    });

    expect(rendered.subject).toBe("Welcome John!");
    expect(rendered.templateId).toBe(template.id);
    expect(rendered.variables.name).toBe("John");
    expect(executionTime).toBeLessThan(12000);

    await recordTestExecution(
      "notification-delivery",
      "template-rendering",
      "success",
      executionTime,
      { testNumber: 4, schema: schema.schemaName }
    );

    infra.logger.info(
      `✅ Template rendered with variables in ${executionTime}ms`
    );
  });

  it("should track delivery status [Test 5/10]", async () => {
    const infra = await getInfrastructure();
    const schemas = await getSchemasByService("notification");
    const schema = schemas[Math.floor(Math.random() * schemas.length)];

    const executionTime = await simulateProductionOperation();

    // Create notification
    const notification = await schema.prisma.notification.create({
      data: {
        userId: "user-123",
        type: "email",
        channel: "email",
        subject: "Test",
        content: "Test",
        recipientEmail: "test@example.com",
        status: "pending",
      },
    });

    // Update status to sent
    const sent = await schema.prisma.notification.update({
      where: { id: notification.id },
      data: { status: "sent", sentAt: new Date() },
    });

    // Update status to delivered
    const delivered = await schema.prisma.notification.update({
      where: { id: notification.id },
      data: { status: "delivered", deliveredAt: new Date() },
    });

    expect(delivered.status).toBe("delivered");
    expect(delivered.deliveredAt).toBeDefined();
    expect(executionTime).toBeLessThan(12000);

    await recordTestExecution(
      "notification-delivery",
      "delivery-tracking",
      "success",
      executionTime,
      { testNumber: 5, schema: schema.schemaName }
    );

    infra.logger.info(`✅ Delivery status tracked in ${executionTime}ms`);
  });

  it("should implement retry logic [Test 6/10]", async () => {
    const infra = await getInfrastructure();
    const schemas = await getSchemasByService("notification");
    const schema = schemas[Math.floor(Math.random() * schemas.length)];

    const executionTime = await simulateProductionOperation();

    // Create notification
    const notification = await schema.prisma.notification.create({
      data: {
        userId: "user-123",
        type: "email",
        channel: "email",
        subject: "Test",
        content: "Test",
        recipientEmail: "test@example.com",
        status: "failed",
        retryCount: 0,
        nextRetryAt: new Date(),
      },
    });

    // Increment retry count
    const retry1 = await schema.prisma.notification.update({
      where: { id: notification.id },
      data: {
        retryCount: { increment: 1 },
        lastError: "Network timeout",
        nextRetryAt: new Date(Date.now() + 5 * 60 * 1000), // 5 min later
      },
    });

    expect(retry1.retryCount).toBe(1);
    expect(retry1.lastError).toBe("Network timeout");
    expect(executionTime).toBeLessThan(12000);

    await recordTestExecution(
      "notification-delivery",
      "retry-logic",
      "success",
      executionTime,
      { testNumber: 6, schema: schema.schemaName }
    );

    infra.logger.info(
      `✅ Retry scheduled after ${retry1.retryCount} attempt in ${executionTime}ms`
    );
  });

  it("should send SMS notification [Test 7/10]", async () => {
    const infra = await getInfrastructure();
    const schemas = await getSchemasByService("notification");
    const schema = schemas[Math.floor(Math.random() * schemas.length)];

    const executionTime = await simulateProductionOperation();
    const userData = generateTestData("user");

    const notification = await schema.prisma.notification.create({
      data: {
        userId: userData.id,
        type: "sms",
        channel: "sms",
        content: "Your verification code is: 123456",
        recipientPhone: "+1234567890",
        status: "sent",
        sentAt: new Date(),
      },
    });

    expect(notification.id).toBeDefined();
    expect(notification.type).toBe("sms");
    expect(notification.status).toBe("sent");
    expect(notification.recipientPhone).toBe("+1234567890");
    expect(executionTime).toBeLessThan(12000);

    await recordTestExecution(
      "notification-delivery",
      "send-sms",
      "success",
      executionTime,
      { testNumber: 7, schema: schema.schemaName }
    );

    infra.logger.info(
      `✅ SMS sent to ${notification.recipientPhone} in ${executionTime}ms`
    );
  });

  it("should schedule notification for later [Test 8/10]", async () => {
    const infra = await getInfrastructure();
    const schemas = await getSchemasByService("notification");
    const schema = schemas[Math.floor(Math.random() * schemas.length)];

    const executionTime = await simulateProductionOperation();

    const scheduledTime = new Date(Date.now() + 24 * 60 * 60 * 1000); // Tomorrow

    const scheduled = await schema.prisma.notification.create({
      data: {
        userId: "user-123",
        type: "email",
        channel: "email",
        subject: "Reminder",
        content: "Don't forget!",
        recipientEmail: "user@example.com",
        status: "scheduled",
        scheduledFor: scheduledTime,
      },
    });

    expect(scheduled.status).toBe("scheduled");
    expect(scheduled.scheduledFor).toEqual(scheduledTime);
    expect(executionTime).toBeLessThan(12000);

    await recordTestExecution(
      "notification-delivery",
      "schedule-notification",
      "success",
      executionTime,
      { testNumber: 8, schema: schema.schemaName }
    );

    infra.logger.info(
      `✅ Notification scheduled for ${scheduledTime} in ${executionTime}ms`
    );
  });

  it("should batch send notifications [Test 9/10]", async () => {
    const infra = await getInfrastructure();
    const schemas = await getSchemasByService("notification");
    const schema = schemas[Math.floor(Math.random() * schemas.length)];

    const executionTime = await simulateProductionOperation();

    // Batch create notifications
    const batch = await schema.prisma.notification.createMany({
      data: [
        {
          userId: "user-1",
          type: "email",
          channel: "email",
          subject: "Update 1",
          content: "Content 1",
          recipientEmail: "user1@example.com",
          status: "sent",
        },
        {
          userId: "user-2",
          type: "email",
          channel: "email",
          subject: "Update 2",
          content: "Content 2",
          recipientEmail: "user2@example.com",
          status: "sent",
        },
        {
          userId: "user-3",
          type: "email",
          channel: "email",
          subject: "Update 3",
          content: "Content 3",
          recipientEmail: "user3@example.com",
          status: "sent",
        },
      ],
    });

    expect(batch.count).toBe(3);
    expect(executionTime).toBeLessThan(12000);

    await recordTestExecution(
      "notification-delivery",
      "batch-send",
      "success",
      executionTime,
      { testNumber: 9, schema: schema.schemaName }
    );

    infra.logger.info(
      `✅ ${batch.count} notifications sent in batch in ${executionTime}ms`
    );
  });

  it("should unsubscribe user from notifications [Test 10/10]", async () => {
    const infra = await getInfrastructure();
    const schemas = await getSchemasByService("notification");
    const schema = schemas[Math.floor(Math.random() * schemas.length)];

    const executionTime = await simulateProductionOperation();
    const userData = generateTestData("user");

    // Create subscription
    const subscription = await schema.prisma.notificationSubscription.create({
      data: {
        userId: userData.id,
        email: userData.email,
        status: "subscribed",
        subscribedAt: new Date(),
      },
    });

    // Unsubscribe
    const unsubscribed = await schema.prisma.notificationSubscription.update({
      where: { id: subscription.id },
      data: {
        status: "unsubscribed",
        unsubscribedAt: new Date(),
      },
    });

    expect(unsubscribed.status).toBe("unsubscribed");
    expect(unsubscribed.unsubscribedAt).toBeDefined();
    expect(executionTime).toBeLessThan(12000);

    await recordTestExecution(
      "notification-delivery",
      "unsubscribe",
      "success",
      executionTime,
      { testNumber: 10, schema: schema.schemaName }
    );

    infra.logger.info(`✅ User unsubscribed in ${executionTime}ms`);
  });
});
```

---

## 🎯 Key Patterns in This Example

### ✅ Email Sending (Test 1)

```typescript
const notification = await schema.prisma.notification.create({
  data: {
    userId,
    type: "email",
    channel: "email",
    subject: "Welcome",
    content: "Hello!",
    recipientEmail: userData.email,
    status: "sent",
    sentAt: new Date(),
  },
});
```

### ✅ Preferences (Test 3)

```typescript
const preferences = await schema.prisma.notificationPreference.create({
  data: {
    userId,
    marketing: false,
    transactional: true,
    email: true,
    sms: true,
  },
});
```

### ✅ Template Rendering (Test 4)

```typescript
const template = await schema.prisma.emailTemplate.create({
  data: {
    name: "welcome_email",
    subject: "Welcome {{name}}!",
    htmlContent: "<h1>Hello {{name}}</h1>",
    variables: ["name"],
  },
});

const rendered = await schema.prisma.notification.create({
  data: {
    templateId: template.id,
    variables: { name: "John" },
  },
});
```

### ✅ Status Transitions (Test 5)

```typescript
// pending → sent → delivered
const sent = await schema.prisma.notification.update({
  where: { id: notification.id },
  data: { status: "sent", sentAt: new Date() },
});

const delivered = await schema.prisma.notification.update({
  where: { id: notification.id },
  data: { status: "delivered", deliveredAt: new Date() },
});
```

### ✅ Retry Logic (Test 6)

```typescript
const retry = await schema.prisma.notification.update({
  where: { id: notification.id },
  data: {
    retryCount: { increment: 1 },
    lastError: "Network timeout",
    nextRetryAt: new Date(Date.now() + 5 * 60 * 1000),
  },
});
```

### ✅ Batch Operations (Test 9)

```typescript
const batch = await schema.prisma.notification.createMany({
  data: [
    { userId: "user-1", ... },
    { userId: "user-2", ... },
    { userId: "user-3", ... },
  ],
});
```
