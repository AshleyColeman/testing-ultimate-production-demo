# Skill 2: PRISMA SCHEMA DEEP ANALYSIS

## 📋 PURPOSE

Read and deeply analyze Prisma schema files to understand complete database structure, relationships, and constraints.

**Goal**: Extract EVERY detail from schema.prisma to inform comprehensive test recommendations.

---

## 🎯 WHEN TO USE

- **ALWAYS** when service uses Prisma ORM
- Before analyzing any Prisma-based method
- When detecting database patterns
- When mapping relationships between tables

---

## ⚡ QUICK START

```typescript
// Step 1: Locate schema.prisma file
const schemaPath = "prisma/schema.prisma";

// Step 2: Read and parse schema
const schema = readPrismaSchema(schemaPath);

// Step 3: Extract all models
const models = extractAllModels(schema);

// Step 4: Map relationships
const relationships = mapPrismaRelationships(models);

// Step 5: Extract validation rules
const validations = extractValidationRules(models);

// Step 6: Identify indexes and constraints
const constraints = extractConstraints(models);
```

---

## 🔍 DETAILED WORKFLOW

### Step 1: Locate Prisma Schema

**Common locations**:

```
prisma/schema.prisma          ← Most common
prisma/schema/schema.prisma
src/prisma/schema.prisma
schema.prisma                 ← Root directory
```

**Read entire file**:

```prisma
// Example schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String
  posts     Post[]
  profile   Profile?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Post {
  id        Int      @id @default(autoincrement())
  title     String
  content   String?
  published Boolean  @default(false)
  authorId  String
  author    User     @relation(fields: [authorId], references: [id], onDelete: Cascade)
  tags      Tag[]
}

model Profile {
  id     Int    @id @default(autoincrement())
  bio    String?
  userId String @unique
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Tag {
  id    Int    @id @default(autoincrement())
  name  String @unique
  posts Post[]
}
```

### Step 2: Extract All Models

```typescript
interface PrismaModel {
  name: string;
  fields: PrismaField[];
  relationships: PrismaRelation[];
  uniqueConstraints: string[][];
  indexes: PrismaIndex[];
}

interface PrismaField {
  name: string;
  type: string;
  isRequired: boolean;
  isUnique: boolean;
  isId: boolean;
  defaultValue?: string;
  validations?: FieldValidation[];
}

interface PrismaRelation {
  name: string;
  type: "1:1" | "1:N" | "N:M";
  relatedModel: string;
  fields?: string[];
  references?: string[];
  onDelete?: "Cascade" | "SetNull" | "Restrict" | "NoAction";
  onUpdate?: "Cascade" | "SetNull" | "Restrict" | "NoAction";
}
```

**Example extraction**:

```typescript
// From User model:
{
  name: "User",
  fields: [
    {
      name: "id",
      type: "String",
      isRequired: true,
      isUnique: false,
      isId: true,
      defaultValue: "cuid()"
    },
    {
      name: "email",
      type: "String",
      isRequired: true,
      isUnique: true,
      isId: false
    },
    {
      name: "name",
      type: "String",
      isRequired: true,
      isUnique: false,
      isId: false
    },
    {
      name: "createdAt",
      type: "DateTime",
      isRequired: true,
      isUnique: false,
      isId: false,
      defaultValue: "now()"
    }
  ],
  relationships: [
    {
      name: "posts",
      type: "1:N",
      relatedModel: "Post",
      onDelete: "Cascade"
    },
    {
      name: "profile",
      type: "1:1",
      relatedModel: "Profile",
      onDelete: "Cascade"
    }
  ]
}
```

### Step 3: Identify All Relationship Types

**1:1 (One-to-One)**:

```prisma
model User {
  id      String   @id
  profile Profile? // Optional relation
}

model Profile {
  id     Int    @id
  userId String @unique  // ← @unique makes it 1:1
  user   User   @relation(fields: [userId], references: [id])
}
```

**1:N (One-to-Many)**:

```prisma
model User {
  id    String @id
  posts Post[] // ← Array indicates "many"
}

model Post {
  id       Int    @id
  authorId String
  author   User   @relation(fields: [authorId], references: [id])
}
```

**N:M (Many-to-Many)** - Implicit:

```prisma
model Post {
  id   Int   @id
  tags Tag[] // ← Array on both sides
}

model Tag {
  id    Int    @id
  posts Post[] // ← Creates junction table automatically
}
```

**N:M (Many-to-Many)** - Explicit:

```prisma
model Post {
  id          Int          @id
  postTags    PostTag[]
}

model Tag {
  id          Int          @id
  postTags    PostTag[]
}

model PostTag {
  postId  Int
  tagId   Int
  post    Post  @relation(fields: [postId], references: [id])
  tag     Tag   @relation(fields: [tagId], references: [id])

  @@id([postId, tagId])
}
```

### Step 4: Extract Cascade Behaviors

```typescript
interface CascadeBehavior {
  operation: "DELETE" | "UPDATE";
  action: "Cascade" | "SetNull" | "Restrict" | "NoAction" | "SetDefault";
  affectedModel: string;
  affectedField: string;
}
```

**From schema**:

```prisma
model Post {
  authorId String
  author   User @relation(fields: [authorId], references: [id], onDelete: Cascade, onUpdate: Cascade)
}

// Extract:
{
  operation: "DELETE",
  action: "Cascade",
  affectedModel: "Post",
  affectedField: "authorId",
  description: "When User deleted, all their Posts are deleted"
}
```

### Step 5: Extract Validation Rules & Constraints

```typescript
interface ValidationRule {
  field: string;
  rule: string;
  details: string;
}

// From schema attributes:
@unique        → Must be unique across all records
@id            → Primary key
@default(...)  → Has default value
@updatedAt     → Auto-updated timestamp
@db.VarChar(255) → Max length constraint
```

**Example**:

```prisma
model User {
  email     String   @unique @db.VarChar(255)
  age       Int      @default(0) @db.SmallInt
  role      Role     @default(USER)
  password  String   @db.VarChar(100)
}

enum Role {
  USER
  ADMIN
  MODERATOR
}
```

**Extract**:

```typescript
{
  validations: [
    {
      field: "email",
      rule: "unique",
      details: "Email must be unique, max 255 chars",
    },
    {
      field: "age",
      rule: "default",
      details: "Defaults to 0 if not provided",
    },
    {
      field: "role",
      rule: "enum",
      details: "Must be one of: USER, ADMIN, MODERATOR",
    },
  ];
}
```

### Step 6: Identify Indexes

```prisma
model User {
  email String
  name  String

  @@index([email])
  @@index([name, email])
  @@unique([email, name])
}
```

**Extract**:

```typescript
{
  indexes: [
    { fields: ["email"], type: "index" },
    { fields: ["name", "email"], type: "composite" },
    { fields: ["email", "name"], type: "unique composite" },
  ];
}
```

### Step 7: Map Complete Data Flow

```typescript
interface DataFlow {
  rootModel: string;
  dependencies: {
    creates: string[]; // Models that will be created
    updates: string[]; // Models that will be updated
    deletes: string[]; // Models that will be deleted (cascade)
  };
  sideEffects: string[];
}
```

**Example for User deletion**:

```typescript
{
  rootModel: "User",
  operation: "DELETE",
  dependencies: {
    creates: [],
    updates: ["AuditLog"],  // Updates audit log
    deletes: ["Post", "Comment", "Profile"]  // Cascades
  },
  sideEffects: [
    "All Posts deleted (Cascade)",
    "All Comments in those Posts deleted (Cascade via Post)",
    "Profile deleted (Cascade)",
    "Session set to NULL (SetNull)"
  ]
}
```

---

## 📊 COMPREHENSIVE OUTPUT

