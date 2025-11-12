# Skill 3: FOREIGN KEY ANALYSIS

## 📋 PURPOSE

Map all foreign key relationships, cascade behaviors, and data dependencies between tables.

**Goal**: Understand how tables are connected and what happens when data is created, updated, or deleted.

---

## 🎯 WHEN TO USE

- After database schema detection
- Before recommending test scenarios
- When analyzing delete/update operations
- When understanding data dependencies

---

## ⚡ QUICK START

```typescript
// Step 1: Identify all FK columns
const fkColumns = findForeignKeyColumns(schema);

// Step 2: Map relationships
const relationships = mapForeignKeyRelationships(fkColumns);

// Step 3: Analyze cascade behaviors
const cascades = analyzeCascadeBehaviors(relationships);

// Step 4: Create dependency graph
const graph = createDependencyGraph(relationships);

// Step 5: Document findings
return createFKAnalysisReport(relationships, cascades, graph);
```

---

## 🔍 DETAILED WORKFLOW

### Step 1: Identify Foreign Key Columns

**How to detect FK columns**:

```typescript
// From column names:
userId → FK to users.id
parentId → FK to same table.id
productId → FK to products.id
orderId → FK to orders.id

// Pattern: [tableName]Id or [relation]Id
```

**From SQL queries**:

```sql
-- Look for JOIN statements
SELECT * FROM orders o
JOIN users u ON o.userId = u.id
-- FK: orders.userId → users.id

-- Look for REFERENCES
CREATE TABLE orders (
  id INT PRIMARY KEY,
  userId INT REFERENCES users(id) ON DELETE CASCADE
);
-- FK: orders.userId → users.id (CASCADE on delete)
```

**From Prisma schema**:

```prisma
model Order {
  id     Int   @id
  userId Int
  user   User  @relation(fields: [userId], references: [id], onDelete: Cascade)
}
-- FK: orders.userId → users.id (CASCADE)
```

### Step 2: Extract Cascade Behaviors

```typescript
interface CascadeBehavior {
  onDelete: "CASCADE" | "SET NULL" | "RESTRICT" | "NO ACTION" | "SET DEFAULT";
  onUpdate: "CASCADE" | "SET NULL" | "RESTRICT" | "NO ACTION" | "SET DEFAULT";
}
```

**Cascade meanings**:

- **CASCADE**: When parent deleted/updated, child deleted/updated too
- **SET NULL**: When parent deleted/updated, FK in child set to NULL
- **RESTRICT**: Prevent parent delete/update if children exist
- **NO ACTION**: Similar to RESTRICT but checked at end of transaction
- **SET DEFAULT**: Set FK to default value

**Example**:

```sql
-- Delete user → Delete all orders (CASCADE)
userId INT REFERENCES users(id) ON DELETE CASCADE

-- Delete user → Set orders.userId to NULL (SET NULL)
userId INT REFERENCES users(id) ON DELETE SET NULL

-- Cannot delete user if orders exist (RESTRICT)
userId INT REFERENCES users(id) ON DELETE RESTRICT
```

### Step 3: Map Relationships

```typescript
interface ForeignKeyRelationship {
  name: string; // e.g., "orders_userId_fkey"
  sourceTable: string; // e.g., "orders"
  sourceColumn: string; // e.g., "userId"
  targetTable: string; // e.g., "users"
  targetColumn: string; // e.g., "id"
  relationshipType: "1:1" | "1:N" | "N:M";
  onDelete: CascadeBehavior["onDelete"];
  onUpdate: CascadeBehavior["onUpdate"];
  required: boolean; // NOT NULL constraint
}
```

**Relationship types**:

```typescript
// 1:1 (One-to-One)
users.id ←→ user_profiles.userId (UNIQUE)
// Each user has ONE profile, each profile belongs to ONE user

// 1:N (One-to-Many)
users.id ←→ orders.userId
// One user has MANY orders, each order belongs to ONE user

// N:M (Many-to-Many) - through junction table
users.id ←→ user_roles.userId
roles.id ←→ user_roles.roleId
// Many users have many roles
```

### Step 4: Create Dependency Graph

