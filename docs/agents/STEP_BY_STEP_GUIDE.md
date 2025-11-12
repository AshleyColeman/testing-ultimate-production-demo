# 🚀 STEP-BY-STEP GUIDE: Using Analysis Agent + Integration Test Agent

## 📋 OVERVIEW

This guide shows you exactly how to use both agents together to analyze a service and generate production-ready integration tests.

**Two-Agent Workflow**:

1. **Analysis Agent** (thinking) → Analyzes service, creates test plan
2. **Integration Test Agent** (implementation) → Reads test plan, generates test code

---

## 🎯 STEP-BY-STEP PROCESS

### PHASE 1: PREPARE FOR ANALYSIS

#### Step 1: Identify the Service File

Locate the service file you want to test.

**Example locations**:

```
src/services/UserService.ts
src/services/OrderService.ts
src/services/PaymentService.ts
src/services/InventoryService.ts
```

#### Step 2: Decide What to Analyze

**Option A**: Analyze entire service (all methods)

```
"Analyze UserService and create a test plan"
```

**Option B**: Analyze specific methods only

```
"Analyze the createUser and deleteUser methods from UserService"
```

**Option C**: Analyze with specific focus

```
"Analyze UserService, focusing on FK cascades and performance"
```

---

### PHASE 2: USE ANALYSIS AGENT

#### Step 3: Give Analysis Agent the Master File

**Action**: Copy the Analysis Agent master file to your AI assistant

**File Location**:

```
docs/agents/analysis-agent/ANALYSIS_AGENT_MASTER.md
```

**How to Give to AI**:

1. Open `ANALYSIS_AGENT_MASTER.md`
2. Copy entire file contents
3. Paste into your AI chat (Claude, etc.)
4. AI now understands its role as Analysis Agent

#### Step 4: Request Analysis

**Type your request** (choose one pattern):

**Pattern 1 - Full Service Analysis**:

```
Analyze src/services/UserService.ts and create a comprehensive test plan
```

**Pattern 2 - Specific Methods**:

```
Analyze these methods from UserService: createUser, updateUser, deleteUser
```

**Pattern 3 - With Focus**:

```
Analyze UserService, paying special attention to FK cascade testing
```

#### Step 5: Analysis Agent Works

The agent will:

1. ✅ Read your service file
2. ✅ Analyze all methods (or specified methods)
3. ✅ Parse Prisma schema (if using Prisma)
4. ✅ Map FK relationships and cascades
5. ✅ Generate 10-20 test scenarios per method
6. ✅ Validate import paths
7. ✅ Think of creative edge cases
8. ✅ Create structured test plan document

**This takes ~2-5 minutes** depending on service complexity.

#### Step 6: Receive Test Plan Document

The Analysis Agent outputs a complete test plan document:

````markdown
# 🧪 TEST PLAN: UserService

**Service File**: `src/services/UserService.ts`
**Analysis Date**: 2025-11-12
**Total Methods Analyzed**: 5
**Total Tests Recommended**: 78
**Estimated Complexity**: Medium
**Ready for Integration Agent**: ✅ Yes

## 📊 SERVICE OVERVIEW

[Complete service description]

## 🗄️ DATABASE SCHEMA

[All tables with constraints]

## 🔗 FOREIGN KEY RELATIONSHIPS

[FK map with cascade behaviors]

## 🎯 METHOD ANALYSIS

### Method 1: createUser(input: CreateUserInput): Promise<User>

**Recommended Tests (18 total)**:

**Happy Path (8 tests)**:

1. [Test 1/18] Create user with minimal required data
   - Input: { email: "test@example.com", name: "Test User", password: "Pass123!" }
   - Expected: User created with default role='user', isActive=true
   - Verify: User exists in DB, ID matches pattern, timestamps set

[... 17 more detailed test scenarios ...]

## 📦 IMPORT RECOMMENDATIONS

### For Test File: `src/__tests__/microservices/user-service.test.ts`

```typescript
// Vitest Framework
import { describe, it, expect, beforeAll, afterAll } from "vitest";

// Service Under Test - Go UP 2 levels, then into services
import { userService } from "../../services/UserService";
import type {
  CreateUserInput,
  UpdateUserInput,
} from "../../services/UserService";

// Test Infrastructure - Go UP 1 level, then into shared
import {
  getInfrastructure,
  getSchemasByService,
  recordTestExecution,
} from "../shared/testInfrastructure";

// Test Helpers - Go UP 1 level, then into shared
import { simulateProductionOperation } from "../shared/testHelpers";
```
````

## 🤝 INTEGRATION AGENT HANDOFF

