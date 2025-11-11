---
id: agents-overview
title: "Integration Test Agent"
---

# 🤖 Integration Test Agent

You have **one specialized agent** for integration testing using real PostgreSQL databases, Prisma ORM, and production-grade infrastructure.

The agent is **self-contained**: copy the entire agent folder and it has everything it needs.

---

## 🎯 Quick Reference

| Agent                      | Specializes In                                          | Copy This                   | Use When                                                        |
| -------------------------- | ------------------------------------------------------- | --------------------------- | --------------------------------------------------------------- |
| **Integration Test Agent** | Real DB operations, Services, Prisma, Production Delays | `agents/integration-agent/` | Testing service integration with real PostgreSQL + shared infra |

---

## 📁 File Structure

```
agents/
└── integration-agent/
    ├── INTEGRATION-TEST-AGENT.md       ← Start here
    └── skills/
        ├── infrastructure-singleton.md         # Getting shared infra
        ├── schema-selection.md                 # Random schema picking
        ├── prisma-crud-patterns.md             # Database operations
        ├── production-delays.md                # Realistic timing
        ├── test-data-factories.md              # Generating test data
        ├── error-handling-testing.md           # Validation, timeouts, DB errors
        ├── multi-service-testing.md            # Service interactions
        ├── test-execution-recording.md         # recordTestExecution pattern
        ├── orchestrator-pattern.md             # How tests fit into orchestrator
        ├── checklist-integration.md            # Pre/post generation checks
        └── examples/
            ├── auth-login.test.ts
            ├── payment-processing.test.ts
            ├── inventory-operations.test.ts
            ├── analytics-tracking.test.ts
            └── notification-delivery.test.ts
```

---

## 🚀 How to Use

### Step 1: Copy Agent Folder

```bash
# Copy integration agent
cp -r docs/agents/integration-agent my-integration-test-agent
```

### Step 2: Read the Agent README

Open `INTEGRATION-TEST-AGENT.md` and follow the workflow to generate tests.

### Step 3: Follow the Pattern

Generated tests should:

- ✅ Use `getInfrastructure()` to access shared containers + schemas
- ✅ Use `getSchemasByService(serviceName)` to pick a random schema
- ✅ Use Prisma to interact with real PostgreSQL databases
- ✅ Include realistic production delays (50ms-10s)
- ✅ Follow the orchestrator pattern (tests are auto-discovered and loaded)
- ✅ Use `recordTestExecution()` to log execution metrics
- ✅ Generate 10 tests per file (matching your pattern)

---

## 📊 Architecture Overview

Your infrastructure is **initialized ONCE** before all tests run:

```
beforeAll (Master Orchestrator)
  ↓
  Create 5 PostgreSQL containers
  Create 20 database schemas (4 per service)
  Make infrastructure available via getInfrastructure()
  ↓
All 530 Tests (in 53 files)
  ↓
  Each test accesses shared infrastructure
  Each test picks a random schema for its service
  Each test uses Prisma to interact with real DB
  Each test includes realistic production delays
  ↓
afterAll
  Clean up containers + schemas
```

---

## 💡 Key Differences From Generic Agents

| Aspect           | Generic Agent      | Your Integration Agent |
| ---------------- | ------------------ | ---------------------- |
| **Database**     | HTTP mocks (MSW)   | Real PostgreSQL        |
| **ORM**          | Fetch + JSON stubs | Prisma Client          |
| **Setup**        | Per-test setup     | Singleton (once)       |
| **Test Data**    | Factories          | Factories + DB inserts |
| **Timing**       | Instant            | 50ms-10s (realistic)   |
| **File Pattern** | Any test structure | 10 tests per file      |
| **Discovery**    | Manual imports     | Dynamic glob + import  |

---

## ❓ Common Questions

### Q: How do I generate tests for a new service?

A: Ask the agent to generate tests for your service following the integration test pattern. It will:

1. Create `src/__tests__/microservices/<service-name>.test.ts`
2. Use `getInfrastructure()` + `getSchemasByService()`
3. Include 10 integration tests with realistic delays
4. Use Prisma for database operations

### Q: Where do generated tests go?

A: `src/__tests__/microservices/<feature>.test.ts` — they're auto-discovered by the orchestrator.

### Q: Do I need to update the orchestrator?

A: No! The orchestrator uses glob to auto-discover all `*.test.ts` files in `src/__tests__/microservices/`. New tests are automatically included.