```typescript
interface DependencyGraph {
  nodes: string[]; // Table names
  edges: Array<{
    from: string; // Parent table
    to: string; // Child table (depends on parent)
    relationship: ForeignKeyRelationship;
  }>;
  dependencyOrder: string[]; // Order for safe deletion
}
```

**Example graph**:

```
users (root)
  ├─→ user_profiles (depends on users)
  ├─→ sessions (depends on users)
  ├─→ orders (depends on users)
  │     └─→ order_items (depends on orders)
  └─→ audit_logs (depends on users)

Deletion order (safe):
1. order_items
2. orders
3. sessions
4. user_profiles
5. audit_logs
6. users
```

### Step 5: Analyze Data Dependencies

```typescript
interface DataDependency {
  operation: "CREATE" | "UPDATE" | "DELETE";
  table: string;
  affects: Array<{
    table: string;
    action:
      | "CASCADE_DELETE"
      | "CASCADE_UPDATE"
      | "SET_NULL"
      | "RESTRICT"
      | "REQUIRED";
    description: string;
  }>;
}
```

**Example**:

```typescript
{
  operation: 'DELETE',
  table: 'users',
  affects: [
    {
      table: 'user_profiles',
      action: 'CASCADE_DELETE',
      description: 'Deleting user will automatically delete their profile'
    },
    {
      table: 'orders',
      action: 'CASCADE_DELETE',
      description: 'Deleting user will automatically delete all their orders'
    },
    {
      table: 'audit_logs',
      action: 'SET_NULL',
      description: 'Deleting user will set audit_logs.userId to NULL (preserve logs)'
    }
  ]
}
```

---

## 📊 OUTPUT FORMAT

```typescript
{
  // All FK Relationships
  relationships: [
    {
      name: "orders_userId_fkey",
      sourceTable: "orders",
      sourceColumn: "userId",
      targetTable: "users",
      targetColumn: "id",
      relationshipType: "1:N",
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
      required: true
    },
    {
      name: "audit_logs_userId_fkey",
      sourceTable: "audit_logs",
      sourceColumn: "userId",
      targetTable: "users",
      targetColumn: "id",
      relationshipType: "1:N",
      onDelete: "SET NULL",
      onUpdate: "CASCADE",
      required: false
    }
  ],

  // Dependency Graph
  dependencyGraph: {
    nodes: ["users", "orders", "order_items", "audit_logs"],
    edges: [
      { from: "users", to: "orders", relationship: {...} },
      { from: "orders", to: "order_items", relationship: {...} }
    ],
    dependencyOrder: ["order_items", "orders", "audit_logs", "users"]
  },

  // Data Dependencies
  dataDependencies: {
    "users": {
      CREATE: {
        requires: [],  // No dependencies
        creates: []    // Might create profile
      },
      DELETE: {
        affects: [
          "orders (CASCADE)",
          "order_items (CASCADE via orders)",
          "audit_logs (SET NULL)"
        ],
        mustDeleteFirst: ["order_items", "orders"]  // If not using CASCADE
      },
      UPDATE: {
        affects: ["orders (CASCADE)", "audit_logs (CASCADE)"]
      }
    }
  },

  // Risk Assessment
  riskAssessment: {
    highRiskOperations: [
      {
        operation: "DELETE users",
        reason: "Cascades to 3+ tables",
        affectedTables: ["orders", "order_items", "user_profiles"],
        recommendation: "Test cascade behavior thoroughly"
      }
    ]
  }
}
```

---

## 💡 EXAMPLES

### Example 1: E-commerce System

**Schema**:

```sql
CREATE TABLE users (
  id INT PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL
);

CREATE TABLE orders (
  id INT PRIMARY KEY,
  userId INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  total DECIMAL(10, 2)
);

CREATE TABLE order_items (
  id INT PRIMARY KEY,
  orderId INT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  productId INT NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity INT
);

CREATE TABLE audit_logs (
  id INT PRIMARY KEY,
  userId INT REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(255)
);
```

**FK Analysis**:

