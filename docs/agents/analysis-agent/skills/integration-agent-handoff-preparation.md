# Skill 10: INTEGRATION AGENT HANDOFF PREPARATION

## 📋 PURPOSE

Ensure the test plan is fully compatible with the Integration Test Agent's requirements and workflow.

**Goal**: Prepare analysis output in a format that Integration Agent can immediately consume and implement.

---

## 🎯 WHEN TO USE

- Final step before delivering test plan
- After creating test plan document (Skill 9)
- Before handing off to Integration Agent
- To verify compatibility and completeness

---

## 🔗 INTEGRATION AGENT REQUIREMENTS

### What Integration Agent Expects

The Integration Agent requires:

1. **Clear test scenarios** with exact inputs and expected outputs
2. **Correct import paths** using relative paths (no @/ aliases)
3. **Infrastructure usage pattern** (getInfrastructure, getSchemasByService, recordTestExecution)
4. **Test file location** (`src/__tests__/microservices/<name>.test.ts`)
5. **Database schema knowledge** (tables, constraints, relationships)
6. **Test structure guidance** (10 tests standard, more for complex)

### Integration Agent Workflow

```
1. Read Test Plan (your output)
2. Analyze recommended tests
3. Generate test file with correct imports
4. Implement each test scenario
5. Use infrastructure singleton
6. Record test execution
7. Validate tests pass
```

---

## ✅ COMPATIBILITY CHECKLIST

### Import Path Validation

Verify all import recommendations match Integration Agent's pattern:

```typescript
// ✅ CORRECT - Integration Agent uses these exact patterns

// Vitest imports
import { describe, it, expect, beforeAll, afterAll } from "vitest";

// Service imports - relative path from test file location
import { userService } from "../../services/UserService";
import type { CreateUserInput } from "../../services/UserService";

// Infrastructure imports - from testInfrastructure.ts
import {
  getInfrastructure,
  getSchemasByService,
  recordTestExecution,
} from "../shared/testInfrastructure";

// Helper imports - from testHelpers.ts (if needed)
import { simulateProductionOperation } from "../shared/testHelpers";

// ❌ WRONG - Integration Agent will reject these
import { userService } from "@/services/UserService"; // No @/ aliases
import { recordTestExecution } from "../shared/testHelpers"; // Wrong file!
```

**Checklist**:

- [ ] All service imports use `../../services/`
- [ ] All infrastructure imports use `../shared/testInfrastructure`
- [ ] All helper imports use `../shared/testHelpers`
- [ ] No @/ path aliases used
- [ ] All types are verified as EXPORTED from service

### Test Structure Validation

Verify test recommendations follow Integration Agent's structure:

```typescript
describe("UserService Integration Tests", () => {
  let infra: Infrastructure;
  let schema: SchemaInfo;

  beforeAll(async () => {
    // Integration Agent pattern
    infra = await getInfrastructure();
    const schemas = await getSchemasByService("user");
    schema = schemas[Math.floor(Math.random() * schemas.length)];
  });

  afterAll(async () => {
    await infra.memoryManager.cleanup();
  });

  // Test 1/10 - Happy Path
  it("[Test 1/10] Create user with valid data", async () => {
    const executionTime = await simulateProductionOperation();

    // Test implementation
    const user = await schema.prisma.user.create({
      data: { email: "test@example.com", name: "Test" },
    });

    expect(user).toBeDefined();
    expect(user.email).toBe("test@example.com");

    await recordTestExecution(
      "user-service",
      "Create user with valid data",
      "success",
      executionTime,
      { testNumber: 1 }
    );
  });

  // ... 9 more tests
});
```

**Checklist**:

- [ ] Tests use `getInfrastructure()` pattern
- [ ] Tests use `getSchemasByService()` pattern
- [ ] Tests use `simulateProductionOperation()` for delays
- [ ] Tests use `recordTestExecution()` with correct parameters
- [ ] Test names include `[Test X/10]` format
- [ ] Total test count matches recommendations (10-20)

### Infrastructure Function Signatures

Verify all infrastructure calls match Integration Agent's function signatures:

```typescript
// ✅ CORRECT Function Signatures

// getInfrastructure - No parameters
const infra = await getInfrastructure();
// Returns: { containers, schemas, logger, memoryManager }

// getSchemasByService - Takes service name string
const schemas = await getSchemasByService("user");
// Returns: Array<{ prisma: PrismaClient, schemaName: string }>

// recordTestExecution - EXACT parameter order
await recordTestExecution(
  testType: string,        // e.g., "user-service"
  testName: string,        // e.g., "Create user successfully"
  testResult: string,      // Must be: "success" or "failure"
  executionTimeMs: number, // Duration in milliseconds
  metadata?: object        // Optional: { testNumber: 1 }
);

// simulateProductionOperation - No parameters
const executionTime = await simulateProductionOperation();
// Returns: number (milliseconds between 50-10000)
```

