# 🎨 Visual Diagrams & Flowcharts

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        YOUR PROJECT                              │
│                                                                   │
│  ┌────────────────────────────────────────────────────────┐    │
│  │              VITEST TEST RUNNER                         │    │
│  │  (Main Process - Discovers & Orchestrates)              │    │
│  └──────────────┬──────────────────────────────────────────┘    │
│                 │                                                │
│                 │  Spawns 6 workers                             │
│                 ▼                                                │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Worker 1   Worker 2   Worker 3   Worker 4   Worker 5  Worker 6 │
│  │  (Fork)     (Fork)     (Fork)     (Fork)     (Fork)    (Fork) │
│  │     │          │          │          │          │         │  │
│  │     │          │          │          │          │         │  │
│  │     ▼          ▼          ▼          ▼          ▼         ▼  │
│  │  test1.ts  test2.ts  test3.ts  test4.ts  test5.ts  test6.ts │
│  │     │          │          │          │          │         │  │
│  │     │ Creates  │ Creates  │ Creates  │ Creates  │ Creates │  │
│  │     │ Schema   │ Schema   │ Schema   │ Schema   │ Schema  │  │
│  │     │ Allocator│ Allocator│ Allocator│ Allocator│ Allocator  │
│  │     │          │          │          │          │         │  │
│  │     ▼          ▼          ▼          ▼          ▼         ▼  │
│  │  [READ: S1] [READ: S9] [READ: S17] [READ: S25] [READ: S33] [READ: S41] │
│  │  [WRITE: S2-8] [WRITE: S10-16] [WRITE: S18-24] [WRITE: S26-32] ... │
│  └─────────────────────────────────────────────────────────┘   │
│                 │                                                │
│                 │  All connect to                               │
│                 ▼                                                │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │         DOCKER - TESTCONTAINERS                         │   │
│  │                                                           │   │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐       │   │
│  │  │Container│ │Container│ │Container│ │Container│  ...  │   │
│  │  │    1    │ │    2    │ │    3    │ │    4    │ (12x) │   │
│  │  │(PostgreSQL)│(PostgreSQL)│(PostgreSQL)│(PostgreSQL)   │   │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘       │   │
│  │       │           │           │           │              │   │
│  │       ▼           ▼           ▼           ▼              │   │
│  │  [8 Schemas] [8 Schemas] [8 Schemas] [8 Schemas]       │   │
│  │  S1-S8       S9-S16      S17-S24     S25-S32     ...    │   │
│  │                                                           │   │
│  │  Total: 12 containers × 8 schemas = 96 schemas          │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Test Execution Flow

```
┌─────────────────────────────────────────────────────────────┐
│ PHASE 1: GLOBAL SETUP (Once before all tests)              │
└─────────────────────────────────────────────────────────────┘
                         │
                         ▼
            ┌────────────────────────┐
            │ vitest.config.ts       │
            │ triggers globalSetup   │
            └────────────┬───────────┘
                         │
                         ▼
            ┌────────────────────────┐
            │ tests/globalSetup.ts   │
            │ • Create containers    │
            │ • Create schemas       │
            │ • Write .json file     │
            └────────────┬───────────┘
                         │
                         ▼
            ┌────────────────────────┐
            │ .vitest-infra.json     │
            │ { schemas: [...],      │
            │   containerCount: 12,  │
            │   totalSchemas: 96 }   │
            └────────────┬───────────┘
                         │
┌─────────────────────────────────────────────────────────────┐
│ PHASE 2: WORKER INIT (Once per worker, 6x parallel)        │
└─────────────────────────────────────────────────────────────┘
                         │
                         ▼
            ┌────────────────────────┐
            │ tests/setupFile.ts     │
            │ (in each worker)       │
            │ • Read .json file      │
            │ • Set global var       │
            └────────────┬───────────┘
                         │
                         ▼
            ┌────────────────────────┐
            │ global.__DB_INFRA__    │
            │ (accessible in worker) │
            └────────────┬───────────┘
                         │
┌─────────────────────────────────────────────────────────────┐
│ PHASE 3: TEST FILE EXECUTION (Per file in worker)          │
└─────────────────────────────────────────────────────────────┘
                         │
                         ▼
            ┌────────────────────────┐
            │ Test file loads        │
            │ createSchemaAllocator  │
            └────────────┬───────────┘
                         │
                         ▼
            ┌────────────────────────┐
            │ First test runs        │
            │ • Lazy init            │
            │ • Partition schemas    │
            │ • Create Prisma client │
            └────────────┬───────────┘
                         │
                         ▼
      ┌─────────────────┴─────────────────┐
      │                                    │
      ▼                                    ▼
┌──────────────┐                  ┌──────────────┐
│ useReadSchema│                  │useWriteSchema│
│ (shares S1)  │                  │(unique S2-S8)│
└──────┬───────┘                  └──────┬───────┘
       │                                  │
       ▼                                  ▼
┌──────────────┐                  ┌──────────────┐
│ Read Test 1  │                  │ Write Test 1 │
│ Read Test 2  │                  │ Write Test 2 │
│ Read Test 3  │                  │ Write Test 3 │
│ (all use S1) │                  │(S2, S3, S4...)│
└──────┬───────┘                  └──────┬───────┘
       │                                  │
       └──────────────┬───────────────────┘
                      │
                      ▼
            ┌────────────────────────┐
            │ afterAll cleanup()     │
            │ • Disconnect clients   │
            │ • Clear caches         │
            └────────────┬───────────┘
                         │
┌─────────────────────────────────────────────────────────────┐
│ PHASE 4: GLOBAL TEARDOWN (Once after all tests)            │
└─────────────────────────────────────────────────────────────┘
                         │
                         ▼
            ┌────────────────────────┐
            │ globalSetup teardown   │
            │ • Stop all containers  │
            │ • Clean resources      │
            └────────────────────────┘
```

