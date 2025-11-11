---
name: scaling-guide-300-tables
description: >
  How to organize skills and documentation for a 300+ table Prisma schema.
  Use when refactoring skills for production systems with complex data models.
---

# Scaling Integration Test Agent to 300+ Table Schema

## Challenge: Scalability

When your Prisma schema grows from **20 tables → 300+ tables**, the current skill organization breaks:

| Problem                     | Current Approach                                                             | Scaled Approach                                                                     |
| --------------------------- | ---------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| **One mega-skill**          | `perform-crud-operations.md` (450+ lines covering CREATE/READ/UPDATE/DELETE) | Split into 6 focused skills (create, read, update, delete, transaction, pagination) |
| **No domain context**       | Skills are generic ("error handling")                                        | Skills are domain-focused ("test payment validation errors")                        |
| **Hard to navigate**        | 10 skills + 5 examples = 15 files                                            | Organized by data domain: CRUD/, ERRORS/, PERFORMANCE/, etc.                        |
| **Examples don't scale**    | 5 examples (auth, payment, inventory, analytics, notification)               | 50+ examples organized by service                                                   |
| **One-size-fits-all rules** | Single "checklist" for all tests                                             | Domain-specific checklists (payment checklist ≠ auth checklist)                     |

---

## Proposed Organization

### Current (Works for 20 tables)

```
skills/
├── access-infrastructure-singleton.md
├── select-random-schema.md
├── prisma-crud-patterns.md
├── production-delays.md
├── test-data-factories.md
├── error-handling-testing.md
├── multi-service-testing.md
├── test-execution-recording.md
├── orchestrator-pattern.md
├── checklist-integration.md
├── msw-stubbing.md (deprecated)
├── method-scoping.md (deprecated)
└── examples/
    ├── auth/
    ├── payment/
    ├── inventory/
    ├── analytics/
    └── notification/
```

**Scale problem**: As you add 10 more test domains, this becomes cluttered. New CRUD operation? Add to existing mega-file.

---

### Proposed (Scales to 300+ tables)

```
skills/
├── INFRASTRUCTURE/
│   ├── access-singleton.md
│   ├── use-container-manager.md
│   ├── manage-memory.md
│   └── record-metrics.md
│
├── SCHEMA/
│   ├── select-schema.md
│   ├── analyze-schema.md
│   └── map-table-relationships.md
│
├── CRUD/
│   ├── create-records.md
│   ├── read-records.md
│   ├── update-records.md
│   ├── delete-records.md
│   ├── batch-operations.md
│   ├── transaction-handling.md
│   └── pagination-filtering.md
│
├── ERRORS/
│   ├── constraint-violations.md
│   ├── validation-failures.md
│   ├── timeout-handling.md
│   ├── concurrency-conflicts.md
│   ├── foreign-key-errors.md
│   └── permission-errors.md
│
├── PERFORMANCE/
│   ├── prevent-n-plus-1.md
│   ├── optimize-queries.md
│   ├── use-indexes-effectively.md
│   ├── handle-large-datasets.md
│   └── measure-query-performance.md
│
├── DATA/
│   ├── generate-factories.md
│   ├── seed-databases.md
│   ├── generate-realistic-values.md
│   └── manage-test-data-lifecycle.md
│
├── INTEGRATION/
│   ├── test-multi-service.md
│   ├── handle-eventual-consistency.md
│   ├── test-event-propagation.md
│   └── mock-external-services.md
│
├── QUALITY/
│   ├── validate-test-coverage.md
│   ├── check-schema-alignment.md
│   ├── measure-reliability.md
│   └── detect-flaky-tests.md
│
├── TIMING/
│   ├── include-realistic-delays.md
│   ├── handle-race-conditions.md
│   └── manage-timeouts.md
│
├── ORCHESTRATION/
│   ├── file-placement.md
│   ├── test-generation.md
│   └── cleanup.md
│
└── examples/
    ├── auth/
    │   ├── login.test.ts
    │   ├── mfa.test.ts
    │   ├── permissions.test.ts
    │   └── session.test.ts
    │
    ├── payment/
    │   ├── checkout.test.ts
    │   ├── refund.test.ts
    │   ├── fraud-detection.test.ts
    │   └── reconciliation.test.ts
    │
    ├── inventory/
    │   ├── stock-levels.test.ts
    │   ├── reservations.test.ts
    │   ├── transfers.test.ts
    │   └── forecasts.test.ts
    │
    ├── analytics/
    │   ├── events.test.ts
    │   ├── funnels.test.ts
    │   ├── cohorts.test.ts
    │   └── dashboards.test.ts
    │
    ├── notification/
    │   ├── email.test.ts
    │   ├── sms.test.ts
    │   ├── push.test.ts
    │   └── scheduling.test.ts
    │
    ├── [10+ more services]/
    │   └── ...
    │
    └── [domains unique to your system]/
        └── ...
```

**Scale benefit**: Each skill is focused (100–150 lines). Adding a new error type? Create `new-error-type.md` in ERRORS/. New service? Create service/ folder in examples/. No file bloat.