### Q: Can I test multiple services in one file?

A: Yes, but keep it focused. One file = one feature/operation across services if needed.
Each agent has a main file:

- `agents/unit-agent/UNIT-TEST-AGENT.md`
- `agents/integration-agent/INTEGRATION-TEST-AGENT.md`
- `agents/e2e-agent/E2E-TEST-AGENT.md`

**This file has everything the agent needs to know.**

### Step 3: Agent Reads Its Skills

When you ask an agent to generate tests:

1. Agent reads the main README (UNIT-TEST-AGENT, etc.)
2. Agent has access to `skills/` subfolder
3. Agent references specific skills as needed
4. Agent uses examples to guide implementation

---

## 🎯 When to Use Each Agent

### Use Unit Test Agent When:

```
✅ Testing a React component
✅ Testing a custom hook
✅ Testing a utility function (formatting, validation)
✅ Testing component logic (click handlers, state changes)
✅ Testing keyboard navigation and accessibility
✅ Testing error/loading/empty states of a component
```

### Use Integration Test Agent When:

```
✅ Testing a server action ('use server')
✅ Testing a route handler (app/api/...)
✅ Testing API integration (fetch calls)
✅ Testing database operations
✅ Testing authorization/authentication logic
✅ Testing input validation at API boundary
✅ Testing error responses (400, 401, 403, 404, 500)
```

### Use E2E Test Agent When:

```
✅ Testing a complete user flow
✅ Testing navigation between pages
✅ Testing forms across multiple pages
✅ Testing login/logout workflow
✅ Testing multi-step checkout
✅ Testing visual regressions
✅ Testing in a real browser with real timing
```

---

## 💡 Real Examples

### Example 1: Testing a Button Component

**You**: "Generate unit tests for Button component in src/components/Button.tsx"

**Unit Test Agent does this:**

1. Reads UNIT-TEST-AGENT.md to understand task
2. Looks at skills/query-strategy.md to know how to query elements
3. Looks at skills/accessibility-testing.md for a11y requirements
4. Looks at examples/button-component.test.tsx for pattern
5. Generates tests/unit/button/button.test.tsx

**Output**: Complete Button tests with:

- ✅ Renders label
- ✅ Click handler fires
- ✅ Disabled state
- ✅ Keyboard activation (Space, Enter)
- ✅ Accessible names

---

### Example 2: Testing applyCoupon Server Action

**You**: "Generate integration tests for ONLY the applyCoupon method in src/app/actions/checkout.ts"

**Integration Test Agent does this:**

1. Reads INTEGRATION-TEST-AGENT.md to understand task
2. Looks at skills/method-scoping.md to understand "ONLY" means single method
3. Looks at skills/msw-stubbing.md to set up HTTP mocking
4. Looks at examples/apply-coupon-action.test.ts for pattern
5. Generates tests/integration/checkout/apply-coupon.test.ts

**Output**: Complete applyCoupon tests with:

- ✅ Valid coupon returns discount (happy path)
- ✅ Invalid format returns error (validation)
- ✅ Expired coupon returns 404 (API error)
- ✅ Unauthorized returns 401 (auth)
- ✅ Network timeout returns error (resilience)
- ✅ All using MSW stubs

---

### Example 3: Testing Checkout Flow

**You**: "Generate E2E tests for the complete checkout flow from product selection to order confirmation"

**E2E Test Agent does this:**

1. Reads E2E-TEST-AGENT.md to understand task
2. Looks at skills/user-flow-testing.md for multi-page navigation
3. Looks at skills/screenshot-recording.md for capturing results
4. Looks at examples/checkout-flow.spec.ts for pattern
5. Generates e2e/checkout/checkout.spec.ts

**Output**: Complete checkout E2E tests with:

- ✅ Add item to cart
- ✅ Navigate to checkout
- ✅ Apply coupon (verify API call)
- ✅ Fill shipping form
- ✅ Submit payment (verify API response)
- ✅ See order confirmation page
- ✅ Take screenshots for visual regression
- ✅ Error paths (invalid card, out of stock)

---

## 🔄 Which Agent for What?

### Scenario: "Test the coupon feature"

**What's involved?**

- Button component "Apply Coupon" → Unit Agent
- Server action `applyCoupon()` → Integration Agent
- Form fills coupon input → Unit Agent (form validation)
- API call validates coupon → Integration Agent (with MSW)
- E2E: User applies coupon in checkout → E2E Agent