---

## Schema Allocation Per File

```
Test File: auth-service.test.ts
Service: "auth"
Available: 8 schemas (test_auth_prod-us-east_schema1-8)

┌─────────────────────────────────────────────────────────┐
│         SCHEMA ALLOCATION FOR "auth" SERVICE            │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  📖 READ SCHEMA (Shared by all read tests)             │
│  ┌──────────────────────────────────────────────┐      │
│  │ test_auth_prod-us-east_schema1               │      │
│  │                                                │      │
│  │  Used by:                                      │      │
│  │  • Test 1: "should get login status" (READ)   │      │
│  │  • Test 2: "should list sessions" (READ)      │      │
│  │  • Test 4: "should count users" (READ)        │      │
│  │                                                │      │
│  │  All 3 tests share THIS SAME schema           │      │
│  └──────────────────────────────────────────────┘      │
│                                                          │
│  ✏️  WRITE SCHEMAS (Unique per write test)             │
│  ┌──────────────────────────────────────────────┐      │
│  │ test_auth_prod-us-east_schema2               │      │
│  │ → Test 3: "should create session" (WRITE)    │      │
│  └──────────────────────────────────────────────┘      │
│                                                          │
│  ┌──────────────────────────────────────────────┐      │
│  │ test_auth_prod-us-east_schema3               │      │
│  │ → Test 5: "should update session" (WRITE)    │      │
│  └──────────────────────────────────────────────┘      │
│                                                          │
│  ┌──────────────────────────────────────────────┐      │
│  │ test_auth_prod-us-east_schema4               │      │
│  │ → Test 6: "should delete session" (WRITE)    │      │
│  └──────────────────────────────────────────────┘      │
│                                                          │
│  Available but unused:                                  │
│  • test_auth_prod-us-east_schema5                      │
│  • test_auth_prod-us-east_schema6                      │
│  • test_auth_prod-us-east_schema7                      │
│  • test_auth_prod-us-east_schema8                      │
│                                                          │
│  CAPACITY: 3 READ tests (sharing), 3 WRITE tests used  │
│            4 WRITE schemas remaining                    │
└─────────────────────────────────────────────────────────┘
```

---

## Container & Schema Distribution

