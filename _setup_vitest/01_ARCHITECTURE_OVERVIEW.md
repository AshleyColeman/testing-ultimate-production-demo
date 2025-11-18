# 🏗️ Architecture Overview - Vitest Parallel Testing System

## 📋 Table of Contents

1. [System Architecture](#system-architecture)
2. [Execution Flow](#execution-flow)
3. [Schema Allocation Strategy](#schema-allocation-strategy)
4. [Component Interactions](#component-interactions)
5. [Data Flow Diagrams](#data-flow-diagrams)
6. [Resource Management](#resource-management)
7. [Timing and Lifecycle](#timing-and-lifecycle)

---

## 🎯 System Architecture

### Overview

This system is built on **four core layers** that work together to enable parallel test execution with complete data isolation:

```
┌─────────────────────────────────────────────────────────────────┐
│                    LAYER 1: TEST RUNNER                          │
│                      (Vitest Orchestration)                      │
│  • Discovers test files                                          │
│  • Spawns 6 worker processes                                     │
│  • Runs globalSetup once                                         │
│  • Runs setupFiles in each worker                                │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                 LAYER 2: INFRASTRUCTURE SETUP                    │
│                  (Containers & Schemas)                          │
│  • Creates 12 PostgreSQL containers                              │
│  • Creates 96 schemas (8 per container)                          │
│  • Writes infrastructure metadata to file                        │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                  LAYER 3: SCHEMA ALLOCATION                      │
│                    (Per-File Strategy)                           │
│  • Each test file gets schema allocator                          │
│  • 1 READ schema (shared across read tests)                     │
│  • N WRITE schemas (one per write test)                         │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    LAYER 4: TEST EXECUTION                       │
│                    (Individual Tests)                            │
│  • Tests receive isolated schema + Prisma client                │
│  • Execute database operations                                   │
│  • Complete independently                                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Execution Flow

### Phase 1: Global Setup (Once Before All Tests)

```
START
  │
  ├─ vitest.config.ts triggers globalSetup
  │
  ▼
globalSetup.ts runs
  │
  ├─ Calls initializeInfrastructure()
  │   │
  │   ├─ Creates 12 ContainerManager instances
  │   ├─ Starts all containers in parallel
  │   ├─ Creates 96 schemas (8 per container)
  │   ├─ Creates tables in each schema:
  │   │   • test_data
  │   │   • test_metrics
  │   │   • user
  │   │
  │   └─ Returns infrastructure object
  │
  ├─ Extracts serializable metadata
  │   │
  │   └─ {
  │       schemas: [{id, service, schemaName, connectionUri}],
  │       containerCount: 12,
  │       totalSchemas: 96
  │     }
  │
  ├─ Writes to .vitest-infra.json
  │
  └─ Logs completion stats
```

**Time:** ~60 seconds  
**Runs:** Once per test suite execution  
**Output:** `.vitest-infra.json` file with infrastructure metadata

---

### Phase 2: Worker Initialization (Once Per Worker)

```
Each Worker Thread (6 total)
  │
  ├─ setupFile.ts runs in worker context
  │
  ├─ beforeAll hook executes
  │   │
  │   ├─ Polls for .vitest-infra.json file
  │   │   (waits up to 60 seconds)
  │   │
  │   ├─ Reads infrastructure metadata
  │   │
  │   ├─ Parses JSON
  │   │
  │   └─ Sets global.__DB_INFRA__
  │
  └─ Worker ready to run tests
```

**Time:** <1 second per worker (file already exists)  
**Runs:** Once per worker thread (6 times total)  
**Purpose:** Share infrastructure data across all tests in worker

---

### Phase 3: Test File Execution (Per Test File)

```
Test File Loads
  │
  ├─ Import createSchemaAllocator
  │
  ├─ const { useReadSchema, useWriteSchema, cleanup }
  │     = createSchemaAllocator('service-name')
  │   │
  │   └─ Creates allocator state (lazy initialization)
  │
  ├─ describe() block starts
  │
  ├─ First test runs
  │   │
  │   ├─ useReadSchema() or useWriteSchema() called
  │   │
  │   ├─ LAZY INITIALIZATION (first call only):
  │   │   │
  │   │   ├─ Waits for global.__DB_INFRA__
  │   │   ├─ Filters schemas for this service
  │   │   ├─ Partitions: [readSchema, ...writeSchemas]
  │   │   └─ Logs allocation summary
  │   │
  │   ├─ Gets or creates Prisma client
  │   │   │
  │   │   └─ Cached for reuse in same file
  │   │
  │   ├─ Creates test context: { db, schema, schemaName }
  │   │
  │   └─ Executes test function
  │
  ├─ Subsequent tests run (use cached clients)
  │
  └─ afterAll hook
      │
      └─ cleanup() disconnects all Prisma clients
```

**Time:** ~100ms for first test (client creation), <10ms for subsequent  
**Runs:** Per test file  
**Memory:** Prisma clients cached, cleaned up after file completes

---

### Phase 4: Global Teardown (Once After All Tests)

```
All Tests Complete
  │
  ├─ globalSetup returns teardown function
  │
  ├─ Vitest calls teardown
  │
  ├─ cleanupInfrastructure() runs
  │   │
  │   ├─ Disconnects all cached Prisma clients
  │   ├─ Stops memory monitoring
  │   ├─ Stops all 12 containers
  │   │
  │   └─ Logs completion
  │
  └─ DONE
```

**Time:** ~10 seconds  
**Runs:** Once per test suite execution

---

## 🎯 Schema Allocation Strategy

### Core Concept: READ vs WRITE

The schema allocator uses a **smart partitioning strategy** to balance efficiency and isolation:

```
Service: "auth" (8 schemas available)
│
├─ READ Schema (Schema 1) ─────────┐
│   • Shared by ALL read tests     │
│   • SELECT queries only           │ → useReadSchema()
│   • No data modifications         │
│   • Fast & efficient              │
│                                   │
└─ WRITE Schemas (Schemas 2-8) ────┘
    │
    ├─ Schema 2 → Write Test #1 ────┐
    ├─ Schema 3 → Write Test #2     │
    ├─ Schema 4 → Write Test #3     │
    ├─ Schema 5 → Write Test #4     │ → useWriteSchema()
    ├─ Schema 6 → Write Test #5     │
    ├─ Schema 7 → Write Test #6     │
    └─ Schema 8 → Write Test #7 ────┘
         │
         └─ Each write test gets UNIQUE schema
            (INSERT, UPDATE, DELETE operations)
```

### Why This Approach?

#### ✅ Efficient Resource Usage

- Read-only tests don't need isolation (they never modify data)
- Sharing one schema for reads saves memory and connections
- Write tests get full isolation (no data pollution)

#### ✅ Predictable Behavior

- Read tests always see the same data
- Write tests start with clean schema
- No flaky tests due to shared state

#### ✅ Clear Mental Model

- "Am I modifying data?" → use `useWriteSchema()`
- "Am I only reading data?" → use `useReadSchema()`

---

## 🔗 Component Interactions

### File Relationships

```
vitest.config.ts
  │
  ├─ Points to: tests/globalSetup.ts
  └─ Points to: tests/setupFile.ts

tests/globalSetup.ts
  │
  ├─ Imports: src/__tests__/shared/testInfrastructure.ts
  ├─ Creates: .vitest-infra.json
  └─ Returns: teardown function

tests/setupFile.ts
  │
  ├─ Reads: .vitest-infra.json
  └─ Sets: global.__DB_INFRA__

tests/schemaAllocator.ts
  │
  ├─ Reads: global.__DB_INFRA__
  ├─ Creates: Prisma clients (per schema)
  └─ Exports: { useReadSchema, useWriteSchema, cleanup }

src/__tests__/microservices/*.test.ts
  │
  ├─ Imports: tests/schemaAllocator.ts
  ├─ Uses: createSchemaAllocator('service')
  └─ Calls: useReadSchema(), useWriteSchema(), cleanup()

src/__tests__/shared/testInfrastructure.ts
  │
  ├─ Imports: src/utils/ContainerManager.ts
  ├─ Creates: 12 containers, 96 schemas
  └─ Exports: initializeInfrastructure(), cleanupInfrastructure()

src/utils/ContainerManager.ts
  │
  ├─ Uses: testcontainers library
  ├─ Creates: PostgreSQL containers
  └─ Returns: connection URIs
```

---

## 📊 Data Flow Diagrams

### Infrastructure Creation Flow

```
globalSetup.ts
      │
      ├─ initializeInfrastructure()
      │       │
      │       ├─ For each container (12x):
      │       │     │
      │       │     ├─ new ContainerManager()
      │       │     ├─ .startContainer()
      │       │     └─ .getConnectionUri()
      │       │
      │       └─ For each schema (96x):
      │             │
      │             ├─ CREATE SCHEMA "name"
      │             ├─ CREATE TABLE test_data
      │             ├─ CREATE TABLE test_metrics
      │             └─ CREATE TABLE user
      │
      ├─ Build metadata object
      │
      └─ Write to .vitest-infra.json
              │
              └─ {
                  schemas: [
                    {
                      id: 0,
                      service: "auth",
                      schemaName: "test_auth_prod-us-east_schema1",
                      connectionUri: "postgresql://...",
                      containerIndex: 0
                    },
                    ... (96 total)
                  ],
                  containerCount: 12,
                  totalSchemas: 96
                }
```

### Test Execution Flow

```
Test File: auth-login.test.ts
      │
      ├─ createSchemaAllocator('auth')
      │       │
      │       └─ Creates state object:
      │           {
      │             serviceName: 'auth',
      │             readSchema: null,      // Lazy init
      │             writeSchemas: [],      // Lazy init
      │             writeIndex: 0,
      │             readClient: null,
      │             writeClients: Map()
      │           }
      │
      ├─ Test #1: useReadSchema(async ({ db, schema }) => {...})
      │       │
      │       ├─ ensureInitialized() (FIRST CALL ONLY)
      │       │     │
      │       │     ├─ Filter schemas where service === 'auth'
      │       │     │   → Found 8 schemas
      │       │     │
      │       │     ├─ Partition: [read, ...writes]
      │       │     │   → readSchema = schema1
      │       │     │   → writeSchemas = [schema2..schema8]
      │       │     │
      │       │     └─ Log allocation summary
      │       │
      │       ├─ getOrCreateClient(readSchema)
      │       │     │
      │       │     ├─ Check cache → Not found
      │       │     ├─ new PrismaClient({ url: schema1Uri })
      │       │     ├─ await client.$connect()
      │       │     └─ Cache client
      │       │
      │       ├─ Build context: { db, schema, schemaName }
      │       │
      │       └─ Execute test function
      │
      ├─ Test #2: useReadSchema(...)
      │       │
      │       ├─ Already initialized ✓
      │       ├─ Get cached READ client ✓
      │       └─ Execute test function
      │
      ├─ Test #3: useWriteSchema(...)
      │       │
      │       ├─ Get writeSchemas[0] (schema2)
      │       ├─ Increment writeIndex (0 → 1)
      │       ├─ getOrCreateClient(schema2)
      │       │     │
      │       │     ├─ Check cache → Not found
      │       │     ├─ new PrismaClient({ url: schema2Uri })
      │       │     ├─ await client.$connect()
      │       │     └─ Cache client
      │       │
      │       └─ Execute test function
      │
      ├─ Test #4: useWriteSchema(...)
      │       │
      │       ├─ Get writeSchemas[1] (schema3)
      │       ├─ Increment writeIndex (1 → 2)
      │       ├─ Get cached WRITE client for schema3
      │       └─ Execute test function
      │
      └─ afterAll: cleanup()
            │
            ├─ Disconnect READ client
            ├─ Disconnect all WRITE clients
            └─ Clear caches
```

---

## 💾 Resource Management

### Memory Management Strategy

#### Prisma Client Caching

```typescript
// Per test file:
{
  readClient: PrismaClient | null,          // 1 instance
  writeClients: Map<number, PrismaClient>   // Up to 7 instances
}

// Maximum per file: 8 Prisma clients
// Maximum across 6 workers: 48 Prisma clients
```

#### Connection Pooling

Each Prisma client maintains its own connection pool:

- Default pool size: 10 connections per client
- Search path set to specific schema
- Connections reused within client lifecycle

#### Cleanup Process

```typescript
afterAll(async () => {
  await cleanup(); // Disconnects all clients
});

// Cleanup does:
// 1. Disconnect READ client
// 2. Disconnect all WRITE clients (iterate Map)
// 3. Clear Map
// 4. Set clients to null
```

---

## ⏱️ Timing and Lifecycle

### Complete Timeline

```
T=0s    ► Vitest starts
T=0s    ► globalSetup.ts begins
T=0s    ► Container creation starts (parallel)
T=30s   ► All containers running
T=30s   ► Schema creation starts (parallel)
T=50s   ► All schemas created
T=50s   ► Table creation starts (parallel)
T=60s   ► Infrastructure complete
T=60s   ► Write .vitest-infra.json
T=60s   ► Spawn 6 worker threads
T=61s   ► Each worker runs setupFile.ts
T=61s   ► Each worker reads .vitest-infra.json
T=61s   ► All workers ready
T=61s   ► Tests begin executing (parallel)
T=61s   ► Test file loads, creates schema allocator
T=61s   ► First test triggers lazy initialization
T=61.1s ► Schemas partitioned (read/write)
T=61.1s ► First Prisma client created
T=61.2s ► Test executes
T=65s   ► Test file complete
T=65s   ► cleanup() disconnects clients
T=90s   ► All tests complete
T=90s   ► Global teardown begins
T=100s  ► Containers stopped
T=100s  ► DONE
```

### Performance Characteristics

| Phase                 | Time   | Frequency       | Can Parallelize?     |
| --------------------- | ------ | --------------- | -------------------- |
| Container creation    | ~30s   | Once            | ✅ Yes (12 parallel) |
| Schema creation       | ~20s   | Once            | ✅ Yes (96 parallel) |
| Worker initialization | <1s    | Per worker (6x) | ✅ Yes               |
| Schema allocation     | <10ms  | Per file        | ❌ No (per-file)     |
| Client creation       | ~100ms | Per schema      | ⚠️ Cached            |
| Test execution        | Varies | Per test        | ✅ Yes (6 workers)   |
| Cleanup               | ~10s   | Once            | ✅ Yes (parallel)    |

---

## 🧩 Schema Naming Convention

Schemas follow a predictable naming pattern:

```
Pattern: test_{service}_{environment}_schema{number}

Examples:
  test_auth_prod-us-east_schema1
  test_auth_prod-us-east_schema2
  test_users_prod-us-west_schema1
  test_payment_prod-eu-central_schema1
```

This allows:

- Easy identification of which service owns the schema
- Environment tracking for multi-region testing
- Sequential numbering for schema allocation

---

## 🔐 Isolation Guarantees

### What This System Guarantees

✅ **Data Isolation**

- Write tests NEVER share schemas
- Each write test gets a fresh, empty schema
- Read tests can share because they don't modify data

✅ **Connection Isolation**

- Each schema has its own Prisma client
- Clients use search_path to scope queries
- No cross-schema contamination

✅ **Process Isolation**

- Tests run in separate worker processes
- Workers don't share memory (except global file)
- Failures in one worker don't affect others

### What This System Does NOT Guarantee

❌ **Container Isolation**

- Multiple schemas share the same PostgreSQL container
- Container failure affects all schemas in that container
- Solution: Containers fail independently; others continue

❌ **Resource Limits**

- System will run out of schemas if you exceed capacity
- Need to calculate: (write tests per file) × (concurrent files) ≤ total schemas
- Solution: Increase SCHEMAS_PER_CONTAINER or CONTAINER_COUNT

---

## 📈 Scalability Considerations

### Current Limits

- **12 containers** × **8 schemas** = **96 total schemas**
- **6 parallel workers** = up to 6 test files running simultaneously
- **8 schemas per file** = max 7 write tests per file (1 read shared)

### Scaling Up

To support more tests:

```typescript
// In testInfrastructure.ts:

// Option 1: More schemas per container
export const SCHEMAS_PER_CONTAINER = 16; // Was 8
// Result: 12 × 16 = 192 schemas

// Option 2: More containers
export const CONTAINER_COUNT = 24; // Was 12
// Result: 24 × 8 = 192 schemas

// Option 3: Both
export const CONTAINER_COUNT = 24;
export const SCHEMAS_PER_CONTAINER = 16;
// Result: 24 × 16 = 384 schemas
```

### Scaling Considerations

- **Memory:** Each Prisma client uses ~5-10MB
- **Connections:** Each client pool has ~10 connections
- **Startup time:** Linear with container count
- **Docker resources:** Containers use ~100MB RAM each

---

## 🎓 Key Takeaways

1. **Global setup runs once** - Creates all infrastructure upfront
2. **Workers share metadata** - Via .vitest-infra.json file
3. **Schema allocation is lazy** - Happens on first test in file
4. **Clients are cached** - Reused within same test file
5. **Cleanup is mandatory** - Prevents memory leaks
6. **Read/Write distinction** - Core to efficient resource usage
7. **Parallel execution** - 6 workers run simultaneously
8. **Schemas are pre-created** - No creation during test execution

---

## 🔜 Next Steps

Now that you understand the architecture, proceed to:

### → **[02_INSTALLATION_GUIDE.md](02_INSTALLATION_GUIDE.md)**

Learn how to set up this system in your own project step-by-step.

---

**Previous:** [00_README.md](00_README.md) | **Next:** [02_INSTALLATION_GUIDE.md](02_INSTALLATION_GUIDE.md)
