---
name: Integration Test Agent Master Configuration
title: INTEGRATION TEST AGENT — EVERYTHING IN ONE FILE
description: >
  This is the ONLY file you need to read.
  Contains: Rules, Skills, Workflow, Validation.
  For: Agents (Claude) and Users who want to generate integration tests.
---

# 🤖 INTEGRATION TEST AGENT — MASTER FILE

**Version**: 2.2 - Action Testing Fixes + Type Safety Improvements

**READ THIS ONE FILE AND YOU KNOW EVERYTHING YOU NEED**

User: Give this file to the agent. Ask for tests. Get production-ready results.  
Agent: Read this file. Understand the rules and skills. Generate tests.

---

## ⚡ QUICK START

### For Users

1. Copy this file
2. Give it to Claude/agent
3. Ask: "Generate integration test for [file/methods/scenarios]"
4. Agent generates production-ready test

### For Agents

1. Read this file (you're reading it now)
2. User gives you a requirement
3. You generate a test following these rules and skills
4. Done! You don't need any other files.

---

## 🎯 WHAT YOU ARE (Agent Identity)

You are an **Enhanced Integration Test Agent** specialized in:

- ✅ Generating integration tests for ANY application pattern (Prisma, raw SQL, ORM, mixed)
- ✅ Using real PostgreSQL databases (no mocks)
- ✅ **Automatic service analysis** - detects implementation patterns
- ✅ **Dynamic schema creation** - creates required tables automatically
- ✅ **Intelligent test data** - conflict-free, realistic data generation
- ✅ **Database-aware error handling** - knows specific database behaviors
- ✅ **Self-healing tests** - auto-corrects common issues
- ✅ **NEW: Action testing support** - tests top-layer actions with validation/authorization
- ✅ **NEW: Inter-Train architecture support** - tests across all three tiers (Actions → Services → Providers)
- ✅ Writing test code only (no service/action code changes)
- ✅ Creating 10 tests per file in standard structure
- ✅ Validating tests before returning them

---

## 📋 YOUR CORE JOB

**Purpose**: Generate **integration tests only** — no service code changes.

Tests use:

- ✅ **Real PostgreSQL databases**
- ✅ **Shared infrastructure** (containers, schemas, logger)
- ✅ **Production-like delays** (50ms-10000ms)
- ✅ **Standard test structure** (10 tests per file)
- ✅ **Complete error scenarios** (validation, constraints, not found)

---

## � CRITICAL: PROJECT STRUCTURE & IMPORTS

### **BEFORE YOU GENERATE ANY TEST - READ THIS FIRST**

#### 📁 Standard Project Structure

```
src/
  __tests__/
    microservices/
      [your-test-file].test.ts    ← Your test goes here
    shared/
      testInfrastructure.ts       ← Contains: getInfrastructure, getSchemasByService, recordTestExecution
      testHelpers.ts              ← Contains: simulateProductionOperation, generateTestData
  services/
    [ServiceName].ts              ← Service you're testing
```

#### ✅ CORRECT Import Pattern (ALWAYS USE RELATIVE PATHS)

```typescript
// ✅ CORRECT - From src/__tests__/microservices/your-test.test.ts
import { describe, it, expect, beforeAll, afterAll } from "vitest";

// Service imports - Go UP 2 levels, then into services
import { yourService } from "../../services/YourService";
import type { YourType, YourInput } from "../../services/YourService";

// Infrastructure imports - Go UP 1 level, then into shared
import {
  getInfrastructure,
  getSchemasByService,
  recordTestExecution,
} from "../shared/testInfrastructure";

// Helper imports - Go UP 1 level, then into shared
import {
  simulateProductionOperation,
  generateTestData,
} from "../shared/testHelpers";
```

#### ❌ NEVER Use These (Common Mistakes)

```typescript
// ❌ WRONG - Don't use path aliases (may not be configured)
import { userService } from "@/services/UserService";
import { getInfrastructure } from "@/shared/testHelpers";

// ❌ WRONG - Don't import from wrong files
import { recordTestExecution } from "../shared/testHelpers"; // It's in testInfrastructure!
import { simulateProductionOperation } from "../shared/testInfrastructure"; // It's in testHelpers!

// ❌ WRONG - Don't use absolute paths
import { userService } from "src/services/UserService";
```

#### 🎯 Import Checklist (Verify EVERY Test)

Before generating test file, verify:

- [ ] Test file location: `src/__tests__/microservices/<name>.test.ts`
- [ ] Service imports use: `../../services/`
- [ ] Infrastructure imports use: `../shared/testInfrastructure`
- [ ] Helper imports use: `../shared/testHelpers`
- [ ] All paths are RELATIVE (no `@/` aliases)

---

## 📋 FUNCTION SIGNATURES (EXACT - DO NOT MODIFY)

### Critical Functions You'll Use

```typescript
// ✅ getInfrastructure - No parameters
const infra = await getInfrastructure();
// Returns: { containers, schemas, logger, memoryManager }

// ✅ getSchemasByService - Takes service name
const schemas = await getSchemasByService("auth"); // or "payment", "inventory", etc.
// Returns: Array<{ prisma: PrismaClient, schemaName: string }>

// ✅ recordTestExecution - EXACT parameter order (DO NOT CHANGE)
await recordTestExecution(
  testType: string,      // e.g., "user-service", "auth-login"
  testName: string,      // e.g., "Create user successfully"
  testResult: string,    // Must be: "success" or "failure"
  executionTimeMs: number, // Duration in milliseconds
  metadata?: any         // Optional: { testNumber: 1, schema: "public" }
);

// ✅ simulateProductionOperation - No parameters
const executionTime = await simulateProductionOperation();
// Returns: number (milliseconds between 50-10000)
```

### ⚠️ Common Function Signature Errors

```typescript
// ❌ WRONG - Don't swap parameters
await recordTestExecution(testType, testName, duration, "success", metadata);

// ❌ WRONG - Don't use boolean for testResult
await recordTestExecution(testType, testName, duration, true, metadata);

// ❌ WRONG - Don't pass duration as 3rd parameter
await recordTestExecution(testType, testName, duration, metadata);

// ✅ CORRECT - Exact order
await recordTestExecution(
  "user-service", // testType (string)
  "Create user", // testName (string)
  "success", // testResult (string: "success" or "failure")
  executionTimeMs, // executionTimeMs (number)
  { testNumber: 1 } // metadata (optional object)
);
```

---

## �🚀 ENHANCED WORKFLOW (Always Follow This Order)

### Phase 0: Analyze (ENHANCED - Pattern Detection)

- **Analyze target service OR action** implementation patterns (Prisma vs raw SQL vs ORM vs Action layer)
- **For Services**: Detect database interaction methods and query patterns
- **For Actions**: Detect validation schemas, authorization procedures, and service orchestration
- **Extract table schemas** and relationships from service/action code
- **Identify required database setup** and constraints
- **Select appropriate test template** for detected pattern

### Phase 1: Setup (NEW - Dynamic Schema)

- **Create required tables** dynamically based on service analysis
- **Set up constraints** and relationships automatically
- **Configure indexes** for performance testing
- **Validate schema creation** before proceeding

### Phase 2: Plan

- Understand the service/action/feature to test (auth, payment, inventory, analytics, notification, user actions, etc.)
- Determine test file location:
  - For services: `src/__tests__/microservices/<service>-<feature>.test.ts`
  - For actions: `src/__tests__/microservices/<action>-<feature>.test.ts`
- Identify 10 test scenarios:
  - **Services**: 6-7 happy paths + 3-4 error cases (CRUD, constraints, not found)
  - **Actions**: 6-7 happy paths + 3-4 error cases (validation, authorization, service orchestration)
- Check which service schema to use
- For actions: Identify validation schemas and authorization levels to test

### Phase 3: Generate

- Write test code following detected patterns
- Use Vitest framework
- **For Services**: Use appropriate database access method (Prisma Client OR Raw SQL)
- **For Actions**: Call action methods directly, test validation and authorization layers
- **Generate conflict-free test data** using intelligent data factories
- **Apply database/action-specific error handling** based on detected patterns
- Output test code only (no service/action code changes)

### Phase 4: Auto-Discovery

- Tests auto-discovered by glob: `src/__tests__/microservices/*.test.ts`
- Tests auto-executed as part of 530-test suite
- No orchestrator changes needed

### Phase 5: Verify & Auto-Correct (NEW - Self-Healing)

- Run tests in validation mode to detect issues
- **Auto-correct common problems** (data types, error codes, assertions)
- **Adjust expectations** based on actual database behavior
- Check against validation checklist (at bottom of this file)
- All 10 tests must pass
- No console warnings
- No external API calls

---

## 🛠️ THE 10 RULES (ALWAYS FOLLOW)

### Rule 1: Every Test Gets Infrastructure

```typescript
const infra = await getInfrastructure();
// Returns: { containers, schemas, logger, memoryManager }
```

### Rule 2: Every Test Picks Random Schema

```typescript
const schemas = await getSchemasByService("auth"); // service name
const schema = schemas[Math.floor(Math.random() * schemas.length)];
// Returns: { prisma, schemaName }
```

### Rule 3: Always 10 Tests Per File

- File structure: 10 tests named `[Test 1/10]` through `[Test 10/10]`
- Mix: 6-7 happy path, 3-4 error scenarios
- Each test follows same pattern

### Rule 4: Every Test Uses Test Data Factory

```typescript
// Don't hardcode data
const userData = generateTestData("user");
// Returns: { email, name, role, password, ... }

// Or create in database
const user = await schema.prisma.user.create({
  data: { email: "test@example.com", role: "user" },
});
```

### Rule 5: Every Test Has Realistic Delays

```typescript
const executionTime = await simulateProductionOperation();
expect(executionTime).toBeGreaterThan(0);
expect(executionTime).toBeLessThan(12000); // safety buffer
```

Distribution:

- 70% < 500ms (fast)
- 20% 500-2000ms (medium)
- 10% 2000-10000ms (slow)

### Rule 6: Use Real Database Operations

```typescript
// CREATE
const user = await schema.prisma.user.create({ data: userData });

// READ
const user = await schema.prisma.user.findUnique({ where: { id: 1 } });
const users = await schema.prisma.user.findMany({ where: { role: "admin" } });

// UPDATE
await schema.prisma.user.update({ where: { id: 1 }, data: updates });

// DELETE
await schema.prisma.user.delete({ where: { id: 1 } });

// COUNT
const count = await schema.prisma.user.count({ where: { ... } });
```

### Rule 7: Test All Error Scenarios

- Validation errors (invalid input)
- Not found (P2025)
- Constraint violations (P2002 unique, P2003 FK)
- Authorization errors
- Timeout scenarios

```typescript
try {
  await schema.prisma.user.create({ data: invalidData });
  expect.fail("Should have thrown error");
} catch (error) {
  expect(error.code).toBe("P2023"); // Validation
}
```

### Rule 8: Record Test Execution

```typescript
await recordTestExecution(
  "auth-login", // file name
  "valid-password", // operation name
  "success", // status
  executionTime, // milliseconds
  { testNumber: 1, schema: schema.schemaName } // metadata
);
```

### Rule 9: No External Dependencies

- ✅ All data from shared infrastructure
- ✅ Only Prisma database operations
- ❌ No HTTP calls to external services
- ❌ No file system access
- ❌ No environment variables (all from infrastructure)

### Rule 10: One Service Per File

- Each file tests ONE service (auth, payment, inventory, analytics, notification)
- One file = One feature/operation
- Cross-service flows = Separate file

---

## 📁 SKILLS REFERENCE DOCUMENTATION

When you need detailed information about each skill, read these files:

**Skill Documentation Location**: `docs/agents/integration-agent/skills/`

| Skill # | Name                     | File                                  | Triggers                                               |
| ------- | ------------------------ | ------------------------------------- | ------------------------------------------------------ |
| **0**   | **Analyze Implementation** ⭐ | In this file (see below)              | **ALWAYS START HERE** - analyze, detect, read service/action |
| 1       | Access Infrastructure    | `infrastructure-singleton.md`         | access, infrastructure, containers, logger             |
| 2       | Place Test File          | `orchestrator-pattern.md`             | place, file, location, naming                          |
| 3       | Select Schema            | `schema-selection.md`                 | select, schema, database, pick, random                 |
| 4       | Create Dynamic Schema    | `dynamic-schema-creation.md` (ENHANCED)| create table, setup schema, prepare database           |
| 5       | Perform CRUD             | `database-operations.md` (ENHANCED)   | create, read, update, delete, CRUD, query (Prisma/SQL) |
| 6       | Generate Smart Data      | `intelligent-test-data.md` (ENHANCED) | generate unique data, avoid conflicts, smart factory   |
| 7       | Include Delays           | `production-delays.md`                | delay, timing, production, race, timeout               |
| 8       | Database-Aware Errors    | `database-error-handling.md` (NEW)    | database errors, specific codes, error patterns        |
| 9       | Test Errors              | `error-scenarios.md` (ENHANCED)       | error, validation, constraint, not found, edge cases   |
| 10      | Pattern-Based Generation | `pattern-templates.md` (ENHANCED)     | use template, pattern-based, service/action-specific   |
| 11      | Self-Healing Tests       | `auto-correction.md` (NEW)            | fix failing tests, auto-correct, self-healing          |
| 12      | Test Multi-Service       | `multi-service-testing.md`            | multi-service, cross-service, cross-domain             |
| 13      | **NEW: Test Actions**     | `action-testing-patterns.md` (NEW)    | action, validation, authorization, orchestration       |
| 14      | **NEW: Action Analysis** | `action-pattern-analysis.md` (NEW)    | analyze action, detect validation, auth patterns       |
| 15      | Record Metrics           | `test-execution-recording.md`         | record, metrics, log, observability, tracking          |
| 16      | Verify Quality           | `checklist-integration.md` (ENHANCED) | verify, validate, checklist, quality                   |

⭐ **Skill 0 is MANDATORY** - Always analyze service BEFORE generating tests.

**How to Use**:

1. This file tells you the RULES and OVERVIEW
2. When you need DETAILED information about a skill, read the corresponding file from the list above
3. Each skill file contains: PURPOSE, WHEN TO USE, QUICK START, WORKFLOW, EXAMPLES, TROUBLESHOOTING

---

## 🎯 YOUR 16 ENHANCED SKILLS (Patterns You Can Use)

### Skill 0: ANALYZE IMPLEMENTATION (START HERE)

**Triggers**: "analyze", "detect", "service pattern", "action pattern", "read service", "read action", "understand code"

**What**: Read and understand the service OR action file BEFORE generating any tests.

**When**: **ALWAYS FIRST** - Before writing any test code.

**Why**: Determines table structure, query patterns, validation/authorization logic, and correct test approach.

**How**:

```typescript
// Step 1: Read the entire service or action file
// Step 2: Identify the pattern (Service vs Action)
// Step 3: Extract table structure and validation logic
// Step 4: Plan test approach
```

**Service Patterns to Detect**:

1. **Prisma ORM Pattern**:

   ```typescript
   // Look for: prisma.modelName.create(), .findMany(), etc.
   const user = await prisma.user.create({ data: { ... } });

   // Table structure: Defined in schema.prisma
   // Your tests: Use schema.prisma.modelName directly
   ```

2. **Raw SQL Pattern**:

   ```typescript
   // Look for: $queryRaw, $executeRaw, $queryRawUnsafe
   const result = await db.$queryRaw`SELECT * FROM users WHERE id = ${id}`;

   // Table structure: Infer from SQL queries
   // Your tests: Must create table in beforeAll()
   ```

3. **Mixed Pattern**:
   ```typescript
   // Uses both Prisma AND raw SQL
   // Your tests: Create tables, then use appropriate method
   ```

**Table Structure Detection**:

```typescript
// From Raw SQL - Look for INSERT/CREATE statements
INSERT INTO users (id, email, name, "isActive", "createdAt", "updatedAt")
// → Table: users
// → Columns: id (VARCHAR), email (VARCHAR), name (VARCHAR), isActive (BOOLEAN), createdAt (TIMESTAMP), updatedAt (TIMESTAMP)

// From Prisma - Look for model usage
await prisma.user.create({ data: { email, name } })
// → Model: user (lowercase in code, check schema.prisma for actual structure)
```

**ID Generation Detection**:

```typescript
// Look for custom ID patterns
private _generateId(): string {
  return `usr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
// → Your tests must generate IDs the same way OR let service do it
```

3. **Action Patterns**:

   ```typescript
   // Look for: adminProcedure, userProcedure, publicProcedure
   export const createEntityAction = async (input: any) => {
     const { parsedInput, ctx } = await adminProcedure
       .schema(CreateEntitySchema)
       .action(input);

     // Look for: service orchestration
     const result = await ctx.svc.get('entityService').create(parsedInput);

     // Look for: cache invalidation
     if (result.success) {
       revalidatePath('/entities', 'layout');
     }

     return result;
   }

   // → Pattern: Action layer with validation, authorization, service orchestration
   // → Table structure: Indirect through service calls
   // → Your tests: Call action methods, test validation and authorization
   ```

**Action Components to Detect**:

```typescript
// 1. Authorization Procedures
const adminProcedure = createProcedure();     // Admin only
const userProcedure = createProcedure();      // Authenticated users
const publicProcedure = createProcedure();    // Public access

// 2. Validation Schemas (Zod)
const CreateUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1)
});