```
┌──────────────────────────────────────────────────────────────┐
│               12 POSTGRESQL CONTAINERS                        │
│                   (via Testcontainers)                        │
└──────────────────────────────────────────────────────────────┘

Container 1: "auth" (prod-us-east)
  ├─ test_auth_prod-us-east_schema1 ──► READ schema for "auth"
  ├─ test_auth_prod-us-east_schema2 ──► WRITE schema 1
  ├─ test_auth_prod-us-east_schema3 ──► WRITE schema 2
  ├─ test_auth_prod-us-east_schema4 ──► WRITE schema 3
  ├─ test_auth_prod-us-east_schema5 ──► WRITE schema 4
  ├─ test_auth_prod-us-east_schema6 ──► WRITE schema 5
  ├─ test_auth_prod-us-east_schema7 ──► WRITE schema 6
  └─ test_auth_prod-us-east_schema8 ──► WRITE schema 7

Container 2: "users" (prod-us-west)
  ├─ test_users_prod-us-west_schema1 ──► READ schema for "users"
  ├─ test_users_prod-us-west_schema2 ──► WRITE schema 1
  └─ ... (6 more)

Container 3: "payment" (prod-eu-central)
  ├─ test_payment_prod-eu-central_schema1 ──► READ schema
  └─ ... (7 more)

... (9 more containers)

Container 12: "audit" (prod-canada)
  ├─ test_audit_prod-canada_schema1 ──► READ schema
  └─ ... (7 more)

TOTAL: 96 schemas (12 containers × 8 schemas each)
```

---

## Parallel Execution Timeline

```
Time →
┌────┬────────────────────────────────────────────────────────┐
│ 0s │ Global Setup Starts                                    │
│    │ • Spawn all containers in parallel                     │
├────┼────────────────────────────────────────────────────────┤
│30s │ All containers running                                 │
│    │ • Create schemas in parallel                           │
├────┼────────────────────────────────────────────────────────┤
│50s │ All schemas created                                    │
│    │ • Create tables in each schema                         │
├────┼────────────────────────────────────────────────────────┤
│60s │ Infrastructure ready                                   │
│    │ • Write .vitest-infra.json                            │
│    │ • Spawn 6 worker threads                              │
├────┼────────────────────────────────────────────────────────┤
│61s │ Workers initialized                                    │
│    │ • Each worker reads infrastructure file               │
│    │                                                        │
│    │ ┌─ Worker 1: test1.ts running                         │
│    │ ├─ Worker 2: test2.ts running                         │
│    │ ├─ Worker 3: test3.ts running                         │
│    │ ├─ Worker 4: test4.ts running                         │
│    │ ├─ Worker 5: test5.ts running                         │
│    │ └─ Worker 6: test6.ts running                         │
├────┼────────────────────────────────────────────────────────┤
│65s │ First batch completes                                  │
│    │ • Workers pick up next test files                      │
├────┼────────────────────────────────────────────────────────┤
│90s │ All tests complete                                     │
│    │ • Global teardown begins                              │
├────┼────────────────────────────────────────────────────────┤
│100s│ All containers stopped                                 │
│    │ • DONE                                                 │
└────┴────────────────────────────────────────────────────────┘

Sequential vs Parallel:
  Sequential: 10 min (test after test)
  Parallel:   1.7 min (6x speedup)
```

---

## Decision Tree: Which Schema Wrapper?

```
                    START
                      │
                      ▼
        ┌─────────────────────────────┐
        │  Does test modify data?     │
        │  (INSERT/UPDATE/DELETE)     │
        └──┬───────────────────────┬──┘
           │                       │
          YES                     NO
           │                       │
           ▼                       ▼
    ┌──────────────┐      ┌──────────────┐
    │useWriteSchema│      │ Does test    │
    │              │      │ depend on    │
    │Gets unique   │      │ specific     │
    │schema (S2-8) │      │ data state?  │
    └──────────────┘      └──┬───────┬───┘
                             │       │
                            YES     NO
                             │       │
                             ▼       ▼
                    ┌──────────────┐ ┌──────────────┐
                    │useWriteSchema│ │useReadSchema │
                    │              │ │              │
                    │Setup data in │ │Shares schema │
                    │test, isolate │ │with others   │
                    └──────────────┘ └──────────────┘

Examples:
  SELECT queries only           → useReadSchema
  COUNT/SUM/aggregate          → useReadSchema
  Creating test record         → useWriteSchema
  Updating existing record     → useWriteSchema
  Deleting record              → useWriteSchema
  Testing validation failure   → useWriteSchema
```

---

## Prisma Client Caching Strategy

