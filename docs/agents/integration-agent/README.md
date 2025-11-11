---
id: integration-agent-readme
title: Integration Test Agent Documentation
---

# 🔗 Integration Test Agent

## Welcome

This folder contains **complete documentation** for the Integration Test Agent — an AI assistant trained to generate high-quality integration tests for your microservices using real PostgreSQL databases.

All documentation is **generic** and reusable across any project with a Prisma-based test suite.

---

## 🚀 Quick Start

### New to the agent? Start here:

1. **Read** `INTEGRATION_AGENT_MASTER.md` (10 min - complete guide with all skills and rules)
2. **Read** relevant skill file(s) from `skills/`
3. **Review** matching example file for your service
4. **Follow** patterns and examples in skill files
5. **Generate** test using patterns

### Need to generate a test right now?

1. **Identify your task**: "I need to test login flow"
2. **Read** `INTEGRATION_AGENT_MASTER.md` for skill references (maps triggers → skill files)
3. **Read** relevant skill files from the skills reference table
4. **Copy example code** from `skills/example-auth-registration.md` and adapt for your feature
5. **Validate** using the checklist in `skills/checklist-integration.md` before committing

---

## 📚 What's Here

### Master Reference

| File                           | Purpose                                      | For                           |
| ------------------------------ | -------------------------------------------- | ----------------------------- |
| **INTEGRATION_AGENT_MASTER.md** | Master guide with all skills, rules, and file references | Everyone |
| **SKILL_TEMPLATE.md**          | Template for minimal skill format            | Creating new skills           |
| **SKILL_REFACTORING_GUIDE.md** | Guide for refactoring large skill documents  | Maintaining documentation     |
| **SCALING_TO_300_TABLES.md**   | Plan for scaling to large Prisma schemas     | Growth planning               |

### Core Documentation

| File                        | Purpose                                    | Read Time |
| --------------------------- | ------------------------------------------ | --------- |
| `INTEGRATION_AGENT_MASTER.md` | **Master guide** — all skills, rules, workflow, file references | 20 min |
| `README.md` (this file) | Quick start and navigation | 5 min |

### Skills (10 Core Patterns) — All Generic & Reusable

Each skill is focused (~100-150 lines), documented, and exemplified:

| Skill                        | File                               | Purpose                                  |
| ---------------------------- | ---------------------------------- | ---------------------------------------- |
| **access-infrastructure**    | infrastructure-singleton.md | Get shared infra singleton               |
| **place-test-file**          | orchestrator-pattern.md            | Determine file location & naming         |
| **select-schema**            | schema-selection.md            | Pick random database schema              |
| **perform-crud-operations**  | prisma-crud-patterns.md            | Create, read, update, delete data        |
| **generate-test-data**       | test-data-factories.md             | Generate realistic test data             |
| **include-realistic-delays** | production-delays.md               | Add realistic timing (50-10000ms)        |
| **test-error-scenarios**     | error-handling-testing.md          | Test validation, constraints, edge cases |
| **test-multi-service-flows** | multi-service-testing.md           | Test cross-service operations (optional) |
| **record-test-metrics**      | test-execution-recording.md        | Log execution metrics & performance      |
| **verify-test-quality**      | checklist-integration.md           | Validate test before committing          |

→ **All skills are generic** and work for any database, any service, any Prisma schema

### Examples (5 Service Templates)

Each example: 10 complete tests following all patterns

1. **example-auth-registration.md** — Auth service template
2. **example-payment-processing.md** — Payment service template
3. **example-inventory-adjustment.md** — Inventory service template
4. **example-analytics-tracking.md** — Analytics service template
5. **example-notification-delivery.md** — Notification service template

→ **Copy and adapt for your specific services**