```typescript
{
  relationships: [
    {
      name: "orders_userId_fkey",
      sourceTable: "orders",
      sourceColumn: "userId",
      targetTable: "users",
      targetColumn: "id",
      relationshipType: "1:N",
      onDelete: "CASCADE",
      onUpdate: "NO ACTION",
      required: true,
      dataImpact: "Deleting user deletes all their orders"
    },
    {
      name: "order_items_orderId_fkey",
      sourceTable: "order_items",
      sourceColumn: "orderId",
      targetTable: "orders",
      targetColumn: "id",
      relationshipType: "1:N",
      onDelete: "CASCADE",
      onUpdate: "NO ACTION",
      required: true,
      dataImpact: "Deleting order deletes all items in that order"
    },
    {
      name: "order_items_productId_fkey",
      sourceTable: "order_items",
      sourceColumn: "productId",
      targetTable: "products",
      targetColumn: "id",
      relationshipType: "N:1",
      onDelete: "RESTRICT",
      onUpdate: "NO ACTION",
      required: true,
      dataImpact: "Cannot delete product if it's in any order_items"
    },
    {
      name: "audit_logs_userId_fkey",
      sourceTable: "audit_logs",
      sourceColumn: "userId",
      targetTable: "users",
      targetColumn: "id",
      relationshipType: "N:1",
      onDelete: "SET NULL",
      onUpdate: "NO ACTION",
      required: false,
      dataImpact: "Deleting user preserves audit logs but sets userId to NULL"
    }
  ],

  cascadeChains: [
    {
      trigger: "DELETE users WHERE id = 1",
      cascade: [
        "Step 1: DELETE orders WHERE userId = 1 (CASCADE)",
        "Step 2: DELETE order_items WHERE orderId IN (orders of user 1) (CASCADE)",
        "Step 3: UPDATE audit_logs SET userId = NULL WHERE userId = 1 (SET NULL)"
      ],
      tablesAffected: ["orders", "order_items", "audit_logs"],
      recordsAffected: "Multiple tables, potentially many records"
    }
  ],

  restrictions: [
    {
      operation: "DELETE products WHERE id = 5",
      restriction: "RESTRICT on order_items.productId",
      message: "Cannot delete product if it appears in any order",
      workaround: "Delete order_items first, then product"
    }
  ]
}
```

**Test Implications**:

```typescript
// HIGH PRIORITY TESTS for DELETE users:
1. Test user deletion cascades to orders ✅
2. Test user deletion cascades to order_items (via orders) ✅
3. Test user deletion sets audit_logs.userId to NULL ✅
4. Test cannot delete product with existing order_items ✅
5. Test cascade happens in correct order ✅

// MEDIUM PRIORITY TESTS:
6. Test deleting order cascades to order_items ✅
7. Test deleting order doesn't affect user ✅

// EDGE CASES:
8. Test deleting user with no orders (still sets audit_logs to NULL) ✅
9. Test deleting user with many orders (performance) ✅
```

---

## 🚨 CRITICAL FK SCENARIOS TO TEST

### Scenario 1: CASCADE DELETE (High Risk)

```typescript
// When FK has ON DELETE CASCADE
// Risk: Deletes spread to multiple tables

Test Plan:
1. Create parent record
2. Create child records
3. Delete parent
4. Verify children are deleted (CASCADE worked)
5. Verify grandchildren deleted (multi-level cascade)

Example:
- Create user
- Create order for user
- Create order_items for order
- Delete user
- Assert: order deleted ✅
- Assert: order_items deleted ✅
```

### Scenario 2: SET NULL (Medium Risk)

```typescript
// When FK has ON DELETE SET NULL
// Risk: Data integrity - orphaned records

Test Plan:
1. Create parent record
2. Create child records with FK
3. Delete parent
4. Verify children still exist
5. Verify FK in children is NULL

Example:
- Create user
- Create audit_log with userId
- Delete user
- Assert: audit_log still exists ✅
- Assert: audit_log.userId is NULL ✅
```

### Scenario 3: RESTRICT (Medium Risk)

