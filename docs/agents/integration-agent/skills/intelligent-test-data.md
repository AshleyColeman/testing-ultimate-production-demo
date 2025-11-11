---
name: intelligent-test-data-generation
description: >
  Generate conflict-free, realistic test data with uniqueness guarantees across all tests.
  Avoids duplicate emails, IDs, and other constraint violations that cause test failures.
  Use when: Before creating any test records to ensure data uniqueness and validity.
---

# Generate Intelligent Test Data

**PURPOSE**: Generate conflict-free, realistic test data with guaranteed uniqueness across all test runs.

## When to use

- **Triggers**: "generate unique data", "avoid conflicts", "smart data factory", "conflict-free data"
- **Input**: Data type (user, session, transaction, etc.), uniqueness constraints, scope
- **Output**: Realistic test data with guaranteed uniqueness
- **Not for**: Hardcoding test values (use intelligent generation instead)
- **Required**: Before any database insert operations

## Quick start

1. Import: `import { generateSmartTestData } from "../shared/testHelpers"`
2. Call: `const userData = await generateSmartTestData("user", { scope: 'test-file' })`
3. Use: Create database records with conflict-free data

## Workflow

- **Initialize**: Set up data tracker with global uniqueness scope
- **Generate**: Create realistic data with embedded uniqueness tokens
- **Track**: Record used values to prevent conflicts
- **Validate**: Ensure generated data meets all constraints
- **Cache**: Store generated data for potential reuse

## File & tool use

- Read: Service constraints and field requirements
- Run: Data generation algorithms with uniqueness guarantees
- Import: `import { generateSmartTestData } from "../shared/testHelpers"`

## Guardrails

- Always track generated values globally to prevent conflicts
- Use timestamps and random strings for uniqueness
- Respect database constraints (unique keys, foreign keys)
- Never reuse the same generated value across tests
- Generate data that matches detected service patterns

## Examples

**Example A**: Generate unique user data

```typescript
const userData = await generateSmartTestData("user", {
  scope: 'global',
  constraints: ['email_unique', 'id_unique']
});

// Returns:
{
  id: "usr_1734039456789_abc123def",
  email: "alice.johnson_1734039456789@example.com",
  name: "alice.johnson",
  passwordHash: "$2b$10$randomhashvaluehere",
  role: "user",
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date()
}
```

**Example B**: Generate multiple unique users

```typescript
const users = [];
for (let i = 0; i < 5; i++) {
  const user = await generateSmartTestData("user", {
    scope: 'test-file',
    index: i
  });
  users.push(user);
}

// All users have unique emails, IDs, and other fields
// No constraint violations when inserted into database
```

**Example C**: Generate data with specific constraints

```typescript
const orderData = await generateSmartTestData("order", {
  scope: 'test-suite',
  constraints: {
    orderId: 'unique',
    userEmail: 'must_exist_in_users',
    amount: 'positive_decimal'
  },
  references: {
    userEmail: 'existing_user_email_from_db'
  }
});
```

---

## Data Generation Algorithms

### Uniqueness Tracking

```typescript
class TestDataTracker {
  private usedValues = new Map<string, Set<string>>();
  private globalScope = 'global';

  // Track a value to prevent reuse
  trackValue(field: string, value: string, scope: string = this.globalScope): void {
    if (!this.usedValues.has(field)) {
      this.usedValues.set(field, new Set());
    }
    this.usedValues.get(field)!.add(value);
  }

  // Check if value is already used
  isValueUsed(field: string, value: string, scope: string = this.globalScope): boolean {
    return this.usedValues.get(field)?.has(value) || false;
  }

  // Generate guaranteed unique value
  generateUnique(field: string, prefix: string, scope: string = this.globalScope): string {
    let attempts = 0;
    let value;

    do {
      const timestamp = Date.now();
      const random = Math.random().toString(36).substr(2, 9);
      value = `${prefix}_${timestamp}_${random}`;
      attempts++;

      if (attempts > 100) {
        throw new Error(`Cannot generate unique value for field: ${field}`);
      }
    } while (this.isValueUsed(field, value, scope));

    this.trackValue(field, value, scope);
    return value;
  }
}
```

### Smart Email Generation