```typescript
{
  database: {
    provider: "postgresql",
    url: "env:DATABASE_URL"
  },

  models: [
    {
      name: "User",
      tableName: "users",  // Auto-converted by Prisma
      fields: [
        {
          name: "id",
          type: "String",
          dbType: "TEXT",
          isId: true,
          isRequired: true,
          isUnique: false,
          default: "cuid()",
          testImplications: [
            "Generate unique IDs for each test",
            "Use cuid format in test data",
            "Cannot use sequential integers"
          ]
        },
        {
          name: "email",
          type: "String",
          dbType: "VARCHAR(255)",
          isId: false,
          isRequired: true,
          isUnique: true,
          testImplications: [
            "Must be unique - use timestamps in test data",
            "Test duplicate email error",
            "Test email format validation",
            "Max 255 characters"
          ]
        }
      ],

      relationships: [
        {
          name: "posts",
          type: "1:N",
          relatedModel: "Post",
          relationField: "author",
          foreignKey: "authorId",
          onDelete: "Cascade",
          testImplications: [
            "Test creating user with posts",
            "Test deleting user cascades to posts",
            "Test user with 0, 1, many posts",
            "Test orphaned posts prevented"
          ]
        }
      ],

      constraints: [
        {
          type: "UNIQUE",
          fields: ["email"],
          testImplications: [
            "Test duplicate email throws error",
            "Test error message contains 'unique constraint'",
            "Test error code P2002 or P2010"
          ]
        }
      ],

      indexes: [
        {
          fields: ["email"],
          type: "unique",
          testImplications: [
            "Lookups by email should be fast",
            "Test performance with 1000+ users"
          ]
        }
      ]
    }
  ],

  relationships: {
    graph: {
      "User": ["Post", "Profile", "Session"],
      "Post": ["Comment", "Tag"],
      "Profile": []
    },

    cascadeChains: [
      {
        trigger: "DELETE User",
        chain: [
          "Step 1: Delete all Posts (Cascade)",
          "Step 2: Delete all Comments in those Posts (Cascade via Post)",
          "Step 3: Delete Profile (Cascade)",
          "Step 4: Set Session.userId to NULL (SetNull)"
        ],
        testScenarios: [
          "Create user → posts → comments, delete user, verify all deleted",
          "Create user with 100 posts, delete user, verify performance",
          "Delete user with no posts, verify no errors"
        ]
      }
    ]
  },

  testRecommendations: {
    highPriority: [
      {
        model: "User",
        reason: "Root model with multiple cascades",
        tests: [
          "Delete user with posts (cascade test)",
          "Delete user with profile (cascade test)",
          "Create user with duplicate email (unique constraint)",
          "Update user email to duplicate (unique constraint)",
          "Create user with all relations",
          "Query user with nested relations (include posts, profile)"
        ]
      }
    ],

    edgeCases: [
      {
        scenario: "N:M relationship with explicit junction table",
        model: "Post ↔ Tag",
        tests: [
          "Create post with no tags",
          "Create post with 100 tags",
          "Add same tag twice to post (should handle gracefully)",
          "Delete post with tags (junction table cleaned up)",
          "Delete tag used by multiple posts (tag removed from all)"
        ]
      }
    ],

    performanceTests: [
      {
        scenario: "Large dataset operations",
        tests: [
          "Create 1000 users rapidly",
          "Query user with 1000 posts (pagination)",
          "Delete user with 1000 posts (cascade performance)",
          "Update 1000 users in transaction"
        ]
      }
    ]
  }
}
```

---

## 💡 PRISMA-SPECIFIC TEST SCENARIOS

### Scenario 1: Prisma Unique Constraint Errors

```typescript
// Prisma throws specific error codes
try {
  await prisma.user.create({ data: { email: "existing@test.com" } });
} catch (error) {
  // Could be P2002 or P2010 depending on Prisma version and database
  expect(error.code).toMatch(/P2002|P2010/);
  expect(error.message).toContain("Unique constraint");
}
```

**Test Recommendations**:

1. Test duplicate on EACH unique field
2. Test composite unique constraints
3. Test error message contains field name
4. Test both error codes (P2002 and P2010)

### Scenario 2: Prisma Cascade Deletions

```typescript
// Create related data
const user = await prisma.user.create({
  data: {
    email: "test@example.com",
    posts: {
      create: [{ title: "Post 1" }, { title: "Post 2" }],
    },
  },
});

// Delete parent
await prisma.user.delete({ where: { id: user.id } });

// Verify children deleted
const posts = await prisma.post.findMany({ where: { authorId: user.id } });
expect(posts).toHaveLength(0);
```

**Test Recommendations**:

1. Test single-level cascade (User → Post)
2. Test multi-level cascade (User → Post → Comment)
3. Test cascade with large datasets (User with 1000 posts)
4. Test cascade timing/performance

### Scenario 3: Prisma Optional Relations

```prisma
model User {
  profile Profile? // ← Optional
}
```

