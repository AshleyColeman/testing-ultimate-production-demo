---
name: access-infrastructure-singleton
description: >
  Get the shared infrastructure singleton (5 containers, 20 schemas, logger, memory manager).
  Use this at the START of every integration test to access pre-initialized PostgreSQL,
  connection pooling, and observability tools. Required before schema selection or database operations.
---

# Access Infrastructure Singleton

**PURPOSE**: Initialize your test by obtaining the pre-created shared infrastructure.
The singleton ensures all 530 tests share 5 containers (not each creating their own).

## When to use

- **Triggers**: "access infrastructure", "get containers", "initialize test", "log metrics"
- **Input**: None (already initialized by orchestrator)
- **Output**: infra object with `.containers`, `.schemas`, `.logger`, `.memoryManager`
- **Not for**: Creating your own containers; infrastructure is pre-built
- **Required**: First line of every integration test

## Quick start

1. Import: `import { getInfrastructure } from "../shared/testInfrastructure"`
2. Call: `const infra = await getInfrastructure()`
3. Use: `infra.logger.info(...)` or access `infra.containers` / `infra.schemas`

## Workflow

- **Gather**: Ensure orchestrator has run (beforeAll sets up infrastructure in globalSetup)
- **Execute**: `const infra = await getInfrastructure()` — cached singleton, zero overhead
- **Validate**: Verify infra has `.logger`, `.containers`, `.schemas`, `.isInitialized`

## File & tool use

- Read: Reference `orchestrator-pattern.md` to understand initialization timing
- Run: None required — just call the function
- Prefer: Calling function over manual setup

## Guardrails

- Never create your own containers (infrastructure is shared and pre-built)
- Never call initialization directly (orchestrator beforeAll handles all setup)
- Containers are immutable during tests (don't try to stop/start/recreate them)
- If infrastructure not found, ensure test is auto-discovered by orchestrator

## Examples

**Example A**: Basic usage — access infra and log

```typescript
import { getInfrastructure } from "../shared/testInfrastructure";

it("accesses infrastructure [Test 1/10]", async () => {
  const infra = await getInfrastructure();

  infra.logger.info("Infrastructure initialized");
  expect(infra.isInitialized).toBe(true);
  expect(infra.containers.length).toBe(5);
});
```

**Example B**: Using logger for observability

```typescript
it("tracks resources during operation [Test 5/10]", async () => {
  const infra = await getInfrastructure();
  const metrics = infra.memoryManager.getMetrics();

  infra.logger.info(`Memory: ${metrics.used}MB / ${metrics.total}MB`);
  expect(metrics.used).toBeLessThan(1024);
});
```

**Example C**: All infrastructure properties

```typescript
it("accesses infrastructure properties [Test 10/10]", async () => {
  const infra = await getInfrastructure();

  // Immutable properties
  expect(infra.isInitialized).toBe(true);
  expect(infra.containers).toHaveLength(5); // 5 PostgreSQL containers
  expect(infra.schemas).toHaveLength(20); // 20 schemas (4 per container)
  expect(infra.logger).toBeDefined(); // Winston logger
  expect(infra.memoryManager).toBeDefined(); // Memory tracking
});
```

## Troubleshooting

- **Error: "Infrastructure not initialized"** → Orchestrator hasn't run yet; ensure your test file is in `src/__tests__/microservices/` with `.test.ts` suffix
- **Error: "getInfrastructure is not defined"** → Check import path is exactly: `"../shared/testInfrastructure"`
- **Containers seem slow on first run** → Containers pre-create on orchestrator startup (~10s one-time cost); subsequent tests use cached containers
- **Memory or performance degradation** → Check `infra.memoryManager.getMetrics()` to diagnose leaks

## Changelog

- v0.2 – Refactored to minimal skill format with clear triggers, guardrails, and searchable description
- v0.1 – Initial comprehensive documentation with detailed examples

---

**Next**: Use this infra with `select-random-schema.md` to pick a database schema for your test.