```typescript
function generateUniqueEmail(tracker: TestDataTracker, name?: string): string {
  const baseName = name || generateRandomName();
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substr(2, 4);

  let email = `${baseName}_${timestamp}_${randomSuffix}@test.com`;

  // Ensure uniqueness
  if (tracker.isValueUsed('email', email)) {
    email = tracker.generateUnique('email', baseName);
  }

  tracker.trackValue('email', email);
  return email;
}

function generateRandomName(): string {
  const firstNames = ['alice', 'bob', 'charlie', 'diana', 'eve', 'frank', 'grace', 'henry'];
  const lastNames = ['smith', 'johnson', 'williams', 'brown', 'jones', 'garcia', 'miller', 'davis'];

  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];

  return `${firstName}.${lastName}`;
}
```

### ID Generation with Patterns

```typescript
function generateUniqueId(tracker: TestDataTracker, prefix: string, pattern?: string): string {
  switch (pattern) {
    case 'user':
      return tracker.generateUnique('userId', `usr`);
    case 'order':
      return tracker.generateUnique('orderId', `order`);
    case 'session':
      return tracker.generateUnique('sessionId', `sess`);
    case 'transaction':
      return tracker.generateUnique('transactionId', `txn`);
    default:
      return tracker.generateUnique('id', prefix);
  }
}
```

### Conflict-Free Bulk Generation

```typescript
async function generateBulkTestData<T>(
  type: string,
  count: number,
  constraints?: DataConstraints
): Promise<T[]> {
  const data: T[] = [];
  const tracker = new TestDataTracker();

  for (let i = 0; i < count; i++) {
    try {
      const item = await generateSmartTestData(type, {
        ...constraints,
        tracker,
        index: i,
        bulkGeneration: true
      });
      data.push(item);
    } catch (error) {
      // Handle generation errors gracefully
      console.warn(`Failed to generate item ${i} of type ${type}:`, error);
    }
  }

  return data;
}
```

---

## Enhanced Data Types

### User Data (Enhanced)

```typescript
function generateUserData(options: DataGenerationOptions = {}): User {
  const { tracker = new TestDataTracker(), constraints = [] } = options;

  const name = generateRandomName();
  const email = generateUniqueEmail(tracker, name);
  const id = generateUniqueId(tracker, 'usr', 'user');

  return {
    id,
    email,
    name: name.replace('.', ' '), // Convert alice.johnson -> alice johnson
    passwordHash: generatePasswordHash(),
    role: constraints.includes('admin_only') ? 'admin' : 'user',
    isActive: Math.random() > 0.1, // 90% active, 10% inactive
    createdAt: new Date(),
    updatedAt: new Date(),
    preferences: JSON.stringify({
      theme: 'light',
      notifications: true,
      language: 'en'
    })
  };
}
```

### Session Data (Enhanced)

```typescript
function generateSessionData(userId: string, options: DataGenerationOptions = {}): Session {
  const { tracker = new TestDataTracker() } = options;

  return {
    id: generateUniqueId(tracker, 'sess', 'session'),
    token: generateSecureToken(),
    userId,
    expiresAt: new Date(Date.now() + (24 * 60 * 60 * 1000)), // 24 hours
    userAgent: generateRandomUserAgent(),
    ipAddress: generateRandomIP(),
    isActive: true,
    createdAt: new Date()
  };
}
```

### Order Data (Enhanced)

```typescript
function generateOrderData(userId: string, options: DataGenerationOptions = {}): Order {
  const { tracker = new TestDataTracker() } = options;

  return {
    id: generateUniqueId(tracker, 'order', 'order'),
    userId,
    orderNumber: tracker.generateUnique('orderNumber', 'ORD'),
    status: randomChoice(['pending', 'processing', 'shipped', 'delivered', 'cancelled']),
    total: generateRandomAmount(10, 1000),
    currency: 'USD',
    items: generateOrderItems(),
    shippingAddress: generateRandomAddress(),
    billingAddress: generateRandomAddress(),
    createdAt: new Date(),
    updatedAt: new Date()
  };
}
```

---

## Complete Example: UserService with Smart Data