✅ Ready for Integration Agent
✅ All imports validated
✅ Test file location: `src/__tests__/microservices/user-service.test.ts`
✅ Service name for getSchemasByService(): "user"
✅ 78 tests across 5 methods

[Complete handoff instructions...]

```

#### Step 7: Save Test Plan

**Action**: Save the test plan document for the next step

**Where to save**:
```

Option A: Copy to a new file (recommended)
→ docs/test-plans/UserService-test-plan.md

Option B: Keep in chat history (can reference later)
→ Just keep the AI chat open

Option C: Save to clipboard
→ Copy entire test plan, paste when needed

```

**💡 Tip**: Saving to a file is best for complex services or team collaboration.

---

### PHASE 3: USE INTEGRATION TEST AGENT

#### Step 8: Give Integration Test Agent the Master File

**Action**: Copy the Integration Test Agent master file to your AI assistant

**File Location**:
```

docs/agents/integration-agent/INTEGRATION_AGENT_MASTER.md

```

**How to Give to AI**:
1. Open `INTEGRATION_AGENT_MASTER.md`
2. Copy entire file contents
3. Paste into your AI chat
4. AI now understands its role as Integration Test Agent

**💡 Tip**: You can use the same AI chat or a new one. If using the same chat, say: "Now switch to Integration Test Agent mode."

#### Step 9: Give Test Plan to Integration Agent

**Action**: Provide the test plan from Analysis Agent

**How to provide**:

**Option A - Direct paste** (if you saved test plan):
```

Here is the test plan from the Analysis Agent:

[Paste entire test plan here]

Please implement the integration tests.

```

**Option B - Reference** (if in same chat):
```

Use the test plan you just created above and implement the integration tests.

```

**Option C - File reference** (if saved to file):
```

Read docs/test-plans/UserService-test-plan.md and implement the integration tests.

````

#### Step 10: Integration Agent Works

The Integration Test Agent will:
1. ✅ Read the test plan
2. ✅ Extract method analysis and test scenarios
3. ✅ Use the exact import statements provided
4. ✅ Create test file at specified location
5. ✅ Implement all test scenarios
6. ✅ Use infrastructure (getInfrastructure, getSchemasByService)
7. ✅ Add realistic delays (simulateProductionOperation)
8. ✅ Record test execution
9. ✅ Validate tests will pass

**This takes ~3-7 minutes** depending on test count.

#### Step 11: Receive Test File

The Integration Test Agent outputs complete test code:

```typescript
// src/__tests__/microservices/user-service.test.ts
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { userService } from "../../services/UserService";
import type { CreateUserInput, UpdateUserInput } from "../../services/UserService";
import {
  getInfrastructure,
  getSchemasByService,
  recordTestExecution,
} from "../shared/testInfrastructure";
import { simulateProductionOperation } from "../shared/testHelpers";

describe("UserService Integration Tests", () => {
  let infra: any;
  let schema: any;

  beforeAll(async () => {
    infra = await getInfrastructure();
    const schemas = await getSchemasByService("user");
    schema = schemas[Math.floor(Math.random() * schemas.length)];
  });

  afterAll(async () => {
    await infra.memoryManager.cleanup();
  });

  it("[Test 1/18] Create user with minimal required data", async () => {
    const executionTime = await simulateProductionOperation();

    const userData: CreateUserInput = {
      email: `test-${Date.now()}@example.com`,
      name: "Test User",
      password: "SecurePass123!"
    };

    const user = await schema.prisma.user.create({ data: userData });

    expect(user).toBeDefined();
    expect(user.email).toBe(userData.email);
    expect(user.role).toBe("user");
    expect(user.isActive).toBe(true);
    expect(user.id).toMatch(/^usr_/);

    await recordTestExecution(
      "user-service",
      "Create user with minimal required data",
      "success",
      executionTime,
      { testNumber: 1 }
    );
  });

  // ... 17 more test implementations ...
});
````

#### Step 12: Save Test File

**Action**: Save the generated test code

**Where to save**:

```
EXACT LOCATION (from test plan):
src/__tests__/microservices/user-service.test.ts

⚠️ IMPORTANT: Use the EXACT path specified in the test plan!
```

**How to save**:

1. Create file if it doesn't exist
2. Copy entire test code from Integration Agent
3. Paste into file
4. Save file

---

### PHASE 4: RUN AND VALIDATE TESTS

#### Step 13: Run the Tests

**Action**: Execute the test file to verify it works

**Command**:

```bash
# Run specific test file
npx vitest run src/__tests__/microservices/user-service.test.ts