// 3. Service Factory Usage
const result = await ctx.svc.get('userService').create(parsedInput);

// 4. Cache Invalidation
revalidatePath('/users', 'layout');
```

**Validation Rules Detection**:

```typescript
// Look for validation checks
if (!this._isValidEmail(input.email)) {
  throw new Error("Invalid email format");
}
// → Your error tests must validate these throw errors
```

**Example Analysis**:

```typescript
// Service Code:
class UserService {
  async createUser(input: CreateUserInput): Promise<User> {
    const result = await databaseService.client.$queryRaw<User[]>`
      INSERT INTO users (id, email, name, "isActive", "createdAt", "updatedAt")
      VALUES (${this._generateId()}, ${input.email}, ${
      input.name
    }, true, NOW(), NOW())
      RETURNING *
    `;
    return result[0];
  }
}

// Your Analysis:
// ✅ Pattern: Raw SQL ($queryRaw)
// ✅ Table: users
// ✅ Columns: id, email, name, isActive, createdAt, updatedAt
// ✅ ID: Custom generation (usr_timestamp_random)
// ✅ Required: Create table in beforeAll
// ✅ Test approach: Call service methods (NOT direct SQL in tests)
```

**Action Plan After Analysis**:

```typescript
// 1. Determine table creation DDL
const tableDDL = `
  CREATE TABLE IF NOT EXISTS "\${schema.schemaName}".users (
    id VARCHAR(255) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW()
  )
`;

// 2. Plan unique data generation
const uniqueEmail = `test_${Date.now()}_${Math.random()
  .toString(36)
  .substr(2, 9)}@example.com`;

// 3. Identify error scenarios from validation
// - Duplicate email (unique constraint)
// - Invalid email format (validation)
// - Missing required fields (NOT NULL)
// - Non-existent ID (UPDATE/DELETE)
```

**⚠️ NEVER Skip This Step**:

- Don't assume table structure
- Don't hardcode table names without checking
- Don't guess column types
- Don't assume Prisma when service uses raw SQL

---

### Skill 1: ACCESS INFRASTRUCTURE

**Triggers**: "access", "infrastructure", "containers", "logger", "initialize"

**What**: Get the shared infrastructure singleton containing everything you need.

**When**: First line of every test.

**File**: `docs/agents/integration-agent/skills/infrastructure-singleton.md`

**How**:

```typescript
const infra = await getInfrastructure();
// { containers, schemas, logger, memoryManager }
```

**Examples**:

```typescript
// Access containers
const { postgres, redis } = infra.containers;

// Access logger
infra.logger.log("Test started");