```typescript
// When FK has ON DELETE RESTRICT
// Risk: Cannot delete parent with children

Test Plan:
1. Create parent record
2. Create child records
3. Try to delete parent
4. Verify delete fails (RESTRICT works)
5. Delete children first
6. Try to delete parent again
7. Verify delete succeeds

Example:
- Create product
- Create order_item with productId
- Try to delete product
- Assert: Error thrown (FK violation) ✅
- Delete order_item
- Delete product
- Assert: Product deleted ✅
```

### Scenario 4: Multi-Level CASCADE (High Risk)

```typescript
// When cascades chain across multiple levels
// Risk: Unintended data loss

Test Plan:
1. Create parent (level 1)
2. Create child (level 2, FK to parent)
3. Create grandchild (level 3, FK to child)
4. Delete parent
5. Verify all levels deleted

Example:
- Create user
- Create order (FK to user)
- Create order_item (FK to order)
- Delete user
- Assert: order deleted ✅
- Assert: order_item deleted ✅
```

---

## 🎯 FK TESTING RECOMMENDATIONS

For each FK relationship, recommend tests:

```typescript
interface FKTestRecommendations {
  relationship: ForeignKeyRelationship;
  priority: "HIGH" | "MEDIUM" | "LOW";
  tests: Array<{
    type: "CASCADE" | "SET_NULL" | "RESTRICT" | "REQUIRED" | "OPTIONAL";
    description: string;
    testScenario: string;
  }>;
}
```

**Example output**:

```typescript
{
  relationship: {
    name: "orders_userId_fkey",
    sourceTable: "orders",
    targetTable: "users",
    onDelete: "CASCADE"
  },
  priority: "HIGH",
  tests: [
    {
      type: "CASCADE",
      description: "Verify order deleted when user deleted",
      testScenario: "Create user and order, delete user, assert order deleted"
    },
    {
      type: "REQUIRED",
      description: "Verify cannot create order without valid userId",
      testScenario: "Try to create order with non-existent userId, expect error"
    },
    {
      type: "CASCADE",
      description: "Verify multiple orders deleted when user deleted",
      testScenario: "Create user with 3 orders, delete user, assert all 3 deleted"
    }
  ]
}
```

---

## ✅ FK ANALYSIS CHECKLIST

When analyzing FK relationships, verify you've captured:

**Relationship Identification**

- [ ] All FK columns identified
- [ ] Source and target tables mapped
- [ ] Relationship types determined (1:1, 1:N, N:M)
- [ ] Required vs optional noted (NOT NULL)

**Cascade Behaviors**

- [ ] ON DELETE behavior documented
- [ ] ON UPDATE behavior documented
- [ ] Multi-level cascades identified
- [ ] Circular dependencies detected

**Data Dependencies**

- [ ] CREATE dependencies (what's required first)
- [ ] DELETE impacts (what gets affected)
- [ ] UPDATE impacts (what gets changed)
- [ ] RESTRICT scenarios (what prevents deletion)

**Risk Assessment**

- [ ] High-risk operations identified
- [ ] Tables affected by cascades counted
- [ ] Data loss scenarios documented
- [ ] Orphaned data scenarios noted

**Test Recommendations**

- [ ] CASCADE tests recommended
- [ ] SET NULL tests recommended
- [ ] RESTRICT tests recommended
- [ ] Multi-level cascade tests recommended
- [ ] Performance tests for large cascades

---

## 🎯 SUCCESS CRITERIA

FK analysis is complete when you can answer:

1. **What tables depend on each other?** (Dependency graph)
2. **What happens when I delete a parent?** (CASCADE/SET NULL/RESTRICT)
3. **What's the safe deletion order?** (Reverse dependency order)
4. **Which operations are high-risk?** (Multi-table cascades)
5. **What FK tests are needed?** (Test scenarios per relationship)

If you can answer all 5 questions, your FK analysis is complete ✅

---

## 📚 NEXT STEPS

After completing FK analysis:

1. **Use in Skill 5**: Test Scenario Recommendation
   - Recommend FK-specific tests
   - Prioritize high-risk operations
2. **Use in Skill 7**: Test Plan Generation
   - Include FK cascade tests
   - Document data dependencies

---

**File**: foreign-key-analysis.md  
**Skill**: 3  
**Status**: Production-Ready  
**Purpose**: Map FK relationships and recommend cascade tests
