---
name: skill-refactoring-guide
description: >
  Guide for converting existing skill documentation to the minimal format.
  Use when refactoring large skill sets, especially for a 300+ table schema where
  clarity and scannability become critical.
---

# Skill Refactoring Guide — Converting to Minimal Format

## Overview

You have **10 comprehensive skills** documenting integration test patterns. To prepare for scaling to a **300+ table schema**, refactor them to the **minimal format** that:

- ✅ Is scannable (metadata at top, TL;DR visible immediately)
- ✅ Is Claude-friendly (progressive disclosure, searchable triggers)
- ✅ Scales (one clear pattern per skill, not walls of prose)
- ✅ Is referenceable (examples, links to related skills)

---

## Refactoring Checklist

For each skill file, apply this checklist:

### Phase 1: Add Minimal Metadata

- [ ] Rename header if needed (remove emoji, make searchable)
- [ ] Add metadata block at top:
  ```yaml
  ---
  name: kebab-case-skill-name
  description: >
    What this does. When to use it.
    (Searchable keywords and triggers.)
  ---
  ```
- [ ] Remove old `id:` and `owner:` fields (not needed)

**Example**:

```yaml
# OLD
---
id: integration-infrastructure-singleton
owner: integration-test-agent
---
# NEW
---
name: access-infrastructure-singleton
description: >
  Get the shared infrastructure singleton. Use when:
  initializing a test, accessing containers, logging metrics.
---
```

### Phase 2: Structure Content

- [ ] Add **PURPOSE** section (1–3 sentences, state outcome)
- [ ] Add **When to use** section with:
  - Trigger words / domain nouns
  - Input expectations
  - What NOT to use for (boundaries)
- [ ] Add **Quick start** (3 numbered steps max)
- [ ] Add **Workflow** (Gather → Execute → Validate)
- [ ] Add **File & tool use** (what to read, what to run)
- [ ] Add **Guardrails** (scope boundaries, what to refuse)

### Phase 3: Compress Examples

- [ ] Keep only 2–3 core examples
- [ ] Each example: 5–10 lines max with inline comments
- [ ] Format: `Example A: <scenario> → <expected result>`
- [ ] Link to full examples in the examples/ folder

### Phase 4: Troubleshooting

- [ ] Add symptom → cause → fix entries (3–5 items)
- [ ] Keep it short and actionable
- [ ] Link to related skills if needed

### Phase 5: Changelog

- [ ] Add `v0.2 – Refactored to minimal skill format`
- [ ] Keep previous versions listed

### Phase 6: Cross-Reference

- [ ] **Next step**: Link to the skill that follows logically
- [ ] **Related**: Link to skills this skill depends on or precedes

---

## Refactoring Template

Use this template as a starting point for each skill:

````markdown
---
name: your-skill-name
description: >
  What this does. When to use it.
  (Searchable trigger keywords.)
---

# Your Skill Name

**PURPOSE**: <Outcome in 1–2 sentences>

## When to use

- **Triggers**: <domain nouns/verbs that signal when to use>
- **Input**: <data types, files, URLs>
- **Output**: <artifact produced>
- **Not for**: <out-of-scope cases>

## Quick start

1. Do <step>.
2. If <branch>, do <step>.
3. Produce <result>.

## Workflow

- **Gather**: <validation/questions>
- **Execute**: <recipe>
- **Validate**: <checks>

## File & tool use

- Read: <reference docs>
- Run: <scripts if deterministic>
- Prefer: <when to code vs prompt>

## Guardrails

- <Safety boundary 1>
- <Safety boundary 2>

## Examples

**Example A**: <Scenario> → <Result>

```<code>

```
````

**Example B**: <Scenario> → <Result>

```<code>

```

## Troubleshooting

- **Symptom** → Cause → Fix
- **Symptom** → Cause → Fix

## Changelog

- v0.2 – Refactored to minimal skill format
- v0.1 – Initial version