**All three agents work together on different layers!**

---

## ✅ Verification Checklist

After creating all three agents, verify:

```
□ agents/unit-agent/ folder exists with:
  - UNIT-TEST-AGENT.md
  - skills/ subfolder with 8+ documents
  - examples/ subfolder with 4+ test examples

□ agents/integration-agent/ folder exists with:
  - INTEGRATION-TEST-AGENT.md
  - skills/ subfolder with 8+ documents
  - examples/ subfolder with 4+ test examples

□ agents/e2e-agent/ folder exists with:
  - E2E-TEST-AGENT.md
  - skills/ subfolder with 8+ documents
  - examples/ subfolder with 4+ test examples

□ Each agent is self-contained (copy folder = agent has everything)
□ Each agent README clearly explains its purpose
□ Each skill document is specific and actionable
□ Each example file shows real test code
```

---

## 🎓 Learning Path

### New to Testing?

1. Start with Unit Agent (smallest scope)
2. Move to Integration Agent (API boundaries)
3. Graduate to E2E Agent (full flows)

### Familiar with Testing?

1. Pick the agent for your current task
2. Read the main README (UNIT-TEST-AGENT, etc.)
3. Reference specific skills as needed
4. Use examples for code patterns

### Building a Feature?

1. **Unit Agent** → Test components/hooks
2. **Integration Agent** → Test server actions/APIs
3. **E2E Agent** → Test complete user flow

---

## 📞 Escalation Guide

**Agent doesn't have what you need?**

| Situation                     | Solution                                                   |
| ----------------------------- | ---------------------------------------------------------- |
| Need to test component A11y   | Unit Agent has accessibility-testing.md                    |
| Need to stub HTTP calls       | Integration Agent has msw-stubbing.md                      |
| Need to verify API request    | Integration Agent has examples showing network inspection  |
| Need to wait for element      | E2E Agent has async-e2e.md                                 |
| Need to test form interaction | Unit Agent (component) + Integration Agent (server action) |
| Need to test auth flow        | Integration Agent (server-side) + E2E Agent (user journey) |

---

## 🚀 You're Ready!

You now have **three complete, independent testing agents**.

Each agent:

- ✅ Has a clear purpose
- ✅ Has complete documentation
- ✅ Has practical examples
- ✅ Can stand alone
- ✅ Knows everything needed for its specialty

**To generate tests**:

1. Pick the right agent for your task
2. Provide the file path, method name (if applicable), and feature spec
3. Agent uses its skills folder to generate complete, tested code

**To onboard a new developer:**

- Copy an agent folder
- Developer has everything they need
- No "wait, where's the pattern?" moments

---

## 📚 Complete Knowledge Map

```
UNIT TESTING KNOWLEDGE
├── Query Elements (getByRole, getByLabel, getByText)
├── User Interactions (clicks, fills, keyboard)
├── Accessibility Testing (labels, keyboard nav, focus)
├── Test Data (factories, overrides)
├── Edge Cases (empty, loading, error states)
├── Mocking (vi.fn, vi.mock)
├── Isolation (reset mocks, no shared state)
└── Determinism (waitFor, no arbitrary timeouts)

INTEGRATION TESTING KNOWLEDGE
├── HTTP Mocking (MSW setup, handlers, overrides)
├── Server Actions (calling directly, errors, responses)
├── Route Handlers (GET, POST, PUT, DELETE)
├── Error Handling (400, 401, 403, 404, 500)
├── Security Testing (auth, permissions, tokens)
├── Input Validation (type, length, constraints)
├── Async Operations (timeouts, retries)
└── Method Scoping (test single method only)

E2E TESTING KNOWLEDGE
├── User Flows (multi-page, navigation)
├── Form Filling (text, select, checkbox, radio)
├── Form Submission (buttons, enter, validation)
├── Waiting (waitFor, waitForURL, waitForResponse)
├── Screenshots (capture, compare, visual regression)
├── Network Inspection (verify API calls)
├── Auth Flows (login, logout, protected pages)
└── Responsive Testing (mobile, tablet, desktop)
```

---

**Last updated**: 2025-11-11
**Agents**: 3 (Unit, Integration, E2E)
**Total Knowledge Documents**: 25+
**Ready to Use**: Yes ✅