// Access all schemas
const allSchemas = await getSchemasByService("auth");
```

---

### Skill 2: PLACE TEST FILE

**Triggers**: "place", "file location", "naming", "where to put", "test file"

**What**: Determine the correct location and naming for your test file.

**When**: Before generating any test.

**File**: `docs/agents/integration-agent/skills/orchestrator-pattern.md`

**Location**: `src/__tests__/microservices/<service>-<feature>.test.ts`

**Examples**:

```
src/__tests__/microservices/auth-login.test.ts
src/__tests__/microservices/auth-registration.test.ts
src/__tests__/microservices/payment-process.test.ts
src/__tests__/microservices/inventory-stock.test.ts
src/__tests__/microservices/analytics-events.test.ts
src/__tests__/microservices/notification-email.test.ts
```

**Pattern**: `<service>-<feature>.test.ts`

---

### Skill 3: SELECT SCHEMA

**Triggers**: "select", "schema", "database", "pick", "random"

**What**: Pick a random database schema for the service being tested.

**When**: In every test that does database operations.

**File**: `docs/agents/integration-agent/skills/schema-selection.md`

**How**:

```typescript
const schemas = await getSchemasByService("auth");
const schema = schemas[Math.floor(Math.random() * schemas.length)];
// Returns: { prisma, schemaName }
```

**Services**: auth, payment, inventory, analytics, notification

---

### Skill 4: PERFORM CRUD OPERATIONS

**Triggers**: "create", "read", "update", "delete", "CRUD", "query", "fetch"

**What**: Create, read, update, delete data via Prisma client.

**When**: Multiple times per test (the core of your test).

**File**: `docs/agents/integration-agent/skills/prisma-crud-patterns.md`

**How**:

```typescript
// CREATE
const user = await schema.prisma.user.create({
  data: { email: "test@example.com", name: "Test User" }
});

// READ
const user = await schema.prisma.user.findUnique({ where: { id: 1 } });
const users = await schema.prisma.user.findMany({ where: { role: "admin" } });

// UPDATE
const updated = await schema.prisma.user.update({
  where: { id: 1 },
  data: { role: "user" }
});

// DELETE
await schema.prisma.user.delete({ where: { id: 1 } });

// COUNT
const count = await schema.prisma.user.count({ where: { ... } });
```

**Always**: Use `schema.prisma` from the selected schema object.

---

### Skill 5: GENERATE TEST DATA

**Triggers**: "generate", "data", "factory", "realistic", "fixtures", "create data"

**What**: Generate realistic test data (don't hardcode).

**When**: Before creating any database record.

**File**: `docs/agents/integration-agent/skills/test-data-factories.md`

**How**:

```typescript
const userData = generateTestData("user");
const sessionData = generateTestData("session");
const transactionData = generateTestData("transaction");
```

**Data Types**:

- "user" → { email, name, role, password }
- "session" → { token, userId, expiresAt }
- "transaction" → { amount, type, status }
- "payment" → { amount, currency, method }
- "order" → { items, total, status }
- "product" → { name, price, sku }
- "coupon" → { code, discount, expiry }
- "notification" → { type, message, recipient }

---

### Skill 6: INCLUDE REALISTIC DELAYS

**Triggers**: "delay", "timing", "production", "race condition", "timeout"

**What**: Add realistic timing to simulate production operations.

**When**: Every test should verify execution time.

**File**: `docs/agents/integration-agent/skills/production-delays.md`

**How**:

```typescript
const executionTime = await simulateProductionOperation();
expect(executionTime).toBeGreaterThan(0);
expect(executionTime).toBeLessThan(12000);
```

**Distribution**:

- 70% < 500ms (fast queries)
- 20% 500-2000ms (medium operations)
- 10% 2000-10000ms (slow operations)

---

### Skill 7: TEST ERROR SCENARIOS

**Triggers**: "error", "validation", "constraint", "not found", "P2002", "P2003", "P2025"

**What**: Test error cases and edge conditions.

**When**: 3-4 of your 10 tests should be error scenarios.

**File**: `docs/agents/integration-agent/skills/error-handling-testing.md`

**How**:

```typescript
// Test validation error
try {
  await schema.prisma.user.create({ data: { email: "invalid" } });
  expect.fail("Should have thrown error");
} catch (error) {
  expect(error.code).toBe("P2023"); // Validation
}

// Test not found (P2025)
try {
  await schema.prisma.user.delete({ where: { id: 99999 } });
  expect.fail("Should have thrown not found");
} catch (error) {
  expect(error.code).toBe("P2025");
}

// Test unique constraint (P2002)
try {
  await schema.prisma.user.create({ data: { email: "existing@test.com" } });
  expect.fail("Should have thrown unique constraint");
} catch (error) {
  expect(error.code).toBe("P2002");
}
```

**Error Codes**:

- P2002 = Unique constraint violation
- P2003 = Foreign key constraint violation
- P2025 = Record not found
- P2023 = Validation error

---

### Skill 8: TEST MULTI-SERVICE FLOWS

**Triggers**: "multi-service", "cross-service", "cross-domain", "interaction", "workflow"

**What**: Test workflows spanning multiple services.

**When**: Optional; 0-2 tests for cross-service scenarios.

**File**: `docs/agents/integration-agent/skills/multi-service-testing.md`

**How**:

```typescript
// Create user in auth
const authSchemas = await getSchemasByService("auth");
const authSchema = authSchemas[Math.floor(Math.random() * authSchemas.length)];
const user = await authSchema.prisma.user.create({ data: userData });

// Create payment account in payment using user.id
const paymentSchemas = await getSchemasByService("payment");
const paymentSchema =
  paymentSchemas[Math.floor(Math.random() * paymentSchemas.length)];
const account = await paymentSchema.prisma.paymentAccount.create({
  data: { userId: user.id, accountNumber: "..." },
});

// Verify relationship
expect(account.userId).toBe(user.id);
```

---

### Skill 9: RECORD TEST METRICS

**Triggers**: "record", "metrics", "log", "observability", "tracking", "execution"

**What**: Log execution metrics and performance data.

**When**: Last line of every test.

**File**: `docs/agents/integration-agent/skills/test-execution-recording.md`

**How**:

```typescript
await recordTestExecution(
  "auth-login", // file name
  "valid-credentials", // operation name
  "success", // status: "success" or "failure"
  executionTime, // milliseconds
  { testNumber: 1, schema: schema.schemaName } // metadata
);
```

---

### Skill 10: VERIFY TEST QUALITY

**Triggers**: "verify", "validate", "checklist", "quality check", "before generating"

**What**: Validate test structure and coverage.

**When**: Before returning any test to the user.

**File**: `docs/agents/integration-agent/skills/checklist-integration.md`

**Checklist**:

- [x] File location: `src/__tests__/microservices/<service>-<feature>.test.ts`
- [x] Exactly 10 tests
- [x] Test naming: `[Test 1/10]` through `[Test 10/10]`
- [x] Uses `getInfrastructure()` at start
- [x] Uses `getSchemasByService()` to pick schema
- [x] Uses Prisma for all operations
- [x] Includes realistic delays (50-10000ms)
- [x] Has error scenarios (3-4 tests)
- [x] Records test execution with `recordTestExecution()`
- [x] No external API calls
- [x] No service code changes
- [x] All tests pass
- [x] No console warnings

---

## 📊 ENHANCED TEST GENERATION FLOW (Self-Healing)

When user asks you to generate a test, follow this step-by-step:

```
⭐ Step 0: ANALYZE IMPLEMENTATION (MANDATORY - DO THIS FIRST!)
  → READ THE SERVICE OR ACTION FILE COMPLETELY
  → **For Services**: Detect implementation pattern (Prisma ORM vs Raw SQL vs Mixed)
  → **For Actions**: Detect validation schemas, authorization procedures, service orchestration
  → Extract table structure from code (columns, types, constraints)
  → Identify ID generation logic (custom vs auto-increment)
  → **For Actions**: Identify validation rules and authorization levels
  → Find validation rules and error conditions
  → Determine what operations the service/action provides
  ❗ CRITICAL: Don't skip this - everything else depends on it

Step 1: VERIFY IMPORTS (CRITICAL - Prevent Import Errors)
  → Test location: src/__tests__/microservices/<name>.test.ts
  → Service imports: ../../services/YourService
  → Infrastructure: ../shared/testInfrastructure (getInfrastructure, getSchemasByService, recordTestExecution)
  → Helpers: ../shared/testHelpers (simulateProductionOperation, generateTestData)
  → ALL paths MUST be RELATIVE (never use @/ aliases)

Step 2: place-test-file
  → Location: src/__tests__/microservices/<service>-<feature>.test.ts
  → Example: user-service.test.ts, auth-login.test.ts

Step 3: access-infrastructure
  → const infra = await getInfrastructure();
  → Returns: { containers, schemas, logger, memoryManager }

Step 4: select-schema
  → const schemas = await getSchemasByService("auth"); // or payment, inventory, etc.
  → const schema = schemas[Math.floor(Math.random() * schemas.length)];
  → Returns: { prisma: PrismaClient, schemaName: string }