---

**Next**: <Link to next logical skill>

```

---

## Skills Refactoring Order

Recommended order (dependencies flow top→bottom):

1. ✅ **access-infrastructure-singleton** (already done)
2. ✅ **select-random-schema** (already done)
3. **perform-crud-operations** (prisma-crud-patterns.md)
4. **include-production-delays** (production-delays.md)
5. **generate-test-data** (test-data-factories.md)
6. **test-error-scenarios** (error-handling-testing.md)
7. **test-multi-service-workflows** (multi-service-testing.md)
8. **record-execution-metrics** (test-execution-recording.md)
9. **place-test-file** (orchestrator-pattern.md)
10. **verify-test-quality** (checklist-integration.md)

**Why this order?**: Each skill builds on prior ones conceptually:
- Infrastructure access is first
- Schema selection uses infrastructure
- CRUD uses schemas
- Delays wrap CRUD
- Data factories feed CRUD
- Error handling wraps CRUD
- Multi-service composes CRUD across services
- Recording wraps everything
- File placement explains orchestrator
- Checklist validates all

---

## For a 300+ Table Schema

When you scale to 300+ tables, organize by **data domain**, not by "all CRUD":

**OLD (too broad)**:
```

skills/
├── prisma-crud-patterns.md (50+ operation examples, hard to search)
└── ...

```

**NEW (domain-focused)**:
```

skills/
├── CRUD/
│ ├── perform-create-operations.md
│ ├── perform-read-operations.md
│ ├── perform-update-operations.md
│ ├── perform-delete-operations.md
│ ├── perform-transaction-operations.md
│ └── perform-pagination-operations.md
├── ERRORS/
│ ├── test-validation-errors.md
│ ├── test-constraint-errors.md
│ ├── test-timeout-errors.md
│ └── test-concurrency-errors.md
├── PERFORMANCE/
│ ├── prevent-n-plus-1-queries.md
│ ├── use-pagination-efficiently.md
│ ├── handle-large-result-sets.md
│ └── ...
└── examples/
├── auth/
├── payment/
├── inventory/
└── ... (5+ service folders)

````

**Benefits**:
- Easier to search by domain
- Clearer boundaries
- Scales to 300+ tables
- Each skill is focused (not a mega-file)

---

## Refactoring Priority

**Tier 1 (High Priority — Core Patterns)**:
- [ ] perform-crud-operations
- [ ] include-production-delays
- [ ] generate-test-data
- [ ] test-error-scenarios

**Tier 2 (Medium Priority — Quality & Integration)**:
- [ ] test-multi-service-workflows
- [ ] record-execution-metrics
- [ ] place-test-file

**Tier 3 (Lower Priority — Reference)**:
- [ ] verify-test-quality (checklist is already good format)

---

## Key Principles for Refactoring

1. **Minimal = 200 lines max** (compress aggressively)
   - Remove repetitive explanations
   - Link to related skills instead of duplicating
   - Use collapsible examples in long docs