```
Test File Scope:
┌──────────────────────────────────────────────────────────┐
│  SchemaAllocator State (per file)                        │
│                                                           │
│  readClient: PrismaClient | null                         │
│    ▲                                                      │
│    │ Created on first useReadSchema call                 │
│    │ Reused by all subsequent read tests                 │
│    │                                                      │
│  writeClients: Map<number, PrismaClient>                 │
│    ├─ 0 → PrismaClient (schema2)  ← Write Test 1         │
│    ├─ 1 → PrismaClient (schema3)  ← Write Test 2         │
│    ├─ 2 → PrismaClient (schema4)  ← Write Test 3         │
│    └─ ... (up to 7 clients)                              │
│                                                           │
│  All clients disconnected in afterAll cleanup()          │
└──────────────────────────────────────────────────────────┘

Memory Usage:
  READ client:  ~5-10MB
  WRITE clients: ~5-10MB each
  Max per file: ~50-80MB (1 read + 7 write clients)
  Max total (6 workers × 8 clients): ~240-480MB
```

---

## Error Propagation Flow

```
Test Execution Error:
┌──────────────────────────────────────────────────────────┐
│ Test throws error                                         │
└────────────┬─────────────────────────────────────────────┘
             │
             ▼
┌──────────────────────────────────────────────────────────┐
│ Vitest catches error                                      │
│ • Test marked as failed                                   │
│ • Error logged with stack trace                           │
│ • Worker continues to next test                           │
└────────────┬─────────────────────────────────────────────┘
             │
             ▼
┌──────────────────────────────────────────────────────────┐
│ afterAll cleanup still runs                               │
│ • Prisma clients disconnected                             │
│ • Resources released                                      │
└────────────┬─────────────────────────────────────────────┘
             │
             ▼
┌──────────────────────────────────────────────────────────┐
│ Other workers unaffected                                  │
│ • Continue running their tests                            │
│ • Isolated in separate processes                          │
└──────────────────────────────────────────────────────────┘

Infrastructure Error:
┌──────────────────────────────────────────────────────────┐
│ globalSetup fails (e.g., Docker not running)              │
└────────────┬─────────────────────────────────────────────┘
             │
             ▼
┌──────────────────────────────────────────────────────────┐
│ Vitest aborts entire test run                             │
│ • No workers spawned                                      │
│ • Clear error message displayed                           │
│ • Exit code 1                                             │
└──────────────────────────────────────────────────────────┘
```

---

## File Dependency Graph

```
vitest.config.ts
  │
  ├─► tests/globalSetup.ts
  │     └─► src/__tests__/shared/testInfrastructure.ts
  │           └─► src/utils/ContainerManager.ts
  │                 └─► testcontainers library
  │
  └─► tests/setupFile.ts
        │
        └─► reads: .vitest-infra.json (from globalSetup)

tests/schemaAllocator.ts
  │
  └─► reads: global.__DB_INFRA__ (from setupFile)

Test files (*.test.ts)
  │
  ├─► imports: tests/schemaAllocator.ts
  │
  └─► uses: createSchemaAllocator("service")
        └─► returns: { useReadSchema, useWriteSchema, cleanup }
              │
              ├─► useReadSchema → Prisma client (cached)
              ├─► useWriteSchema → Prisma client (cached)
              └─► cleanup → disconnect all clients
```

---

## Summary Metrics

```
┌─────────────────────────────────────────────────────────┐
│                   SYSTEM METRICS                         │
├─────────────────────────────────────────────────────────┤
│ Containers:              12 (PostgreSQL via testcontainers) │
│ Schemas per container:   8                              │
│ Total schemas:           96                             │
│ Worker threads:          6 (parallel execution)         │
│ Test files (concurrent): 6 (one per worker)            │
│                                                          │
│ Per test file capacity:                                 │
│   • READ schema:         1 (shared)                     │
│   • WRITE schemas:       7 (unique)                     │
│   • Max write tests:     7                              │
│                                                          │
│ Performance:                                            │
│   • Setup time:          ~60 seconds                    │
│   • Speedup:             ~6x (vs sequential)            │
│   • Memory per worker:   ~50-80MB                       │
│   • Total memory:        ~300-500MB                     │
└─────────────────────────────────────────────────────────┘
```

---

**See full documentation:** `_setup_vitest/00_README.md`