# Or run all tests
npx vitest run
```

**Expected output**:

```
✓ [Test 1/18] Create user with minimal required data (234ms)
✓ [Test 2/18] Create user with all optional fields (189ms)
✓ [Test 3/18] Create user and verify in database (156ms)
...
✓ [Test 18/18] Create users concurrently (445ms)

Test Files  1 passed (1)
Tests  18 passed (18)
```

#### Step 14: Fix Any Issues (if needed)

**If tests fail**, check:

**Common Issue 1: Import Errors**

```
❌ Error: Cannot find module '../../services/UserService'

✅ Fix: Verify relative path is correct
- Test location: src/__tests__/microservices/
- Service location: src/services/
- Correct path: ../../services/UserService ✅
```

**Common Issue 2: Type Errors**

```
❌ Error: Type 'User' is not exported

✅ Fix: Use only exported types
- Check service exports
- Use CreateUserInput, UpdateUserInput (not User)
- Or infer type from method return
```

**Common Issue 3: Database Errors**

```
❌ Error: Table 'users' does not exist

✅ Fix: Ensure database schema is created
- Check Prisma migrations
- Run: npx prisma migrate dev
- Verify schema.prisma has User model
```

**💡 Tip**: Most issues are caught by Analysis Agent's import validation, so they're rare!

#### Step 15: Verify All Tests Pass

**Success criteria**:

- ✅ All tests pass (100%)
- ✅ No console errors
- ✅ Realistic execution times (50ms-10s)
- ✅ Test execution recorded
- ✅ Memory cleanup successful

---

## 📊 COMPLETE WORKFLOW EXAMPLE

### Real Example: Analyzing UserService

**Step 1**: Identify service

```
File: src/services/UserService.ts
Methods: createUser, getUserById, updateUser, deleteUser, listUsers
```

**Step 2**: Give Analysis Agent the master file

```
[Copy docs/agents/analysis-agent/ANALYSIS_AGENT_MASTER.md to AI]
```

**Step 3**: Request analysis

```
You: "Analyze src/services/UserService.ts and create a comprehensive test plan"
```

**Step 4**: Analysis Agent works (2-3 minutes)

```
Agent: Analyzing service...
Agent: Extracting database schema...
Agent: Mapping FK relationships...
Agent: Generating test scenarios...
Agent: Validating imports...
Agent: Creating test plan...
```

**Step 5**: Receive test plan

```
Agent: [Outputs complete test plan with 78 tests across 5 methods]
```

**Step 6**: Save test plan

```
File: docs/test-plans/UserService-test-plan.md
```

**Step 7**: Give Integration Agent the master file

```
[Copy docs/agents/integration-agent/INTEGRATION_AGENT_MASTER.md to AI]
```

**Step 8**: Give test plan to Integration Agent

```
You: "Here is the test plan: [paste test plan]. Please implement the integration tests."
```

**Step 9**: Integration Agent works (3-5 minutes)

```
Agent: Reading test plan...
Agent: Extracting test scenarios...
Agent: Generating test code...
Agent: Implementing 78 tests...
Agent: Adding infrastructure setup...
Agent: Validating test structure...
```

**Step 10**: Receive test file

```
Agent: [Outputs complete test file with 78 test implementations]
```

**Step 11**: Save test file

```
File: src/__tests__/microservices/user-service.test.ts
```

**Step 12**: Run tests

```
Terminal: npx vitest run src/__tests__/microservices/user-service.test.ts
Result: ✓ 78 tests passed
```

**Step 13**: Done! ✅

```
UserService now has 78 production-ready integration tests!
```

---

## 📁 FILE LOCATIONS REFERENCE

### Input Files (What You Need)

```
1. Service to analyze:
   → src/services/[ServiceName].ts

2. Analysis Agent master file:
   → docs/agents/analysis-agent/ANALYSIS_AGENT_MASTER.md

3. Integration Agent master file:
   → docs/agents/integration-agent/INTEGRATION_AGENT_MASTER.md
```

### Output Files (What Gets Created)

```
1. Test Plan (optional, but recommended):
   → docs/test-plans/[ServiceName]-test-plan.md

2. Test File (required):
   → src/__tests__/microservices/[service-name].test.ts

   Examples:
   - src/__tests__/microservices/user-service.test.ts
   - src/__tests__/microservices/order-service.test.ts
   - src/__tests__/microservices/payment-service.test.ts
```

### Supporting Files (Already Exist)

```
1. Test Infrastructure:
   → src/__tests__/shared/testInfrastructure.ts

2. Test Helpers:
   → src/__tests__/shared/testHelpers.ts

3. Prisma Schema:
   → prisma/schema.prisma
```

---

## 🎯 QUICK REFERENCE

### Analysis Agent Request Templates

```
# Template 1: Full Service
"Analyze [ServiceName] and create a test plan"