Step 5: create-dynamic-schema (IF Raw SQL detected in Step 0)
  → Create tables in beforeAll using schema analysis from Step 0
  → await schema.prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "${schema.schemaName}".tablename (...)`)
  → Include ALL columns with correct types and constraints

Step 6: generate-intelligent-test-data
  → Use timestamps for uniqueness: `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}@example.com`
  → Never hardcode: "test@example.com" (will cause duplicates)
  → Follow ID generation pattern from Step 0 analysis
  → For actions: Generate test data that passes validation schemas

Step 7: write-test-code (10 tests total)
  → **For Services**: 6-7 happy path tests (create, read, update, delete, count, etc.)
  → **For Actions**: 6-7 happy path tests (valid inputs, authorization levels, orchestration)
  → **For Services**: 3-4 error tests (duplicate, not found, validation, constraint)
  → **For Actions**: 3-4 error tests (validation errors, authorization failures, service errors)
  → Call SERVICE METHODS (for services) OR ACTION METHODS (for actions)
  → Follow service/action's actual behavior

Step 8: include-realistic-delays
  → const executionTime = await simulateProductionOperation();
  → expect(executionTime).toBeGreaterThan(0);
  → expect(executionTime).toBeLessThan(12000);

Step 9: database-aware-error-handling
  → Test error MESSAGES, not just codes: expect(error.message).toContain("already exists")
  → Codes vary by database - messages are more reliable
  → **For Actions**: Test validation error messages and authorization error messages

Step 9.5: action-specific-testing (NEW - ONLY for Actions)
  → Test validation schemas with invalid data
  → Test authorization procedures with different user roles
  → Test service orchestration (verify underlying services are called)
  → Test cache invalidation if present
  → Test error formatting and response structure

Step 11: record-test-metrics (EXACT signature)
  → await recordTestExecution(
      testType: string,        // "user-service"
      testName: string,        // "Create user"
      testResult: string,      // "success" or "failure"
      executionTimeMs: number, // duration variable
      metadata?: any           // { testNumber: 1, schema: schema.schemaName }
    );
  → Order: Type → Name → Result → Time → Meta

Step 12: verify-test-quality
  → Check all imports are correct (relative paths)
  → Check recordTestExecution has correct parameter order
  → Check table creation if raw SQL
  → Check unique test data generation
  → All 10 tests present with [Test X/10] naming
```

**⚠️ COMMON PITFALLS TO AVOID:**

1. ❌ Skipping Step 0 (service analysis)
2. ❌ Using @/ import aliases instead of relative paths
3. ❌ Wrong recordTestExecution parameter order
4. ❌ Forgetting to create tables for raw SQL services
5. ❌ Hardcoding test data (causes duplicates)
6. ❌ Calling raw SQL in tests instead of service methods
7. ❌ **NEW**: Importing unused helpers/types (e.g., `generateTestData`, `User` type)
8. ❌ **NEW**: Declaring but never using variables (e.g., `infra`)
9. ❌ **NEW**: Manual data generation instead of using available helpers
10. ❌ **NEW**: Not following DRY principles for timing/error handling

---

### 🆕 Skill 4: ANALYZE SERVICE (NEW)

**Triggers**: "analyze service", "detect patterns", "understand implementation", "service discovery"

**What**: Automatically detect service implementation patterns (Prisma vs raw SQL vs ORM).

**When**: **NEW - First step** before generating any tests.

**File**: `docs/agents/integration-agent/skills/service-analysis.md`

**How**:

```typescript
// Analyze service patterns
const servicePattern = await analyzeServicePattern(serviceFilePath);
// Returns: { queryMethod: 'raw-sql', tables: ['users'], constraints: [...] }
```

**Examples**:

```typescript
// Detects UserService uses raw SQL
const pattern = analyzeServicePattern("./src/services/UserService.ts");
// pattern.queryMethod = 'raw-sql'
// pattern.tableOperations = ['INSERT INTO users', 'SELECT FROM users']
```

---

### 🆕 Skill 5: CREATE DYNAMIC SCHEMA (NEW)

**Triggers**: "create tables", "setup schema", "prepare database", "dynamic schema"

**What**: Dynamically create required database tables based on service analysis.

**When**: **NEW - After service analysis**, before any database operations.

**File**: `docs/agents/integration-agent/skills/dynamic-schema-creation.md`

**How**:

```typescript
// Create tables based on detected patterns
await createRequiredTables(servicePattern, schema);
// Automatically handles: CREATE TABLE, constraints, indexes
```

**Examples**:

```typescript
// Creates users table for UserService
await createUsersTable(schema, {
  id: "VARCHAR(255) PRIMARY KEY",
  email: "VARCHAR(255) UNIQUE NOT NULL",
  // ... other fields
});
```

---

### 🆕 Skill 6: PERFORM DATABASE OPERATIONS (ENHANCED)

**Triggers**: "database operations", "CRUD", "query", "insert", "select", "update", "delete"

**What**: Perform CRUD operations using the detected method (Prisma OR raw SQL).

**When**: Core database operations in tests.

**File**: `docs/agents/integration-agent/skills/database-operations.md`

**How**:

```typescript
// Uses detected method automatically
const result = await performDatabaseOperation({
  type: "INSERT",
  table: "users",
  data: userData,
  method: servicePattern.queryMethod, // 'prisma' or 'raw-sql'
});
```

**Examples**:

```typescript
// Raw SQL (for UserService)
await schema.prisma.$queryRawUnsafe(`
  INSERT INTO "${schema.schemaName}".users
  (id, email, name, "isActive", "createdAt", "updatedAt")
  VALUES ('${userId}', '${email}', '${name}', true, NOW(), NOW())
`);

// Prisma (for other services)
await schema.prisma.user.create({ data: userData });
```

---

### 🆕 Skill 7: GENERATE INTELLIGENT TEST DATA (ENHANCED)

**Triggers**: "generate data", "test data", "create fixtures", "smart data"

**What**: Generate conflict-free, realistic test data with uniqueness guarantees.

**When**: Before creating any test records.

**File**: `docs/agents/integration-agent/skills/intelligent-test-data.md`

**How**:

```typescript
// Generate unique, conflict-free data
const userData = await generateSmartTestData("user", {
  scope: "test-file",
  uniqueness: "global",
  constraints: ["email_unique"],
});
```

**Examples**:

```typescript
// Auto-generates unique emails with timestamps
const userData = generateSmartTestData("user");
// Returns: { email: "user_1734039456789@example.com", ... }

// Tracks used values across all tests
const dataTracker = new TestDataTracker();
dataTracker.ensureUnique("email", generatedEmail);
```

---

### 🆕 Skill 9: DATABASE-AWARE ERROR HANDLING (NEW)

**Triggers**: "database errors", "error handling", "constraint violations", "error codes"

**What**: Handle database-specific error behaviors and codes correctly.

**When**: Testing error scenarios and constraint violations.

**File**: `docs/agents/integration-agent/skills/database-error-handling.md`

**How**:

```typescript
// Database-specific error mapping
const expectedError = getDatabaseErrorMapping({
  database: "postgresql",
  operation: "duplicate_insert",
  constraint: "unique",
});
// Returns: { code: 'P2010', message: 'Unique constraint violation' }
```

**Examples**:

```typescript
// Knows PostgreSQL behavior
try {
  await duplicateInsert();
} catch (error) {
  expect(error.code).toBe("P2010"); // PostgreSQL unique constraint
  // NOT P2002 (which is for other databases/ORMs)
}
```

---

### 🆕 Skill 11: PATTERN-BASED GENERATION (NEW)

**Triggers**: "use template", "pattern-based", "service-specific", "follow pattern"

**What**: Use pre-defined templates for common service patterns.

**When**: When generating tests for standard service types.

**File**: `docs/agents/integration-agent/skills/pattern-templates.md`

**How**:

```typescript
// Select template based on detected pattern
const template = selectServiceTemplate(servicePattern);
const tests = generateFromTemplate(template, serviceData);
```

**Examples**:

```typescript
// CRUD Service Template (UserService, ProductService)
const crudTemplate = {
  setup: "createUsersTable",
  operations: [
    "create",
    "readById",
    "readByEmail",
    "update",
    "delete",
    "count",
  ],
  errorTests: ["duplicateEmail", "notFound", "updateNonExistent"],
};

// Auth Service Template
const authTemplate = {
  setup: "createAuthTables",
  operations: ["register", "login", "validateToken", "refreshToken"],
  errorTests: ["invalidCredentials", "expiredToken", "duplicateUser"],
};
```

---

### 🆕 Skill 12: SELF-HEALING TESTS (NEW)

**Triggers**: "fix tests", "auto-correct", "heal tests", "resolve issues"

**What**: Automatically detect and fix common test issues during generation.

**When**: **NEW - After initial test generation**, before returning results.

**File**: `docs/agents/integration-agent/skills/auto-correction.md`

**How**:

```typescript
// Auto-fix common issues
const correctedTests = await selfHealTests(generatedTests, {
  fixDataTypes: true,
  adjustErrorCodes: true,
  resolveConflicts: true,
  validateAssertions: true,
});
```

**Examples**:

```typescript
// Fixes: string "undefined" -> actual values
// Fixes: wrong error codes (P2002 -> P2010 for PostgreSQL)
// Fixes: data conflicts by regenerating with uniqueness
// Fixes: assertion mismatches based on actual database behavior
```

---

### 🆕 Skill 13: TEST ACTIONS (NEW)

**Triggers**: "action", "validation", "authorization", "procedure", "schema", "orchestration"

**What**: Test the top-layer Action pattern with validation, authorization, and service orchestration.

**When**: Testing actions (the entry point for external interactions).

**File**: `docs/agents/integration-agent/skills/action-testing-patterns.md`

**How**:

```typescript
// Test action with validation and authorization
await testAction("createUserAction", {
  input: { email: "test@example.com", name: "Test" },
  expectedValidation: true,
  expectedAuth: "admin",
  expectServiceCall: "userService.create"
});
```

**Examples**:

```typescript
// Test validation errors
const result = await createUserAction({ email: "invalid" });
expect(result.success).toBe(false);
expect(result.errors).toContain("Invalid email format");

// Test authorization
const result = await adminOnlyAction({ data: "test" });
expect(result.success).toBe(false);
expect(result.errors).toContain("Insufficient permissions");

// Test service orchestration
const result = await createEntityAction({ name: "Test" });
expect(result.success).toBe(true);
// Verifies underlying service was called
```

---

### 🆕 Skill 14: ACTION PATTERN ANALYSIS (NEW)

**Triggers**: "analyze action", "detect validation", "authorization patterns", "action discovery"

**What**: Analyze action files to detect validation schemas, authorization procedures, and service orchestration patterns.

**When**: **NEW - First step** when testing actions (instead of services).

**File**: `docs/agents/integration-agent/skills/action-pattern-analysis.md`

**How**:

```typescript
// Analyze action patterns
const actionPattern = await analyzeActionPattern(actionFilePath);
// Returns: {
//   validation: "zod",
//   authorization: "adminProcedure",
//   services: ["userService"],
//   cacheInvalidation: true
// }
```

**Examples**:

```typescript
// Detects CreateUserAction uses Zod validation
const pattern = analyzeActionPattern("./src/services/users/actions.ts");
// pattern.validation = "zod"
// pattern.schemas = ["CreateUserSchema", "UpdateUserSchema"]
// pattern.authorization = "adminProcedure"
// pattern.services = ["userService"]
```

---

### 🆕 Skill 15: OPTIMIZE IMPORTS & CODE QUALITY (NEW)

**Triggers**: "optimize imports", "code quality", "unused imports", "clean code"

**What**: Ensure only necessary imports are included and code follows clean practices.

**When**: **MANDATORY - During test generation and final validation**

**File**: `docs/agents/integration-agent/skills/code-quality-optimization.md`

**How**:

```typescript
// Validate imports are actually used
const usedImports = analyzeImports(testCode);
// Remove: generateTestData if not used
// Remove: User type if only using CreateUserInput/UpdateUserInput
// Remove: infra if never referenced after initialization

// Use available helpers properly
const userData = generateTestData("user"); // If available
// OR manual generation with helper functions
const uniqueEmail = generateUniqueEmail(); // Custom helper

// Optimize repetitive code
const testWrapper = createTestWrapper("user-service");
// Reuse timing/error handling patterns
```

**Import Optimization Rules**:

```typescript
// ✅ CORRECT - Only import what you use
import { userService } from "../../services/UserService";
import type { CreateUserInput, UpdateUserInput } from "../../services/UserService";
// Note: Don't import User type if you only use CreateUserInput/UpdateUserInput

// ✅ CORRECT - Use helpers or custom functions
import {
  simulateProductionOperation,
  // generateTestData, // Only import if ACTUALLY used
} from "../shared/testHelpers";

// ✅ CORRECT - Remove unused infrastructure variable
// const infra = await getInfrastructure(); // If never used
// INSTEAD: Call directly in beforeAll if needed only there
await getInfrastructure(); // Direct call if only used in beforeAll
```

**Code Quality Rules**:

```typescript
// ✅ CORRECT - Use available helpers
const userData = generateTestData("user");
// OR create dedicated helper functions
const uniqueEmail = () => `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}@example.com`;

// ✅ CORRECT - DRY principles for common patterns
const executeWithTiming = async (testName: string, testFn: () => Promise<any>) => {
  const startTime = Date.now();
  try {
    const result = await testFn();
    const executionTime = Date.now() - startTime;
    await recordTestExecution("user-service", testName, "success", executionTime);
    return result;
  } catch (error) {
    const executionTime = Date.now() - startTime;
    await recordTestExecution("user-service", testName, "failure", executionTime);
    throw error;
  }
};
```

---

### 🆕 Skill 16: ACTION INPUT TYPE HANDLING (NEW)

**Triggers**: "ActionInput types", "string vs object", "database context", "action input", "type mismatch"

**What**: Handle the complex type system of ActionInput<T> where T can be string, object, or union types with database context.

**When**: **CRITICAL - When testing actions** that use ActionInput<T> with different input types.

**File**: `docs/agents/integration-agent/skills/action-input-types.md`

**How**:

```typescript
// ActionInput type understanding:
type ActionInput<T> = T & { database?: any };

// ✅ CORRECT - Object inputs with database context
const createActionCall = async <T>(action: (input: T) => Promise<any>, input: T) => {
  const inputWithContext = {
    ...input,
    database: schema.prisma
  };
  return action(inputWithContext);
};

// ✅ CORRECT - String inputs with database context
const callStringAction = async (action: (input: string) => Promise<any>, userId: string) => {
  // For string inputs, the action expects string + database context
  const stringInput = userId as any;
  stringInput.database = schema.prisma;
  return action(stringInput);
};

// ✅ CORRECT - Import proper types from actions
import type { CreateUserInput, UpdateUserInput, UserIdInput, UserFiltersInput } from "../../services/actions";
```

**Common Action Input Patterns**:

```typescript
// 1. Object inputs (Create/Update)
await createUserAction({ email, name, database: prisma }); // CreateUserInput + database
await updateUserAction({ id, name, database: prisma }); // UpdateUserInput + { id } + database

// 2. String inputs (Get/Delete)
await getUserByIdAction(userIdWithDatabase); // string + database context
await deleteUserAction(userIdWithDatabase); // string + database context

// 3. Filter inputs (List/Search)
await getAllUsersAction({ page, limit, sortBy: 'createdAt', database: prisma });
await searchUsersAction({ search, page, limit, database: prisma });
```

**Common Type Issues & Solutions**:

```typescript
// ❌ ERROR - Expected string, received object
await getUserByIdAction({ id: userId, database: prisma });

// ✅ CORRECT - Pass string with database context as property
const userIdWithContext = userId as any;
userIdWithContext.database = prisma;
await getUserByIdAction(userIdWithContext);

// ❌ ERROR - Wrong enum types
const filters = { sortBy: 'createdAt', sortOrder: 'desc' }; // string instead of const

// ✅ CORRECT - Use 'as const' for enum types
const filters = { sortBy: 'createdAt' as const, sortOrder: 'desc' as const };
```

**Examples**:

```typescript
// Create action input helper
const createActionCall = async <T>(action: (input: T) => Promise<any>, input: T, database: any) => {
  if (typeof input === 'string') {
    const stringInput = input as any;
    stringInput.database = database;
    return action(stringInput);
  } else {
    const inputWithContext = { ...input, database };
    return action(inputWithContext);
  }
};

// Usage in tests
const userData = { email: 'test@example.com', name: 'Test' };
await createActionCall(createUserAction, userData, schema.prisma);

const userId = 'user-123';
await createActionCall(getUserByIdAction, userId, schema.prisma);
```

---

### 🆕 Skill 17: ACTION INFRASTRUCTURE SIMPLIFICATION (NEW)

**Triggers**: "infrastructure errors", "missing database", "test setup", "simplify tests", "focus on validation"

**What**: Create simplified tests that focus on action validation and logic without complex infrastructure dependencies.

**When**: **When infrastructure setup fails** or when you want to test action patterns quickly.

**File**: `docs/agents/integration-agent/skills/action-simplified-testing.md`

**How**:

```typescript
// Focus on validation and schema compliance
describe("User Actions Validation Tests", () => {
  it("Should validate email format", async () => {
    const invalidUserData = { email: 'invalid-email', name: 'Test' };

    // This should throw validation error, not database error
    await expect(createUserAction(invalidUserData)).rejects.toThrow(/validation|email/i);
  });

  it("Should accept valid input format", async () => {
    const validUserData = {
      email: `test_${Date.now()}@example.com`,
      name: 'Test User'
    };

    // Should pass validation (might fail on database, which is OK)
    try {
      await createUserAction(validUserData);
    } catch (error) {
      expect((error as Error).message).not.toContain('validation');
    }
  });
});
```

**Simplified Testing Strategy**:

```typescript
// 1. Test validation first (infrastructure-independent)
it("Validates required fields", async () => {
  await expect(createUserAction({ name: 'Test' })).rejects.toThrow(/email.*required/i);
  await expect(createUserAction({ email: 'test@test.com' })).rejects.toThrow(/name.*required/i);
});

// 2. Test type safety
it("Accepts correct enum types", async () => {
  const filters = {
    sortBy: 'createdAt' as const,
    sortOrder: 'desc' as const
  };

  // Should not throw type errors
  await getAllUsersAction(filters);
});

// 3. Test action pattern structure
it("Action returns expected structure", async () => {
  try {
    const result = await createUserAction({ email: 'test@test.com', name: 'Test' });
    // If it reaches here, action structure is working
    expect(typeof result.success).toBe('boolean');
  } catch (error) {
    // Should be database/infrastructure error, not validation error
    expect((error as Error).message).not.toContain('validation');
  }
});
```

**Benefits of Simplified Testing**:

- ✅ **Fast validation feedback** - Catch schema issues immediately
- ✅ **Type safety verification** - Ensure TypeScript types are correct
- ✅ **Action pattern testing** - Verify action structure works
- ✅ **Infrastructure independence** - Tests work without database setup
- ✅ **CI/CD friendly** - Quick feedback loops

---

### 🆕 Skill 18: ACTION DATABASE CONTEXT INJECTION (NEW)

**Triggers**: "database context", "ActionInput database", "pass database to action", "context injection"

**What**: Understand and implement the correct way to pass database context to actions for testing.

**When**: **When testing actions** that need database access in test environment.

**File**: `docs/agents/integration-agent/skills/action-database-context.md`

**How**:

```typescript
// Understanding ActionInput<T> = T & { database?: any }

// ✅ CORRECT - Object inputs with database
const userWithDatabase = {
  email: 'test@example.com',
  name: 'Test',
  database: schema.prisma  // This gets extracted in action procedure
};

// ✅ CORRECT - String inputs with database (tricky!)
const userIdWithDatabase = 'user-123' as any;
userIdWithDatabase.database = schema.prisma;

// ✅ CORRECT - Create helper function
const withDatabase = <T>(input: T, database: any): T & { database: any } => {
  if (typeof input === 'string') {
    const stringInput = input as any;
    stringInput.database = database;
    return stringInput;
  }
  return { ...input, database };
};

// Usage
await createUserAction(withDatabase(userData, schema.prisma));
await getUserByIdAction(withDatabase(userId, schema.prisma));
```

**Database Context Extraction in Actions**:

```typescript
// In action procedure (from actions.ts)
const createProcedure = () => ({
  schema: <T>(schema: z.ZodSchema<T>) => ({
    action: async (input: ActionInput<T>) => {
      // Extract database from input
      const { database, ...cleanInput } = input;

      // Set up server context
      const serverCtx: ServerCtxType = {
        accountUserId: 1,
        userRole: 'admin',
        database: database, // Pass through to services
      };

      // Validate clean input (without database)
      const parsedInput = schema.parse(cleanInput);

      return { parsedInput, ctx: { svc: serviceFactory } };
    },
  }),
});
```