2. **Searchable metadata** (Claude will grep for triggers)
   ```yaml
   description: >
     Searchable keywords: create, insert, write, save
     (Include domain terms that trigger this skill)
````

3. **Progressive disclosure**

   - Busy user? Read TL;DR
   - Have time? Read full Workflow
   - Need deep dive? Read examples/ folder

4. **Deterministic code**

   - If it's a parsing/sorting/filtering problem → **Run a script**
   - If it's a creative/decision problem → **Use Claude**
   - Skills guide **when** to run code, not just "use code"

5. **Safety guardrails**
   - Say what's OUT of scope upfront
   - Propose safe alternatives, don't just refuse
   - Make it easy to know when NOT to use a skill

---

## After Refactoring

Once all 10 skills are refactored:

1. ✅ Update `INTEGRATION_AGENT_MASTER.md` with new skill names and file references
2. ✅ Add skills to master file's Skills Reference Documentation table
3. ✅ Verify all skill files are in `skills/` folder
4. ✅ Create example files for new service patterns
5. ✅ Update README.md with new file structure

---

## Example: Refactoring `prisma-crud-patterns.md` → `perform-crud-operations.md`

### BEFORE (Comprehensive, 450+ lines)

````markdown
---
id: integration-prisma-crud
owner: integration-test-agent
---

# Prisma CRUD Patterns

## CREATE Operations

### Basic Create

```typescript
const user = await schema.prisma.user.create({
  data: { email: "..." },
});
```
````

[30+ more examples...]

## READ Operations

[50+ examples...]

## UPDATE Operations

[40+ examples...]

## DELETE Operations

[35+ examples...]

---

## Performance Tips

[10+ tips about N+1, pagination, etc.]

````

### AFTER (Minimal, 120 lines)

```markdown
---
name: perform-crud-operations
description: >
  Execute CREATE, READ, UPDATE, DELETE operations via Prisma.
  Use when: generating data, querying results, modifying records.
  Covers: create(), findUnique(), findMany(), update(), delete().
---

# Perform CRUD Operations

**PURPOSE**: Interact with the database via Prisma client.
Every integration test uses this for data operations.

## When to use
- **Triggers**: "create user", "fetch record", "update payment", "delete session"
- **Input**: schema.prisma client, data to create/update, where clause for queries
- **Output**: Created/fetched/updated/deleted record(s)
- **Not for**: Creating database schemas (use orchestrator); raw SQL queries (use Prisma)

## Quick start
1. Call operation: `const user = await schema.prisma.user.create({data: {...}})`
2. Query result: `const found = await schema.prisma.user.findUnique({where: {...}})`
3. Verify: `expect(found.id).toBeDefined()`

## Workflow
- **Gather**: Know table name and shape (from Prisma schema.prisma)
- **Execute**: Use appropriate Prisma method (see examples)
- **Validate**: Check returned record matches expectations

## File & tool use
- Read: Prisma docs for specific table operations
- Run: None (Prisma is declarative)

## Guardrails
- Use schema.prisma only (not global PrismaClient)
- Tables are determined by schema.prisma (read it first)
- No raw SQL; Prisma handles database portability
- Transactions for multi-operation atomicity

## Examples

**Example A**: Create with validation
```typescript
const user = await schema.prisma.user.create({
  data: { email: "test@example.com", role: "user" }
});
expect(user.id).toBeDefined();
````

**Example B**: Query with filter

```typescript
const users = await schema.prisma.user.findMany({
  where: { role: "admin" },
  take: 10,
});
expect(users.length).toBeGreaterThan(0);
```

**Example C**: Update and verify

```typescript
const updated = await schema.prisma.user.update({
  where: { id: userId },
  data: { role: "admin" },
});
expect(updated.role).toBe("admin");
```

## Troubleshooting

- **Error: "Unknown table"** → Check Prisma schema.prisma for correct table name
- **Error: "Required field missing"** → Check required fields in schema.prisma
- **Records not saved** → Use await; Prisma is asynchronous

## Changelog

- v0.2 – Refactored to minimal skill format
- v0.1 – Comprehensive CRUD guide

---

**Next**: Use `include-production-delays.md` to add realistic timing.
**Related**: `generate-test-data.md` for how to create test data.

```

**Compression achieved**: 450 lines → 120 lines (73% reduction)
**Clarity improved**: Clear when to use, searchable triggers, short examples

---

## Next Steps

1. **Start with Tier 1 skills** (4 highest-impact skills)
2. **Use the template** above consistently
3. **Compress aggressively** (100–200 lines per skill is goal)
4. **Link liberally** (use "Related:" and "Next:" sections)
5. **Test with Claude** (feed refactored skill, see if it understands triggers)

---

**Status**: Ready to refactor incrementally. Start with `prisma-crud-patterns.md` → `perform-crud-operations.md`.

```