---

## Migration Path: Current → Scaled

### Phase 1: Refactor Current Skills (You are here)

- [ ] Convert 10 core skills to minimal format
- [ ] Compress 250–450 lines → 100–150 lines each
- [ ] Add searchable metadata and triggers
- **Timeline**: 1–2 weeks
- **Result**: Same coverage, better structure

### Phase 2: Split Core Skills Into Domain-Focused Skills

- [ ] `prisma-crud-patterns.md` → `CRUD/create-records.md`, `read-records.md`, etc.
- [ ] `error-handling-testing.md` → `ERRORS/constraint-violations.md`, `validation-failures.md`, etc.
- [ ] `test-data-factories.md` → `DATA/generate-factories.md`, `seed-databases.md`, etc.
- **Timeline**: 2–3 weeks
- **Result**: 30+ focused skills, easier to navigate

### Phase 3: Add Domain-Specific Examples

- [ ] Expand examples/ to include 10+ service folders
- [ ] Each service has 4–6 test examples
- [ ] Link from skills to examples
- **Timeline**: 2–4 weeks (parallelize with Phase 2)
- **Result**: 50+ runnable examples

### Phase 4: Create Reference Documentation (Optional)

- [ ] `REFERENCE.md`: All 300+ table names, relationships, constraints
- [ ] `PLAYBOOK.md`: Copy-runnable checklists per service
- [ ] `scripts/`: Helper tools (schema parser, test scaffolder, validator)
- **Timeline**: 2–3 weeks (after Phase 1–3)
- **Result**: Self-service tooling for large schema

---

## Tier 1: Start Here (Minimal, High-Impact)

Focus on **Phase 1** first — refactor existing skills to minimal format. Then move to **Phase 2** for the most-used skills (CRUD, ERRORS, DATA).

### Why Tier 1 First?

1. **Low risk**: No new files, just reformatting
2. **High clarity**: Minimal format is easier to search and parse
3. **Foundation**: Creates pattern for Phase 2
4. **Quick win**: Demonstrates progress

**Tier 1 Checklist**:

- [ ] Refactor all 10 core skills (use SKILL_REFACTORING_GUIDE.md)
- [ ] Add metadata (searchable triggers)
- [ ] Compress to 100–150 lines each
- [ ] Add troubleshooting section to each
- [ ] Update INTEGRATION_AGENT_MASTER.md with new skill references
- [ ] Test with Claude (does it understand triggers?)

**Expected time**: 1–2 weeks

---

## Tier 2: Scale Skills (Domain-Focused)

Once Tier 1 is done, split mega-skills into domain-focused ones:

### CRUD Skills (Split from `perform-crud-patterns.md`)

- `create-records.md` – CREATE operations (tables, validations, constraints)
- `read-records.md` – SELECT operations (queries, filters, pagination)
- `update-records.md` – UPDATE operations (partial updates, cascades, versioning)
- `delete-records.md` – DELETE operations (soft deletes, cascades, archival)
- `batch-operations.md` – Bulk CREATE/UPDATE/DELETE
- `transaction-handling.md` – Multi-operation transactions (ACID guarantees)
- `pagination-filtering.md` – Pagination, sorting, complex filters

**Benefit**: Each is 120 lines focused on one thing. No mega-file.

### ERROR Skills (Split from `error-handling-testing.md`)

- `constraint-violations.md` – UNIQUE, FOREIGN KEY, CHECK constraint errors
- `validation-failures.md` – Input validation, length, format, range errors
- `timeout-handling.md` – Query timeouts, lock waits, slow operations
- `concurrency-conflicts.md` – Race conditions, lost updates, version conflicts
- `foreign-key-errors.md` – Referential integrity, cascade behavior
- `permission-errors.md` – Authorization failures, access control

**Benefit**: Clear domain separation. Test "payment constraint violation"? Use constraint-violations.md. Test "user auth timeout"? Use timeout-handling.md.

### DATA Skills (Split from `test-data-factories.md`)

- `generate-factories.md` – Factory functions (Builder pattern, Faker)
- `seed-databases.md` – Bulk inserts, initial state, test datasets
- `generate-realistic-values.md` – Realistic test data (names, emails, addresses)
- `manage-test-data-lifecycle.md` – Setup/teardown, cleanup, isolation

**Benefit**: Data generation is decoupled from test execution.

---

## Tier 3: Add Examples & Support (Complete Picture)

Once Tier 1–2 are done, expand examples and add reference docs:

### Examples Structure

```
examples/
├── auth/                    # Service domain
│   ├── README.md           # How to use auth examples
│   ├── login.test.ts       # Login flow (uses create-records, handle-delays)
│   ├── mfa.test.ts         # Multi-factor auth
│   ├── permissions.test.ts # Authorization checks
│   └── session.test.ts     # Session management
│
├── payment/
│   ├── README.md
│   ├── checkout.test.ts    # Uses transaction-handling
│   ├── refund.test.ts      # Uses update-records
│   ├── fraud-detection.test.ts  # Uses constraint-violations
│   └── reconciliation.test.ts
│
├── [10+ more services]
└── [domain-specific examples]
```