**Testing Patterns**:

```typescript
// Pattern 1: Direct injection
const testAction = async (action: Function, input: any) => {
  return action({ ...input, database: schema.prisma });
};

// Pattern 2: Helper wrapper
const createActionWrapper = (action: Function) => {
  return async (input: any) => {
    if (typeof input === 'string') {
      const stringInput = input as any;
      stringInput.database = schema.prisma;
      return action(stringInput);
    }
    return action({ ...input, database: schema.prisma });
  };
};

// Pattern 3: Type-safe wrapper
const withTestDatabase = <T extends Record<string, any>>(
  input: T,
  database: any
): T & { database: any } => ({ ...input, database });

// Usage examples
await testAction(createUserAction, { email: 'test@test.com', name: 'Test' });
await testAction(getUserByIdAction, 'user-123');
```

**Common Pitfalls**:

```typescript
// ❌ WRONG - Adding database property to string doesn't work
const userId = 'user-123';
userId.database = schema.prisma; // Error: Property 'database' does not exist on type 'string'

// ❌ WRONG - Wrapping string in object changes the type
await getUserByIdAction({ value: 'user-123', database: schema.prisma }); // Expected string, got object

// ✅ CORRECT - Type assertion for database context
const userIdWithContext = 'user-123' as any;
userIdWithContext.database = schema.prisma;
await getUserByIdAction(userIdWithContext);

// ✅ CORRECT - Use helper that handles types properly
const result = await withDatabase(getUserByIdAction, 'user-123', schema.prisma);
```

**Common Issues to Fix**:

1. **Unused Type Imports**: Remove `User` if only using interfaces
2. **Unused Helper Imports**: Remove `generateTestData` if using manual generation
3. **Unused Variables**: Remove `infra` if never referenced after initialization
4. **Repetitive Patterns**: Extract common timing/error handling into reusable patterns
5. **Manual vs Helper Usage**: Prefer available helpers over manual implementations

### 🆕 Action-Specific Issues (NEW)

6. **ActionInput Type Mismatch**:
   - ❌ `await getUserByIdAction({ id: userId })` (Expected string, got object)
   - ✅ `await getUserByIdAction(userIdWithContext)` (String with database context)

7. **String Database Context**:
   - ❌ `userId.database = schema.prisma` (Property doesn't exist on string)
   - ✅ `const userIdWithContext = userId as any; userIdWithContext.database = schema.prisma`

8. **Enum Type Assertions**:
   - ❌ `{ sortBy: 'createdAt', sortOrder: 'desc' }` (string instead of const)
   - ✅ `{ sortBy: 'createdAt' as const, sortOrder: 'desc' as const }`

9. **Import Types from Correct Source**:
   - ❌ `import type { User } from '../../services/UserService'`
   - ✅ `import type { CreateUserInput, UpdateUserInput } from '../../services/actions'`

10. **Infrastructure Dependencies**:
    - ❌ Tests fail due to missing database setup
    - ✅ Create simplified validation tests that work without infrastructure

11. **Database Context Injection**:
    - ❌ Not passing database context in ActionInput
    - ✅ Use helper functions to inject database context correctly

---

## 🔍 QUICK REFERENCE: TRIGGER WORDS TO SKILLS

| Trigger Words                                                       | Skill                                         |
| ------------------------------------------------------------------- | --------------------------------------------- |
| **⭐ ALWAYS START: analyze, detect, read service, understand code** | **Skill 0**: Analyze Service ⭐ MANDATORY       |
| access, infrastructure, containers, logger, initialize              | **Skill 1**: Access Infrastructure            |
| place, file, location, naming, where                                | **Skill 2**: Place Test File                  |
| select, schema, database, pick, random                              | **Skill 3**: Select Schema                    |
| create tables, setup schema, prepare database, dynamic schema       | **Skill 4**: Create Dynamic Schema            |
| database operations, CRUD, query, insert, select, update, delete    | **Skill 5**: Perform Database Operations      |
| generate unique data, avoid conflicts, smart data factory           | **Skill 6**: Generate Intelligent Test Data   |
| delay, timing, production, race, timeout                            | **Skill 7**: Include Delays                   |
| database errors, constraint violations, specific error codes        | **Skill 8**: Database-Aware Error Handling    |
| error, validation, constraint, not found, edge cases                | **Skill 9**: Test Error Scenarios             |
| use template, pattern-based, service-specific, follow pattern       | **Skill 10**: Pattern-Based Generation        |
| fix failing tests, auto-correct, self-healing, resolve issues       | **Skill 11**: Self-Healing Tests              |
| multi-service, cross-service, cross-domain, interaction             | **Skill 12**: Test Multi-Service              |
| record, metrics, log, observability, tracking                       | **Skill 13**: Record Metrics                  |
| verify, validate, checklist, quality, before                        | **Skill 14**: Verify Quality                  |
| optimize imports, code quality, unused imports, clean code          | **Skill 15**: Optimize Imports & Code Quality |
| ActionInput types, string vs object, database context, type mismatch | **Skill 16**: Action Input Type Handling      |
| infrastructure errors, missing database, simplify tests, focus validation | **Skill 17**: Action Infrastructure Simplification |
| database context, ActionInput database, pass database to action      | **Skill 18**: Action Database Context Injection |

---

## 📝 EXAMPLE: Generate Action Test

**User says**: "Generate integration test for user actions (createUserAction, validation, authorization, service orchestration)"

**You do**:

1. **analyze-implementation**: Detect this is an action file with Zod validation and adminProcedure

2. **action-input-types**: Understand ActionInput<T> = T & { database?: any } and different input patterns

3. **place-test-file**: Create file `src/__tests__/microservices/user-actions.test.ts`

4. **access-infrastructure**: Get infra at start of tests

5. **select-schema**: Pick random auth schema

6. **create-dynamic-schema**: Create tables based on service requirements

7. **import-action-types**: Import proper types from actions file
   ```typescript
   import type { CreateUserInput, UpdateUserInput, UserIdInput, UserFiltersInput } from "../../services/actions";
   ```

8. **create-action-helper**: Handle different ActionInput types
   ```typescript
   const createActionCall = async <T>(action: (input: T) => Promise<any>, input: T, database: any) => {
     if (typeof input === 'string') {
       const stringInput = input as any;
       stringInput.database = database;
       return action(stringInput);
     } else {
       return action({ ...input, database });
     }
   };
   ```

9. **generate-test-data**: Create realistic user data that passes validation

10. **write-test-code** (10 tests total):

    **Happy Path Tests (6-7)**:
    - Valid input with admin authorization
    - Valid input with correct schema validation
    - Service orchestration working correctly
    - Cache invalidation after success
    - Proper response formatting

    **Error Tests (3-4)**:
    - Invalid email format (validation error)
    - Missing required fields (validation error)
    - Insufficient permissions (authorization error)
    - Service layer error propagation

11. **handle-different-input-types**:
    ```typescript
    // Object inputs
    await createActionCall(createUserAction, { email, name }, schema.prisma);

    // String inputs
    await createActionCall(getUserByIdAction, userId, schema.prisma);

    // Enum types with 'as const'
    const filters = { sortBy: 'createdAt' as const, sortOrder: 'desc' as const };
    await createActionCall(getAllUsersAction, filters, schema.prisma);
    ```

12. **action-specific-testing**: Test validation schemas, authorization procedures, service orchestration

13. **include-realistic-delays**: Add timing assertions

14. **record-test-metrics**: Log execution of each test

15. **verify-test-quality**: Ensure all 10 tests pass

**Output**: Complete test file with 10 tests ✅

---

## 🆕 NEW: Action Testing Quick Reference

**When user asks for action tests, follow this pattern**:

### Step 1: Import Action Types
```typescript
import type { CreateUserInput, UpdateUserInput, UserIdInput, UserFiltersInput } from "../../services/actions";
```

### Step 2: Create Action Helper
```typescript
const withDatabase = <T>(input: T, database: any): T & { database: any } => {
  if (typeof input === 'string') {
    const stringInput = input as any;
    stringInput.database = database;
    return stringInput;
  }
  return { ...input, database };
};
```

### Step 3: Handle Different Input Types
```typescript
// Object inputs (Create/Update)
await createUserAction(withDatabase({ email, name }, schema.prisma));

// String inputs (Get/Delete)
await getUserByIdAction(withDatabase(userId, schema.prisma));

// Filter inputs with enums
const filters = { sortBy: 'createdAt' as const, sortOrder: 'desc' as const };
await getAllUsersAction(withDatabase(filters, schema.prisma));
```

### Step 4: Focus on Validation First
```typescript
// Test validation errors (infrastructure-independent)
it("Validates email format", async () => {
  await expect(createUserAction({ email: 'invalid', name: 'Test' }))
    .rejects.toThrow(/validation|email/i);
});
```

### Step 5: Create 10 Tests (6-7 success, 3-4 errors)
Follow the standard pattern with proper input handling for each action type.

---

## 📝 EXAMPLE: Generate Service Test (Original)

**User says**: "Generate integration test for auth login service (email/password, success + validation errors)"

**You do**:

1. **analyze-implementation**: Detect this is a service with raw SQL patterns

2. **place-test-file**: Create file `src/__tests__/microservices/auth-login.test.ts`

3. **access-infrastructure**: Get infra at start of tests

4. **select-schema**: Pick random auth schema

5. **create-dynamic-schema**: Create users table based on service SQL

6. **generate-test-data**: Create realistic user data

7. **perform-crud-operations**: Create user, attempt login, verify

8. **include-realistic-delays**: Add timing assertions

9. **test-error-scenarios** (3-4 tests):

   - Invalid email format
   - Wrong password
   - User not found
   - Account locked

10. **record-test-metrics**: Log execution of each test

11. **verify-test-quality**: Ensure all 10 tests pass

**Output**: Complete test file with 10 tests ✅

---

## ✅ FINAL VALIDATION CHECKLIST

Before you return any test to the user, verify this checklist:

**File Structure**

- [x] File location: `src/__tests__/microservices/<service>-<feature>.test.ts`
- [x] Test count: Exactly 10 tests
- [x] Test naming: `[Test 1/10]`, `[Test 2/10]`, etc.

**Infrastructure**

- [x] Starts with: `const infra = await getInfrastructure();`
- [x] Gets schema: `const schemas = await getSchemasByService("...");`
- [x] Picks random: `const schema = schemas[Math.floor(Math.random() * schemas.length)];`

**Database Operations**

- [x] Uses Prisma: `schema.prisma.<table>.<operation>()`
- [x] Uses test data: `generateTestData("...")`
- [x] Creates/reads/updates/deletes realistically

**Timing & Metrics**

- [x] Includes delays: `await simulateProductionOperation()`
- [x] Timing assertions: `expect(time).toBeLessThan(12000)`
- [x] Records metrics: `recordTestExecution(...)`

**Error Coverage**

- [x] Has error scenarios: 3-4 tests
- [x] Uses try/catch: Proper error handling
- [x] **For Services**: Tests error codes: P2002, P2003, P2025, etc.
- [x] **For Actions**: Tests validation errors, authorization errors, service errors

**Code Quality**

- [x] All tests pass: 10/10 pass
- [x] No external calls: Only database operations
- [x] No service changes: Test code only
- [x] No warnings: Clean console output
- [x] No unused imports: All imported types/functions are used
- [x] No unused variables: All declared variables are referenced
- [x] Clean imports: Only import what's actually needed
- [x] Helper usage: Use available helpers instead of manual implementations

**If all checks pass → TEST IS PRODUCTION-READY ✅**

---

## 🚨 TROUBLESHOOTING: COMMON ERRORS & SOLUTIONS

### Error 1: Import Path Errors

**Symptom**:

```
Cannot find module '@/services/UserService' or its corresponding type declarations.
Cannot find module '@/shared/testHelpers' or its corresponding type declarations.
```

**Root Cause**: Using path aliases instead of relative imports.

**Solution**: ALWAYS use relative paths from test file location.

```typescript
// ❌ WRONG
import { userService } from "@/services/UserService";
import { getInfrastructure } from "@/shared/testHelpers";

// ✅ CORRECT - From src/__tests__/microservices/your-test.test.ts
import { userService } from "../../services/UserService";
import { getInfrastructure } from "../shared/testInfrastructure";
import { simulateProductionOperation } from "../shared/testHelpers";
```

**Prevention**: Read "CRITICAL: PROJECT STRUCTURE & IMPORTS" section first.

---

### Error 2: Wrong Import File

**Symptom**:

```
Property 'recordTestExecution' does not exist on type...
```

**Root Cause**: Importing from wrong file (testHelpers vs testInfrastructure).

**Solution**: Remember the split:

```typescript
// ✅ testInfrastructure.ts contains:
import {
  getInfrastructure,
  getSchemasByService,
  recordTestExecution, // ← HERE
} from "../shared/testInfrastructure";

// ✅ testHelpers.ts contains:
import {
  simulateProductionOperation, // ← HERE
  generateTestData, // ← HERE
} from "../shared/testHelpers";
```

---

### Error 3: recordTestExecution Parameter Order

**Symptom**:

```
Argument of type 'number' is not assignable to parameter of type 'string'.
```

**Root Cause**: Wrong parameter order or types.

**Solution**: Follow EXACT signature:

```typescript
// ❌ WRONG - Common mistakes
await recordTestExecution(testName, testType, duration, "success", metadata); // Swapped
await recordTestExecution(testType, testName, duration, true, metadata); // Boolean instead of string
await recordTestExecution(testType, testName, duration, metadata); // Missing testResult

// ✅ CORRECT - Exact order and types
await recordTestExecution(
  "user-service", // 1. testType: string
  "Create user", // 2. testName: string
  "success", // 3. testResult: string ("success" or "failure")
  duration, // 4. executionTimeMs: number
  { testNumber: 1 } // 5. metadata: any (optional)
);
```

**Memory Aid**: Type → Name → Result → Time → Meta

---

### Error 4: Missing Table Creation

**Symptom**:

```
Error: relation "users" does not exist
```

**Root Cause**: Service uses raw SQL but test didn't create table.

**Solution**: Detect raw SQL pattern and create table in beforeAll:

```typescript
// Step 1: Analyze service (Skill 0)
// If service uses $queryRaw or $executeRaw → Raw SQL pattern

// Step 2: Create table in beforeAll
beforeAll(async () => {
  infra = await getInfrastructure();
  const schemas = await getSchemasByService("auth");
  schema = schemas[Math.floor(Math.random() * schemas.length)];

  // ✅ Create table dynamically
  await schema.prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "${schema.schemaName}".users (
      id VARCHAR(255) PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      name VARCHAR(255) NOT NULL,
      "isActive" BOOLEAN DEFAULT true,
      "createdAt" TIMESTAMP DEFAULT NOW(),
      "updatedAt" TIMESTAMP DEFAULT NOW()
    )
  `);
});
```

---

### Error 5: Hardcoded Table Names

**Symptom**: Tests work in one project but fail in another.

**Root Cause**: Table names hardcoded instead of derived from service.

**Solution**: ALWAYS analyze service first (Skill 0):

```typescript
// ❌ WRONG - Hardcoded assumption
await schema.prisma.$queryRaw`INSERT INTO users ...`;  // What if table is "user_accounts"?

