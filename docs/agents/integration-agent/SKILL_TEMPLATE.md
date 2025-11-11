---
name: skill-template
description: >
  Template for creating minimal, scannable skills that guide Claude through
  specific integration testing tasks. Use when building reusable patterns for
  a large test suite (300+ table schemas, 500+ tests).
---

# Skill Template — Minimal Format

Use this template when creating or updating skills. The goal is **maximum clarity with minimal bloat**.

---

## Metadata (Always Include)

```yaml
---
name: my-skill-name # kebab-case identifier
description: >
  What this does. When to use it.
  (One sentence per line, searchable keywords.)
---
```

**Purpose**:

- Name helps skill discovery by keyword
- Description helps Claude match triggers and decide if skill applies

---

## Structure (Progressive Disclosure)

### 1. **PURPOSE** (1–3 lines)

- What outcome does this achieve?
- When would Claude need it?

### 2. **WHEN TO USE** (Quick decision tree)

- Trigger words / domain nouns
- Input expectations (files, URLs, data types)
- What to avoid (out-of-scope)

### 3. **QUICK START** (TL;DR for the impatient)

- 3 numbered steps max
- Expected result
- Links to deep dive if needed

### 4. **WORKFLOW** (Authoritative recipe)

- Gather context → Validate assumptions
- Execute → Handle branches
- Validate → Report

### 5. **FILE & TOOL USE** (What Claude can do)

- Files to read (examples, reference docs)
- Scripts to run (deterministic helpers)
- When to prefer code over prompting

### 6. **GUARDRAILS** (Safety / scope boundaries)

- What NOT to do
- When to refuse / propose alternatives

### 7. **EXAMPLES** (Concrete scenarios)

- Example A: scenario → expected output
- Example B: edge case → handling

### 8. **TROUBLESHOOTING** (Quick fixes)

- Symptom → Root cause → Solution

### 9. **CHANGELOG** (Version history)

- v0.1 – What changed
- v0.2 – What changed

---

## Minimal Example

````markdown
---
name: select-random-schema
description: >
  Pick a random database schema from a service (auth, payment, inventory, etc.).
  Use this when: generating tests, simulating production load distribution,
  or accessing multi-tenant data. NOT for direct table operations; use prisma-crud-patterns for that.
---

# Select Random Schema

**PURPOSE**: Ensure test load is distributed across all schemas, simulating
production where different customers/regions use different physical databases.

## When to use

- **Triggers**: "test auth login", "inventory adjustment", "analytics event"
- **Input**: service name (auth | payment | inventory | analytics | notification)
- **Output**: random schema object with `.prisma` client, `.schemaName`
- **Not for**: direct CRUD; use schema.prisma after selection

## Quick start

1. Get service schemas: `const schemas = await getSchemasByService("auth")`
2. Pick random: `const schema = schemas[Math.floor(Math.random() * schemas.length)]`
3. Use in test: `const user = await schema.prisma.user.create({...})`

## Workflow

- **Gather**: Know service name (5 valid: auth, payment, inventory, analytics, notification)
- **Execute**: Call `getSchemasByService()`, select random element
- **Validate**: schema has `.prisma` property and `.schemaName` property

## Examples

- **Example A**: Auth test picks random auth schema
  ```typescript
  const schemas = await getSchemasByService("auth");
  const schema = schemas[(Math.random() * schemas.length) | 0];
  expect(schema.schemaName).toMatch(/auth_prod-/);
  ```
````

## Troubleshooting

- Error: "service not found" → Check service name is lowercase (auth, NOT Auth)
- Error: "no schemas returned" → Verify infrastructure is initialized (getInfrastructure() first)

## Changelog

- v0.1 – Initial draft for auth, payment, inventory, analytics, notification services

```

```

---

## Key Principles

1. **Minimal = Scannable**

   - No walls of text; use lists and headers
   - TL;DR at the top

2. **Progressive Disclosure**

   - Quick start first → Workflow details → Examples → Troubleshooting
   - Claude can jump to what it needs

3. **Deterministic**

   - File use: Prefer reading fixed reference docs
   - Tool use: Run scripts for parsing, sorting, long calculations
   - Never prompt for things that are calculable

4. **Guardrails First**

   - State what's out of scope upfront
   - Propose safe alternatives, don't just refuse

5. **Examples Over Prose**
   - Every concept should have 1–2 concrete examples
   - Show input → output, not abstract descriptions

---

## For Your 300+ Table Schema

When you have a massive Prisma schema, organize skills like:

```
skills/
├── SELECT-schema                     # How to pick which schema
├── READ-many-patterns                # findMany, filters, pagination
├── CREATE-with-relations             # Nested writes, cascading
├── UPDATE-atomic                     # Transactions, increment/decrement
├── DELETE-cascade                    # Cleanup, foreign keys
├── ERROR-scenarios                   # Validation, constraints, timeouts
├── PERFORMANCE-checks                # Pagination, N+1 prevention
├── MULTI-SERVICE-links               # Cross-table references across services
└── examples/
    ├── example-auth-login.md         # 10 tests showing pattern
    ├── example-payment-charge.md
    └── ...
```

Each skill is:

- **Focused**: One pattern, one decision point
- **Searchable**: Clear metadata and trigger words
- **Referenceable**: Examples can link to other skills
- **Runnable**: Code is copy-paste ready

---

## Next Steps

1. ✅ Identify your 10–12 core patterns (you have them: schema selection, CRUD, errors, delays, etc.)
2. ✅ Create minimal skill.md for each (use this template)
3. ✅ Create examples/ folder with 5–10 complete test files
4. ✅ Create REFERENCE.md with schema diagrams, tables, API contracts (deep details)
5. ✅ Create PLAYBOOK.md with copy-runnable checklists (done-done criteria)
6. ✅ Create scripts/ with deterministic helpers (parsing, sorting, calculations)

**Result**: Claude can navigate your test suite with precision, even for a 300+ table schema.