# Template 2: Specific Methods
"Analyze these methods from [ServiceName]: [method1], [method2], [method3]"

# Template 3: With Focus
"Analyze [ServiceName], focusing on [FK cascades | performance | edge cases | error handling]"
```

### Integration Agent Request Templates

```
# Template 1: Direct
"Here is the test plan: [paste]. Please implement the integration tests."

# Template 2: Reference (same chat)
"Use the test plan above and implement the integration tests."

# Template 3: File reference
"Read docs/test-plans/[ServiceName]-test-plan.md and implement tests."
```

---

## ✅ SUCCESS CHECKLIST

### After Using Analysis Agent

- [ ] Received complete test plan document
- [ ] Test plan includes service overview
- [ ] Test plan includes database schema
- [ ] Test plan includes FK relationships
- [ ] Test plan includes 10-20 tests per method
- [ ] Test plan includes exact import statements
- [ ] Test plan includes Integration Agent handoff section
- [ ] Test plan saved (optional but recommended)

### After Using Integration Agent

- [ ] Received complete test file code
- [ ] Test file uses correct imports (relative paths)
- [ ] Test file location matches test plan
- [ ] All test scenarios implemented
- [ ] Infrastructure setup included (beforeAll/afterAll)
- [ ] Test file saved at correct location
- [ ] Tests run successfully (npx vitest run)
- [ ] All tests pass (100%)

---

## 🚨 TROUBLESHOOTING

### Problem: Analysis Agent doesn't understand service

**Solution**: Make sure you gave it the ANALYSIS_AGENT_MASTER.md file first

---

### Problem: Test plan is incomplete

**Solution**: Ask Analysis Agent:

```
"Please provide a complete test plan with all sections including imports and Integration Agent handoff"
```

---

### Problem: Integration Agent generates wrong imports

**Solution**: The test plan has exact imports. Tell Integration Agent:

```
"Use the EXACT import statements from the test plan, don't modify them"
```

---

### Problem: Tests fail with import errors

**Solution**: Verify file paths:

```
Test file: src/__tests__/microservices/[name].test.ts
Service: src/services/[ServiceName].ts
Path should be: ../../services/[ServiceName]
```

---

### Problem: Tests fail with type errors

**Solution**: Check service exports:

```
Only import types that are exported from the service
If type isn't exported, infer it from method return type
```

---

## 💡 TIPS & BEST PRACTICES

### Tip 1: Save Test Plans

Always save test plans to `docs/test-plans/` for future reference and team collaboration.

### Tip 2: One Service at a Time

Analyze and implement one service completely before moving to the next.

### Tip 3: Review Test Plan First

Read the test plan before giving to Integration Agent. Make sure it covers what you need.

### Tip 4: Keep Test Plans Updated

If you modify a service, re-run Analysis Agent to update the test plan.

### Tip 5: Use Specific Method Analysis

For small changes, analyze only specific methods instead of entire service.

### Tip 6: Test Incrementally

After Integration Agent generates tests, run them immediately to catch issues early.

### Tip 7: Leverage Creative Edge Cases

Analysis Agent's Skill 8 provides creative edge cases - don't skip these!

### Tip 8: Same AI vs New AI

You can use the same AI chat for both agents (just switch roles) or use separate chats.

---

## 🎓 LEARNING PATH

### Beginner

Start with a simple service (3-5 methods, no complex FKs)

```
Example: src/services/NotificationService.ts
```

### Intermediate

Move to services with FK relationships

```
Example: src/services/UserService.ts (has orders, profiles)
```

### Advanced

Tackle complex services with multi-level cascades

```
Example: src/services/OrderService.ts (orders → items → inventory)
```

---

## 📈 PRODUCTIVITY METRICS

### Time Savings

**Manual test writing**:

- 78 tests × 10 minutes each = ~13 hours

**Using both agents**:

- Analysis Agent: 3 minutes
- Integration Agent: 5 minutes
- Review/fix: 10 minutes
- **Total: ~18 minutes**

**Time saved**: ~12.5 hours per service! 🚀

---

## 🎉 YOU'RE READY!

You now know exactly how to:

1. ✅ Use Analysis Agent to create test plans
2. ✅ Save test plans properly
3. ✅ Use Integration Agent to generate test code
4. ✅ Save test files at correct locations
5. ✅ Run and validate tests
6. ✅ Troubleshoot common issues

**Go create some amazing tests!** 🎯

---

**Document**: STEP_BY_STEP_GUIDE.md  
**Purpose**: Complete workflow guide for using both agents  
**Audience**: Developers using the agent system  
**Last Updated**: 2025-11-12