**Checklist**:

- [ ] `getInfrastructure()` called with no parameters
- [ ] `getSchemasByService()` receives correct service name
- [ ] `recordTestExecution()` parameters in EXACT order
- [ ] `testResult` is "success" or "failure" (not boolean)
- [ ] `executionTimeMs` is number, not duration object
- [ ] `simulateProductionOperation()` called with no parameters

### Database Access Pattern

Verify test scenarios use Integration Agent's database access pattern:

```typescript
// ✅ CORRECT - Using Prisma Client from schema

// CREATE
const user = await schema.prisma.user.create({
  data: { email: "test@example.com", name: "Test User" }
});

// READ
const user = await schema.prisma.user.findUnique({
  where: { id: userId }
});

const users = await schema.prisma.user.findMany({
  where: { role: "admin" }
});

// UPDATE
await schema.prisma.user.update({
  where: { id: userId },
  data: { name: "Updated Name" }
});

// DELETE
await schema.prisma.user.delete({
  where: { id: userId }
});

// ❌ WRONG - Don't reference service methods unless testing service
// (Integration Agent tests DB directly for setup/teardown)
await userService.createUser({ ... }); // Only if testing service method
```

**Checklist**:

- [ ] Tests use `schema.prisma.<model>.<operation>()`
- [ ] Setup/teardown use Prisma directly
- [ ] Test data created via Prisma
- [ ] Service methods called only when testing service behavior

---

## 📋 HANDOFF DOCUMENT TEMPLATE

Include this section in every test plan:

````markdown
## 🤝 INTEGRATION AGENT HANDOFF

### Ready for Implementation: ✅

This test plan is fully compatible with Integration Test Agent.

### What's Provided

✅ **Test File Location**: `src/__tests__/microservices/[service-name].test.ts`
✅ **Total Tests**: [Number] tests across [Number] methods
✅ **Import Statements**: Verified and ready to use
✅ **Infrastructure Pattern**: getInfrastructure(), getSchemasByService()
✅ **Database Schema**: Complete with constraints and relationships
✅ **Test Scenarios**: Detailed with inputs and expected outputs
✅ **Test Data**: Guidance for generating conflict-free data

### Integration Agent Instructions

1. **Read this test plan** document in full
2. **Create test file** at specified location
3. **Copy import statements** exactly as provided
4. **Implement beforeAll**:
   ```typescript
   beforeAll(async () => {
     infra = await getInfrastructure();
     const schemas = await getSchemasByService("[service-name]");
     schema = schemas[Math.floor(Math.random() * schemas.length)];
   });
   ```
````

5. **Implement each test scenario** following the structure:
   - Start with `const executionTime = await simulateProductionOperation();`
   - Implement test logic
   - End with `await recordTestExecution(...);`
6. **Use test naming**: `[Test X/Y] Description`
7. **Verify all tests pass** before considering complete

### Service Name for Infrastructure

Use this service name with `getSchemasByService()`:

```typescript
const schemas = await getSchemasByService("[service-name]");
// Options: "auth", "user", "order", "payment", "inventory", etc.
```

### Expected Test File Structure

```typescript
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { [service] } from "../../services/[ServiceName]";
import type { [Types] } from "../../services/[ServiceName]";
import {
  getInfrastructure,
  getSchemasByService,
  recordTestExecution,
} from "../shared/testInfrastructure";
import { simulateProductionOperation } from "../shared/testHelpers";

describe("[ServiceName] Integration Tests", () => {
  let infra: any;
  let schema: any;

  beforeAll(async () => {
    infra = await getInfrastructure();
    const schemas = await getSchemasByService("[service-name]");
    schema = schemas[Math.floor(Math.random() * schemas.length)];
  });

  afterAll(async () => {
    await infra.memoryManager.cleanup();
  });

  // Test implementations from plan
  it("[Test 1/10] ...", async () => { /* ... */ });
  it("[Test 2/10] ...", async () => { /* ... */ });
  // ... more tests
});
```

### Compatibility Verified

✅ All imports use relative paths (no @/ aliases)
✅ All function signatures match Integration Agent's expectations
✅ All types are exported from service
✅ Infrastructure usage follows Integration Agent pattern
✅ Test structure follows Integration Agent guidelines
✅ No TypeScript or import errors expected

---

````

---

## 🔍 VERIFICATION STEPS

### Step 1: Import Validation

Run through this checklist:

```typescript
// Check 1: Service imports
✅ Use ../../services/ path?
✅ All types exported?
✅ Service instance exported?

// Check 2: Infrastructure imports
✅ From ../shared/testInfrastructure?
✅ getInfrastructure, getSchemasByService, recordTestExecution imported?

// Check 3: Helper imports
✅ From ../shared/testHelpers?
✅ simulateProductionOperation imported?

// Check 4: No bad patterns
❌ No @/ aliases?
❌ No absolute paths?
❌ No wrong file sources?
````

### Step 2: Function Signature Validation

```typescript
// Check 1: getInfrastructure()
✅ Called with no parameters?
✅ Returns { containers, schemas, logger, memoryManager }?

// Check 2: getSchemasByService()
✅ Receives service name string?
✅ Service name is valid (auth, user, order, etc.)?

// Check 3: recordTestExecution()
✅ Parameter order: testType, testName, testResult, executionTimeMs, metadata?
✅ testResult is "success" or "failure" (not boolean)?
✅ executionTimeMs is number?

// Check 4: simulateProductionOperation()
✅ Called with no parameters?
✅ Returns number?
```

### Step 3: Test Structure Validation

```typescript
// Check 1: Test file location
✅ File at src/__tests__/microservices/<name>.test.ts?

// Check 2: Test count
✅ 10 tests minimum (10-20 for complex)?
✅ Mix of happy path, errors, edge cases?

// Check 3: Test naming
✅ Each test named [Test X/Y]?
✅ Descriptive test names?

// Check 4: Test structure
✅ beforeAll sets up infrastructure?
✅ afterAll cleans up?
✅ Each test uses simulateProductionOperation()?
✅ Each test calls recordTestExecution()?
```

### Step 4: Database Schema Validation

```typescript
// Check 1: Schema completeness
✅ All tables documented?
✅ All columns with types?
✅ All constraints listed?
✅ All FKs mapped?

// Check 2: Cascade behavior
✅ onDelete specified for each FK?
✅ onUpdate specified for each FK?
✅ Cascade chains documented?

// Check 3: Test implications
✅ FK tests recommended for CASCADE?
✅ Constraint violation tests for UNIQUE?
✅ Not null tests for required fields?
```

---

## ✅ SUCCESS CRITERIA

Handoff preparation is complete when:

1. **All imports validated** against Integration Agent's pattern
2. **All function signatures verified** to match exactly
3. **Test structure follows** Integration Agent's guidelines
4. **Database schema complete** with all details Integration Agent needs
5. **Handoff document included** in test plan with clear instructions
6. **No compatibility issues** detected
7. **Integration Agent can immediately** start implementing tests

---

## 💡 COMMON HANDOFF ISSUES & FIXES

### Issue 1: Import Path Errors

**Problem**: Test plan recommends `@/services/UserService`

**Fix**:

```typescript
// ❌ WRONG
import { userService } from "@/services/UserService";

// ✅ CORRECT
import { userService } from "../../services/UserService";
```

### Issue 2: Wrong Infrastructure File

**Problem**: Test plan imports from wrong file

**Fix**:

```typescript
// ❌ WRONG
import { recordTestExecution } from "../shared/testHelpers";

// ✅ CORRECT
import { recordTestExecution } from "../shared/testInfrastructure";
```

### Issue 3: Function Parameter Order

**Problem**: Test plan shows wrong parameter order

**Fix**:

```typescript
// ❌ WRONG
await recordTestExecution(testName, testType, duration, "success");

// ✅ CORRECT
await recordTestExecution(
  testType, // 1st: "user-service"
  testName, // 2nd: "Create user"
  "success", // 3rd: "success" or "failure"
  duration, // 4th: number (milliseconds)
  metadata // 5th: optional object
);
```

### Issue 4: Unavailable Types

**Problem**: Test plan recommends importing types that aren't exported

**Fix**:

```typescript
// ❌ WRONG - User type not exported
import type { User } from "../../services/UserService";

// ✅ CORRECT - Only use exported types
import type {
  CreateUserInput,
  UpdateUserInput,
} from "../../services/UserService";

// OR infer type from method return
const user = await userService.createUser(data);
// TypeScript infers User type from method signature
```

---

## 🎯 HANDOFF BEST PRACTICES

1. **Always verify imports** before finalizing test plan
2. **Double-check function signatures** against Integration Agent's master file
3. **Include handoff document** in every test plan
4. **Be explicit about service name** for getSchemasByService()
5. **Provide complete database schema** with all constraints
6. **List any special considerations** (performance, timing, etc.)
7. **Verify no TypeScript errors** will occur with recommended imports

---

**File**: integration-agent-handoff-preparation.md  
**Skill**: 10  
**Status**: Production-Ready  
**Purpose**: Ensure test plan compatibility with Integration Test Agent