```typescript
import { generateSmartTestData } from "../shared/testHelpers";

describe("UserService with Smart Data Generation", () => {
  it("creates multiple users without conflicts [Test 1/10]", async () => {
    const infra = await getInfrastructure();
    const schemas = await getSchemasByService("auth");
    const schema = schemas[Math.floor(Math.random() * schemas.length)];
    const executionTime = await simulateProductionOperation();

    // Create users table for this schema
    await createUsersTable(schema);

    // Generate multiple unique users
    const users = [];
    for (let i = 0; i < 5; i++) {
      const userData = await generateSmartTestData("user", {
        scope: 'test-file',
        index: i,
        constraints: ['email_unique', 'id_unique']
      });

      // Insert user using detected method (raw SQL for UserService)
      const result = await schema.prisma.$queryRawUnsafe(`
        INSERT INTO "${schema.schemaName}".users
        (id, email, name, "isActive", "createdAt", "updatedAt", role, passwordHash)
        VALUES (
          '${userData.id}',
          '${userData.email}',
          '${userData.name}',
          ${userData.isActive},
          NOW(),
          NOW(),
          '${userData.role}',
          '${userData.passwordHash}'
        )
        RETURNING *
      `);

      users.push(result[0]);
    }

    // Verify all users were created successfully
    expect(users).toHaveLength(5);

    // Verify all emails are unique
    const emails = users.map(u => u.email);
    const uniqueEmails = new Set(emails);
    expect(uniqueEmails.size).toBe(5);

    // Verify all IDs are unique
    const ids = users.map(u => u.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(5);

    await recordTestExecution(
      "user-crud-smart",
      "create-multiple-unique",
      "success",
      executionTime,
      {
        testNumber: 1,
        schema: schema.schemaName,
        userCount: 5,
        conflictFree: true
      }
    );
  });

  it("handles bulk operations with smart data [Test 2/10]", async () => {
    const infra = await getInfrastructure();
    const schemas = await getSchemasByService("auth");
    const schema = schemas[Math.floor(Math.random() * schemas.length)];
    const executionTime = await simulateProductionOperation();

    // Create users table
    await createUsersTable(schema);

    // Generate bulk user data
    const bulkUsers = await generateBulkTestData("user", 10, {
      scope: 'test-suite',
      constraints: ['email_unique', 'id_unique']
    });

    // Insert all users in single query
    const values = bulkUsers.map(user =>
      `('${user.id}', '${user.email}', '${user.name}', ${user.isActive}, NOW(), NOW(), '${user.role}', '${user.passwordHash}')`
    ).join(', ');

    const result = await schema.prisma.$queryRawUnsafe(`
      INSERT INTO "${schema.schemaName}".users
      (id, email, name, "isActive", "createdAt", "updatedAt", role, passwordHash)
      VALUES ${values}
      RETURNING *
    `);

    expect(result).toHaveLength(10);

    await recordTestExecution(
      "user-crud-smart",
      "bulk-insert-unique",
      "success",
      executionTime,
      {
        testNumber: 2,
        schema: schema.schemaName,
        insertCount: 10,
        conflictFree: true
      }
    );
  });
});
```

---

## Troubleshooting

### ❌ "Duplicate constraint violation"

**Solutions**:
- Ensure data tracker is properly initialized
- Check that scope is set correctly (file vs suite vs global)
- Verify uniqueness constraints are properly specified
- Increase randomness in generation algorithms

### ❌ "Generation timeout"

**Solutions**:
- Too many uniqueness constraints
- Exhausted randomness pool
- Reduce batch size for bulk generation
- Simplify data requirements

### ❌ "Invalid data format"

**Solutions**:
- Check data type specifications
- Verify constraints match database schema
- Ensure generated data meets validation rules
- Update data generation patterns

---

## Key Points

1. **Global tracking** - Prevent conflicts across all test files
2. **Embedded uniqueness** - Use timestamps and randomness in values
3. **Constraint awareness** - Respect database unique constraints
4. **Pattern matching** - Generate data appropriate for service patterns
5. **Bulk safety** - Handle large data generation without conflicts
6. **Performance optimized** - Efficient tracking and generation algorithms

---

**Next**: Use `database-operations.md` to perform CRUD operations with the generated conflict-free data.