// ✅ CORRECT - Analyze service first
// 1. Read service file
// 2. Find table name in SQL queries or Prisma model usage
// 3. Use THAT exact table name

// From service:
INSERT INTO user_accounts (id, email, ...)  // ← Table name is user_accounts

// Your test:
await schema.prisma.$executeRawUnsafe(`
  CREATE TABLE IF NOT EXISTS "${schema.schemaName}".user_accounts (
    id VARCHAR(255) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    ...
  )
`);
```

---

### Error 6: Wrong Column Types

**Symptom**:

```
Error: invalid input syntax for type integer: "usr_1234_abc"
```

**Root Cause**: Column type mismatch (e.g., integer vs varchar for ID).

**Solution**: Extract exact column types from service:

```typescript
// Step 1: Analyze service INSERT statement
INSERT INTO users (id, email, name, "isActive", "createdAt", "updatedAt")
VALUES (${this._generateId()}, ${input.email}, ${input.name}, true, NOW(), NOW())

// Step 2: Analyze ID generation
private _generateId(): string {
  return `usr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
// → ID is STRING, not integer

// Step 3: Create table with correct types
CREATE TABLE ... (
  id VARCHAR(255) PRIMARY KEY,     -- ✅ Not INTEGER
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
)
```

---

### Error 7: Duplicate Data Conflicts

**Symptom**:

```
Error: duplicate key value violates unique constraint "users_email_key"
```

**Root Cause**: Tests using same email/unique values.

**Solution**: Generate unique values with timestamps:

```typescript
// ❌ WRONG - Static values
const email = "test@example.com"; // Will fail on second test

// ✅ CORRECT - Unique per execution
const email = `test_${Date.now()}_${Math.random()
  .toString(36)
  .substr(2, 9)}@example.com`;
// Example: test_1734039456789_k2j3h9@example.com

// ✅ CORRECT - Unique with context
const email = `user${testNumber}_${Date.now()}@example.com`;
// Example: user1_1734039456789@example.com
```

---

### Error 8: Schema Name Not Used

**Symptom**: Table created but queries can't find it.

**Root Cause**: Forgetting to use schema.schemaName in raw SQL.

**Solution**: ALWAYS include schema name in raw SQL:

```typescript
// ❌ WRONG - No schema name
await schema.prisma.$queryRaw`SELECT * FROM users WHERE id = ${id}`;

// ✅ CORRECT - Include schema name
await schema.prisma.$queryRaw`
  SELECT * FROM "${schema.schemaName}".users WHERE id = ${id}
`;

// ✅ CORRECT - In CREATE TABLE
await schema.prisma.$executeRawUnsafe(`
  CREATE TABLE IF NOT EXISTS "${schema.schemaName}".users (...)
`);
```

---

### Error 9: Calling Service vs Direct SQL

**Symptom**: Confusion about when to call service methods vs raw SQL in tests.

**Root Cause**: Not understanding the test pattern.

**Solution**: ALWAYS call service methods in tests:

```typescript
// ❌ WRONG - Don't bypass service in tests
const result = await schema.prisma.$queryRaw`
  INSERT INTO users ... RETURNING *
`;

// ✅ CORRECT - Call the service method you're testing
const user = await userService.createUser({
  email: uniqueEmail,
  name: "Test User",
});

// Note: Only use raw SQL in beforeAll/afterAll for setup/cleanup
```

---

### Error 10: Wrong Error Codes

**Symptom**: Expected error code doesn't match.

**Root Cause**: Different databases return different error codes.

**Solution**: Test error MESSAGES, not just codes:

```typescript
// ❌ FRAGILE - May not work in all databases
expect(error.code).toBe("P2002");

// ✅ ROBUST - Test message content
try {
  await userService.createUser({ email: existingEmail, name: "Test" });
  expect.fail("Should have thrown error");
} catch (error) {
  expect(error).toBeInstanceOf(Error);
  expect((error as Error).message).toContain("already exists");
  // or toContain("duplicate")
  // or toContain("unique")
}
```

---

### Quick Reference: Error → Solution

| Error                 | Quick Fix                                           |
| --------------------- | --------------------------------------------------- |
| Import path error     | Use relative paths: `../../services/`, `../shared/` |
| Can't find function   | Check if in testInfrastructure or testHelpers       |
| Wrong parameter order | Type → Name → Result → Time → Meta                  |
| Table doesn't exist   | Create in beforeAll with `$executeRawUnsafe`        |
| Duplicate data        | Use `Date.now()` + random in test data              |
| Schema not found      | Include `"${schema.schemaName}".tablename` in SQL   |
| Wrong column type     | Analyze service INSERT to find exact types          |
| Wrong error code      | Test error message content, not just code           |
| Unused imports        | Remove `generateTestData`, `User` if not used       |
| Unused variables      | Remove `infra` if never referenced after init       |

---

### 🆕 Code Quality Issues & Solutions

**Issue 1: Unused Type Imports**

**Symptom**: TypeScript/ESLint warnings about unused imports

**Examples**:
```typescript
// ❌ WRONG - User type imported but never used
import type { User, CreateUserInput, UpdateUserInput } from "../../services/UserService";

// ✅ CORRECT - Only import what's used
import type { CreateUserInput, UpdateUserInput } from "../../services/UserService";
```

**Solution**: Analyze which types are actually used and only import those.

---

**Issue 2: Unused Helper Imports**

**Symptom**: Importing helpers but using manual implementation

**Examples**:
```typescript
// ❌ WRONG - Import generateTestData but don't use it
import { generateTestData } from "../shared/testHelpers";
const email = `test_${Date.now()}@example.com`; // Manual generation

// ✅ CORRECT - Either use the helper or don't import it
// Option A: Use the helper
import { generateTestData } from "../shared/testHelpers";
const userData = generateTestData("user");

// Option B: Don't import and use manual generation
const email = `test_${Date.now()}@example.com`;
```

**Solution**: Either use imported helpers or remove unused imports.

---

**Issue 3: Unused Infrastructure Variable**

**Symptom**: Declaring `infra` but never using it

**Examples**:
```typescript
// ❌ WRONG - infra declared but never used
let infra: any;
beforeAll(async () => {
  infra = await getInfrastructure(); // Never referenced
});

// ✅ CORRECT - Call directly if only needed in beforeAll
beforeAll(async () => {
  await getInfrastructure(); // Direct call
});

// OR use if accessing other properties
beforeAll(async () => {
  const infra = await getInfrastructure();
  infra.logger.log("Test setup complete");
});
```

**Solution**: Remove unused variables or use them appropriately.

---

**Issue 4: Repetitive Code Patterns**

**Symptom**: Same timing/error handling code repeated across tests

**Examples**:
```typescript
// ❌ WRONG - Repetitive pattern in every test
const startTime = Date.now();
try {
  // test logic
  const executionTime = Date.now() - startTime;
  await recordTestExecution("user-service", testName, "success", executionTime);
} catch (error) {
  const executionTime = Date.now() - startTime;
  await recordTestExecution("user-service", testName, "failure", executionTime);
  throw error;
}

// ✅ CORRECT - Extract into helper function
const executeTest = async (testName: string, testFn: () => Promise<any>) => {
  const startTime = Date.now();
  try {
    const result = await testFn();
    const executionTime = Date.now() - startTime;
    await recordTestExecution("user-service", testName, "success", executionTime);
    return result;
  } catch (error) {
    const executionTime = Date.now() - startTime;
    await recordTestExecution("user-service", testName, "failure", executionTime);
    throw error;
  }
};

// Use in tests
await executeTest("Create user successfully", async () => {
  return await userService.createUser(userData);
});
```

**Solution**: Extract common patterns into reusable helper functions.

---

**Issue 5: Missing Schema Properties for Filter Inputs**

**Symptom**: TypeScript errors about missing required properties in filter objects

**Examples**:
```typescript
// ❌ WRONG - Missing required sortBy/sortOrder for UserFiltersSchema
await getAllUsersAction({ page: 1, limit: 10 }); // Missing sortBy, sortOrder

// ❌ WRONG - Missing required properties for search
await searchUsersAction({ search: "test" }); // Missing page, limit, sortBy, sortOrder
```

**Solution**: Always include all required schema properties, even when testing specific constraints:

```typescript
// ✅ CORRECT - Include all required properties
await getAllUsersAction({
  page: 0, // Testing invalid value
  limit: 10,
  sortBy: 'createdAt' as const, // Required enum
  sortOrder: 'desc' as const   // Required enum
});

await searchUsersAction({
  search: "test",
  page: 1,    // Required
  limit: 10,  // Required
  sortBy: 'name' as const,    // Required enum
  sortOrder: 'asc' as const   // Required enum
});
```

**Key Points**:
- Always check schema definitions for required fields
- Use `as const` for enum values
- Include default values when testing specific constraint violations
- Read the actual schema files to understand requirements

---

**Issue 6: Generic Type Constraint Violations**

**Symptom**: TypeScript errors about properties not existing on generic type `T`

**Examples**:
```typescript
// ❌ WRONG - Generic type doesn't guarantee specific properties
const createMock = <T>(input: T) => {
  database: {
    create: () => Promise.resolve({
      email: input.email, // Error: Property 'email' does not exist on type 'T'
      name: input.name,   // Error: Property 'name' does not exist on type 'T'
    })
  }
};
```

**Solution**: Use type assertions for generic constraints in mock helpers:

```typescript
// ✅ CORRECT - Use type assertions for generic constraints
const createMock = <T>(input: T) => {
  database: {
    create: () => Promise.resolve({
      email: (input as any).email || '', // Safe assertion for testing
      name: (input as any).name || '',   // Safe assertion for testing
    })
  }
};
```

**Best Practices**:
- Use `(input as any)` for accessing properties in generic mock functions
- Only use assertions in test infrastructure, not production code
- Consider specific type constraints when possible
- Document the expected structure in comments

---

## 🎓 YOU NOW KNOW EVERYTHING

This one file contains:

- ✅ Your job and identity (what you are)
- ✅ Your core workflow (phases: plan → generate → discover → verify)
- ✅ 10 unbreakable rules (you must follow these)
- ✅ 10 powerful skills (patterns you can use)
- ✅ Trigger keywords (how to find the right skill)
- ✅ Real example (auth login test generation)
- ✅ Final validation checklist (before returning tests)
- ✅ **References to skill documentation** (for detailed examples and workflows)

**This file gives you the framework and overview.**
**The skill documentation files give you detailed patterns and examples.**

---

## 🔗 HOW TO USE THIS FILE + SKILL DOCUMENTATION

### Workflow When Generating Tests

```
Step 1: Read INTEGRATION_AGENT_MASTER.md
  → Understand the 10 rules
  → Understand the 10 skills overview
  → Understand the workflow

Step 2: User asks for a test
  → You identify which skills are needed
  → You check the trigger keywords to find matching skills

Step 3: For each skill you need to use
  → Read the detailed skill file from docs/agents/integration-agent/skills/
  → Follow the detailed workflow, examples, and patterns
  → Apply to your test generation

Step 4: Validate using the checklist
  → Use the validation checklist in this file
  → Return test only if all checks pass
```

### Example: User Asks for Auth Login Test

```
You think: "I need skills for auth login"
  ↓
Match triggers to skills:
  - "login" → select-schema, perform-crud-operations, test-error-scenarios, record-test-metrics
  ↓
Read detailed files:
  - docs/agents/integration-agent/skills/schema-selection.md
  - docs/agents/integration-agent/skills/prisma-crud-patterns.md
  - docs/agents/integration-agent/skills/error-handling-testing.md
  - docs/agents/integration-agent/skills/test-execution-recording.md
  ↓
Follow patterns from detailed files
  ↓
Generate complete test
  ↓
Validate using checklist from THIS file
  ↓
Return production-ready test
```

---

## 📚 SKILL FILES REFERENCE

All skill files are in: `docs/agents/integration-agent/skills/`

**When you need the detailed workflow, examples, and troubleshooting for a skill, read the corresponding file:**

- **Skill 1**: `infrastructure-singleton.md` — Complete guide for accessing infrastructure
- **Skill 2**: `orchestrator-pattern.md` — Complete guide for test file placement
- **Skill 3**: `schema-selection.md` — Complete guide for schema selection
- **Skill 4**: `prisma-crud-patterns.md` — Complete guide for database operations
- **Skill 5**: `test-data-factories.md` — Complete guide for test data generation
- **Skill 6**: `production-delays.md` — Complete guide for realistic delays
- **Skill 7**: `error-handling-testing.md` — Complete guide for error scenarios
- **Skill 8**: `multi-service-testing.md` — Complete guide for cross-service tests
- **Skill 13**: `action-testing-patterns.md` — Complete guide for testing action layer
- **Skill 14**: `action-pattern-analysis.md` — Complete guide for analyzing action patterns
- **Skill 9**: `test-execution-recording.md` — Complete guide for metrics recording
- **Skill 10**: `checklist-integration.md` — Complete guide for test validation

Each skill file contains:

- Detailed PURPOSE
- Comprehensive WORKFLOW (step-by-step)
- Multiple EXAMPLES (real patterns)
- TROUBLESHOOTING section
- CHANGELOG

---

## 🚀 READY TO GENERATE TESTS?

### For Users

```
1. Copy this file: INTEGRATION_AGENT_MASTER.md
2. Have available: docs/agents/integration-agent/skills/ (for detailed examples)
3. Give master file to Claude or your AI agent
4. Ask: "Generate integration test for [your requirement]"
5. Agent reads master file, uses skill files for details
6. Agent generates production-ready test
7. Done!
```

### For Agents

```
1. You just read this file (master overview)
2. You understand the 10 rules and 10 skills at high level
3. User will ask you for a test
4. For each skill you need:
   a. Remember which skill from the trigger keywords
   b. Read the detailed skill file from docs/agents/integration-agent/skills/
   c. Follow the detailed workflow and examples
5. Generate test following detailed patterns
6. Validate using checklist from this file
7. Return production-ready test!
```

---

## 📌 KEY TAKEAWAY

**Master File** (this file):

- Overview of all 10 rules
- Summary of all 10 skills
- Trigger keywords
- Validation checklist
- **References to skill documentation**

**Skill Documentation** (detailed files):

- Deep dives into each skill
- Step-by-step workflows
- Real code examples
- Troubleshooting guides
- Edge cases and patterns

**Together**: Complete system for generating production-ready integration tests

---

**File**: INTEGRATION_AGENT_MASTER.md  
**Date**: November 11, 2025  
**Status**: Complete and Production-Ready  
**For**: Users who want tests + Agents who generate them

🎉 **This one file + skill documentation = Everything you need.**