**Test Recommendations**:

1. Create user WITHOUT optional relation
2. Create user WITH optional relation
3. Query user, ensure profile is null when not present
4. Delete optional relation, ensure parent unaffected
5. Test `include` vs `select` behavior

### Scenario 4: Prisma Nested Creates

```typescript
await prisma.user.create({
  data: {
    email: "test@example.com",
    profile: {
      create: { bio: "Test bio" },
    },
    posts: {
      create: [{ title: "Post 1" }, { title: "Post 2" }],
    },
  },
});
```

**Test Recommendations**:

1. Nested create with all relations
2. Nested create with some relations
3. Nested create with no relations
4. Nested create failure (rollback test)
5. Nested create with validation errors

### Scenario 5: Prisma Transaction Tests

```typescript
await prisma.$transaction([
  prisma.user.create({ data: { email: "user1@test.com" } }),
  prisma.user.create({ data: { email: "user2@test.com" } }),
  prisma.user.create({ data: { email: "user1@test.com" } }), // ← Duplicate!
]);
```

**Test Recommendations**:

1. All operations succeed
2. One operation fails → all rollback
3. Transaction timeout
4. Transaction with nested creates
5. Multiple transactions in parallel

---

## 🚨 CRITICAL PRISMA PATTERNS TO TEST

### Pattern 1: @updatedAt Auto-Update

```prisma
model User {
  updatedAt DateTime @updatedAt
}
```

**Tests**:

1. Create record, verify updatedAt set
2. Update record, verify updatedAt changed
3. Update with same data, verify updatedAt still changes
4. Multiple rapid updates, verify updatedAt always latest

### Pattern 2: @default Values

```prisma
model User {
  role Role @default(USER)
  isActive Boolean @default(true)
}
```

**Tests**:

1. Create without field, verify default applied
2. Create with explicit value, verify default NOT applied
3. Create with null (if allowed), verify behavior
4. Update to remove value, verify default NOT re-applied

### Pattern 3: Enums

```prisma
enum Role {
  USER
  ADMIN
  MODERATOR
}
```

**Tests**:

1. Create with each enum value
2. Create with invalid enum (should fail)
3. Update enum value
4. Query by enum value
5. TypeScript type checking (compile-time)

### Pattern 4: Composite IDs

```prisma
model PostTag {
  postId Int
  tagId  Int

  @@id([postId, tagId])
}
```

**Tests**:

1. Create with composite key
2. Try duplicate composite (should fail)
3. Delete by composite key
4. Update part of composite key (usually not allowed)
5. Query by partial composite key

---

## ✅ PRISMA ANALYSIS CHECKLIST

When analyzing Prisma service, verify:

**Schema Understanding**

- [ ] Located and read schema.prisma file
- [ ] Extracted all models
- [ ] Identified all fields with types
- [ ] Found all relationships (1:1, 1:N, N:M)
- [ ] Noted all cascade behaviors
- [ ] Listed all unique constraints
- [ ] Identified all default values
- [ ] Found all enums
- [ ] Noted all indexes

**Relationship Mapping**

- [ ] Mapped parent-child relationships
- [ ] Identified cascade chains
- [ ] Found optional vs required relations
- [ ] Noted implicit vs explicit N:M
- [ ] Checked for circular dependencies

**Test Implications**

- [ ] Unique constraint tests for each @unique
- [ ] Cascade tests for each onDelete: Cascade
- [ ] Default value tests for each @default
- [ ] Enum tests for each enum field
- [ ] Relationship tests for each relation
- [ ] Transaction tests for complex operations
- [ ] Performance tests for large datasets

---

## 🎯 SUCCESS CRITERIA

Prisma analysis is complete when you can answer:

1. **What models exist?** (All models listed)
2. **What are their relationships?** (1:1, 1:N, N:M mapped)
3. **What happens on delete?** (Cascade chains documented)
4. **What are the constraints?** (Unique, required, defaults)
5. **What Prisma features are used?** (@updatedAt, enums, transactions)
6. **What tests are needed?** (Unique, cascade, relation, enum tests)

---

**File**: prisma-schema-deep-analysis.md  
**Skill**: 2  
**Status**: Production-Ready  
**Purpose**: Deep Prisma schema analysis for comprehensive test recommendations