**Benefit**: Clear mapping from skill → runnable example. Claude can jump from "test transaction" → `transaction-handling.md` → `examples/payment/checkout.test.ts`.

### Support Documentation

- `REFERENCE.md` – All 300+ tables, relationships, constraints (for humans, not Claude)
- `PLAYBOOK.md` – Copy-runnable checklists (auth checklist, payment checklist, etc.)
- `scripts/` – Helpers (schema parser, test scaffolder, error classifier)

**Benefit**: Self-service for large schemas. New developer? Read PLAYBOOK.md + example test, don't ask Claude.

---

## Decision Tree: Which Tier Are You In?

**If you have < 30 tables**:

- ✅ Use **Tier 1** only (refactored, minimal format)
- No need to split skills

**If you have 30–100 tables**:

- ✅ Use **Tier 1 + Tier 2** (domain-focused skills)
- Split CRUD, ERRORS, DATA
- Keep INTEGRATION, PERFORMANCE, QUALITY as-is

**If you have 100+ tables or plan to reach 300+**:

- ✅ Use **Tier 1 + Tier 2 + Tier 3** (full scaling)
- Split all skills by domain
- Create REFERENCE.md, PLAYBOOK.md, scripts/
- Organize examples by service

---

## Implementation: Start with Tier 1

**Your immediate next steps**:

1. **Complete schema-selection.md refactoring** (it's 80% done)
2. **Refactor prisma-crud-patterns.md** to minimal format
3. **Refactor remaining 8 core skills** using SKILL_REFACTORING_GUIDE.md
4. **Update INTEGRATION_AGENT_MASTER.md** with new skill references
5. **Test with Claude** — feed refactored skill, ask "when should I use this?"

**Then, when ready (2–3 weeks)**:

- Move to **Tier 2**: Split CRUD and ERRORS
- Expand examples/ to 10+ services
- Create REFERENCE.md for your specific schema

---

## Why This Scales

| Dimension               | Current  | Tier 1     | Tier 2  | Tier 3  |
| ----------------------- | -------- | ---------- | ------- | ------- |
| **Number of skills**    | 10       | 10         | 30+     | 50+     |
| **Avg lines per skill** | 250–450  | 100–150    | 100–150 | 100–150 |
| **Lines per file**      | 2500     | 1200       | 3500    | 6000+   |
| **Max file size**       | 450      | 150        | 150     | 150     |
| **Searchability**       | Moderate | High       | High    | High    |
| **Scale to 300 tables** | ❌ No    | ⚠️ Partial | ✅ Yes  | ✅ Yes  |
| **Claude scannability** | Low      | High       | High    | High    |

---

## Quick Reference: When to Use Each Tier

**Tier 1 (Refactor to minimal format)**

- Use for: Small teams (1–3), small schemas (< 50 tables)
- Timeline: Done in 1–2 weeks
- Outcome: Better organization, Claude-friendly

**Tier 2 (Domain-focused skills)**

- Use for: Medium teams (3–10), growing schemas (50–200 tables)
- Timeline: 3–4 weeks (Phase 1–2)
- Outcome: Scalable, maintainable skill set

**Tier 3 (Full reference, playbooks, scripts)**

- Use for: Large teams (10+), complex schemas (200+ tables)
- Timeline: 6–8 weeks (Phases 1–4)
- Outcome: Self-service, production-ready

---

## Example: How Scaling Helps with 300+ Tables

### Without Scaling

```
Claude: "I need to test that a unique constraint fails"
You: "Use error-handling-testing.md"
Claude: [Reads 450-line file, searches for "unique", finds it buried in section 7]
⏳ Time to find pattern: 5–10 minutes
```

### With Scaling (Tier 2)

```
Claude: "I need to test that a unique constraint fails"
You: "Use ERRORS/constraint-violations.md"
Claude: [Reads 120-line file, finds pattern immediately]
⏳ Time to find pattern: 30 seconds
```

### With Scaling (Tier 3)

```
Claude: "I need to test that a unique constraint fails in the payment domain"
You: "Use ERRORS/constraint-violations.md, then see examples/payment/checkout.test.ts"
Claude: [Reads skill, jumps to example, understands context]
⏳ Time to find pattern + context: 1 minute, HIGH confidence
```

---

## Recommended Next Steps

1. **Finish Tier 1** (refactor remaining skills) — **2 weeks**
2. **Plan Tier 2** (domain-focused splits) — **1 week planning, 3 weeks execution**
3. **Plan Tier 3** (reference, playbooks, scripts) — **2 weeks planning, 3 weeks execution**

**Do not skip Tier 1.** It's the foundation for Tier 2–3.

---

**Status**: Framework ready. Proceed with Tier 1 refactoring using SKILL_REFACTORING_GUIDE.md.