- ❌ Unit tests (that's a different agent)
- ❌ E2E tests (that's a different agent)
- ❌ UI component tests (that's a different agent)
- ❌ Tests with HTTP mocks (we use real databases)
- ❌ Tests with external API calls (they're deterministic)

---

## 🔍 Finding What You Need

### "I need to understand how to access the shared infrastructure"

→ Read `infrastructure-singleton.md` (20 min)

### "I need to understand how to write database queries"

→ Read `prisma-crud-patterns.md` (30 min)

### "I need to understand how to test errors"

→ Read `error-handling-testing.md` (20 min)

### "I need a complete working example"

→ Read `example-auth-registration.md` (20 min)

### "I need to verify my generated tests are correct"

→ Use `checklist-integration.md` (10 min)

### "I need to understand how tests integrate into the system"

→ Read `orchestrator-pattern.md` (15 min)

### "I'm generating tests for [service], which example should I use?"

| Service      | Example File                       |
| ------------ | ---------------------------------- |
| auth         | `example-auth-registration.md`     |
| payment      | `example-payment-processing.md`    |
| inventory    | `example-inventory-adjustment.md`  |
| analytics    | `example-analytics-tracking.md`    |
| notification | `example-notification-delivery.md` |

---

## 📋 Common Workflows

### Generating a New Test File

1. Decide which service and feature (e.g., "auth" + "password-reset")
2. Read checklist-integration.md **pre-generation section**
3. Find relevant example file
4. Copy the structure and modify for your feature
5. Generate 10 tests following the pattern
6. Use checklist-integration.md **post-generation section** to verify
7. Place in `src/__tests__/microservices/<feature>.test.ts`
8. Run tests: they'll auto-integrate and execute

### Understanding a Specific Pattern

1. Go to `INTEGRATION_AGENT_MASTER.md`
2. Find the skill in the Skills Reference Documentation table
3. Navigate to the skill file in `skills/`
4. Read that skill completely
5. See examples in the file and in example test files

### Troubleshooting Generated Tests

1. Check against **post-generation checklist** in `checklist-integration.md`
2. Compare against relevant **example test file**
3. Verify **infrastructure access** with `infrastructure-singleton.md`
4. Verify **database operations** with `prisma-crud-patterns.md`
5. Verify **file placement** with `orchestrator-pattern.md`

---

## 🎓 Reading Paths

### Path 1: Complete Understanding (2-3 hours)

For those who want to deeply understand the agent:

1. `INTEGRATION_AGENT_MASTER.md` (20 min)
2. All 10 skill files (1-2 hours)
3. Review all 5 example files (1 hour)
4. `checklist-integration.md` (quality assurance)

**Result**: Deep understanding of all patterns and ready to generate anything

### Path 2: Quick Learning (45 minutes)

For those who want to generate tests quickly:

1. `INTEGRATION_AGENT_MASTER.md` (10 min)
2. Relevant example file (20 min)
3. Relevant skills (10-15 min)
4. Checklist sections (5 min)

**Result**: Ready to generate tests following examples

### Path 3: Reference Only (5-15 minutes per lookup)

For those who already know patterns and need specific answers:

1. Use `INTEGRATION_AGENT_MASTER.md` Skills Reference Documentation to find the right file
2. Jump to that skill file in `skills/`
3. Find the specific pattern or example
4. Use as reference while generating

**Result**: Quick lookup of specific patterns

---

## ✨ What Makes This Agent Special

1. **Architecture-Aligned**: Understands your real PostgreSQL + Prisma setup
2. **Infrastructure-Aware**: Knows about singleton pattern and schema selection
3. **Pattern-Driven**: Follows exact same patterns as existing tests
4. **Error-Complete**: Covers 10 different error scenarios
5. **Multi-Service Ready**: Can test workflows across services
6. **Observable**: Records metrics for all tests
7. **Auto-Integrating**: Files placed in right location are auto-discovered
8. **Well-Documented**: 5000+ lines of documentation with 200+ examples

---

## 🚨 Important Notes

### For The AI Agent

**YOU ARE**: The Integration Test Agent trained on this documentation
**YOUR ROLE**: Generate integration tests following these patterns
**YOUR SKILLS**: 10 core patterns fully documented in this folder
**YOUR EXAMPLES**: 5 complete test files showing all patterns
**YOUR CHECKLIST**: Pre/post generation quality verification

### For The User

**THIS DOCUMENTATION**: Teaches everything you need to generate integration tests
**THESE PATTERNS**: Match your actual testing architecture and practices
**THESE EXAMPLES**: Are production-ready and can be used directly
**THIS CHECKLIST**: Ensures generated tests are correct

---

## 📈 Success Metrics

Generated tests are successful when they:

- ✅ Have exactly 10 tests
- ✅ Use `getInfrastructure()` to access shared singleton
- ✅ Use `getSchemasByService()` to pick random schemas
- ✅ Use Prisma for all CRUD operations
- ✅ Include `simulateProductionOperation()` for delays
- ✅ Generate test data with `generateTestData()`
- ✅ Test error scenarios with try/catch
- ✅ Record metrics with `recordTestExecution()`
- ✅ Are placed in `src/__tests__/microservices/<feature>.test.ts`
- ✅ All tests pass and auto-integrate

---

## 🤝 Questions?

**"How do I access infrastructure in my test?"**
→ See `infrastructure-singleton.md`

**"How do I write database queries?"**
→ See `prisma-crud-patterns.md`

**"What should my test file look like?"**
→ See any `example-*.md` file

**"How do I test errors?"**
→ See `error-handling-testing.md`

**"Where do I put my test file?"**
→ See `orchestrator-pattern.md`

**"How do I verify my tests are correct?"**
→ See `checklist-integration.md`

---

## 📄 File Manifest

```
integration-agent/
├── README.md                          ← You are here
├── INTEGRATION_AGENT_MASTER.md        ← Master guide (read this first)
├── SKILL_TEMPLATE.md                  ← How to create new skills
├── SKILL_REFACTORING_GUIDE.md         ← How to improve skills
├── SCALING_TO_300_TABLES.md           ← Growth plan for 100+ tables
│
└── skills/
    ├── infrastructure-singleton.md    ← Get shared infra
    ├── orchestrator-pattern.md        ← File placement & structure
    ├── schema-selection.md            ← Pick random schema
    ├── prisma-crud-patterns.md        ← Database operations
    ├── test-data-factories.md         ← Generate test data
    ├── production-delays.md           ← Realistic timing (50-10000ms)
    ├── error-handling-testing.md      ← Test error scenarios
    ├── multi-service-testing.md       ← Cross-service testing
    ├── test-execution-recording.md    ← Record metrics
    ├── checklist-integration.md       ← Quality validation
    │
    ├── example-auth-registration.md        ← Auth service example
    ├── example-payment-processing.md       ← Payment service example
    ├── example-inventory-adjustment.md     ← Inventory service example
    ├── example-analytics-tracking.md       ← Analytics service example
    └── example-notification-delivery.md    ← Notification service example
```

**Total**: 6 documentation files + 15 skill files (10 core + 5 examples)

---

**Status**: ✅ Complete and ready for use
**Last Updated**: 2025-01-09
**Documentation**: 5000+ lines across 19 files
**Code Examples**: 200+ production-ready examples
