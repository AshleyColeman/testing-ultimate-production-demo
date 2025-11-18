# ⚙️ Configuration Files - Deep Dive

## 📋 Table of Contents

1. [vitest.config.ts](#vitestconfigts)
2. [tests/globalSetup.ts](#testsglobalsetupts)
3. [tests/setupFile.ts](#testssetupfilets)
4. [tests/schemaAllocator.ts](#testsschemaallocatorts)
5. [src/**tests**/shared/testInfrastructure.ts](#src__tests__sharedtestinfrastructurets)
6. [Configuration Summary](#configuration-summary)

---

## 📄 vitest.config.ts

### Purpose

Main Vitest configuration file that controls test execution, parallel behavior, and setup hooks.

### Location

`vitest.config.ts` (project root)

### Line-by-Line Explanation

```typescript
import { defineConfig } from "vitest/config";
import path from "path";
// ↑ Import Vitest's config function and Node's path module

export default defineConfig({
  // ↑ Export configuration object

  test: {
    // ↑ Test-specific configuration

    globals: true,
    // ↑ Enable global test APIs (describe, it, expect) without imports

    environment: "node",
    // ↑ Run tests in Node.js environment (not browser/jsdom)

    testTimeout: 300000,
    // ↑ Each test has 5 minutes max (300,000ms)
    // Needed for slow database operations

    hookTimeout: 300000,
    // ↑ beforeAll/afterAll hooks have 5 minutes max
    // Needed for infrastructure setup/teardown

    teardownTimeout: 120000,
    // ↑ Global teardown has 2 minutes max
    // Needed for stopping 12 containers

    isolate: false,
    // ↑ Don't reset module cache between tests
    // Allows sharing schema allocator state within file

    pool: "forks",
    // ↑ Use fork pool (spawn separate processes)
    // Required for true parallel execution

    poolOptions: {
      forks: {
        singleFork: false,
        // ↑ Allow multiple forks (enable parallel execution)

        minForks: 1,
        // ↑ Always have at least 1 worker ready

        maxForks: 6,
        // ↑ Run up to 6 test files in parallel
        // Adjust based on CPU cores and available memory
      },
    },

    globalSetup: ["./tests/globalSetup.ts"],
    // ↑ Run this file ONCE before all tests
    // Creates containers and schemas

    setupFiles: ["./tests/setupFile.ts"],
    // ↑ Run this file in EACH worker thread
    // Loads infrastructure metadata

    include: ["src/**/*.test.ts", "src/**/*.spec.ts"],
    // ↑ Test file patterns to discover

    exclude: ["node_modules", "dist", ".git"],
    // ↑ Directories to ignore

    reporters: ["verbose"],
    // ↑ Use verbose output (shows each test)

    sequence: {
      setupFiles: "list",
      // ↑ Run setup files in order listed

      hooks: "list",
      // ↑ Run hooks in order defined

      concurrent: false,
      // ↑ Don't run tests concurrently WITHIN a file
      // Schema allocator expects sequential execution per file
    },
  },

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // ↑ Allow @/ imports to reference src/

      "@/prisma/client": path.resolve(
        __dirname,
        "./node_modules/.prisma/client"
      ),
      // ↑ Direct alias for generated Prisma client
    },
  },
});
```

### Key Configuration Choices

**Why `pool: "forks"`?**

- Creates separate Node.js processes for each worker
- True isolation between test files
- Prevents global state leakage

**Why `maxForks: 6`?**

- Balance between parallelism and resource usage
- Each fork uses ~100MB RAM + Prisma clients
- 6 workers = 6 test files running simultaneously
- Adjust based on your machine: `Math.min(CPU_CORES, 6)`

**Why `concurrent: false` inside files?**

- Schema allocator allocates schemas sequentially
- `writeIndex` counter must increment deterministically
- Running tests concurrently would cause race conditions

**Why such long timeouts?**

- Container startup: ~30 seconds
- Schema creation: ~20 seconds
- First Prisma client connection: ~100ms
- Database operations: varies

---

## 📄 tests/globalSetup.ts

### Purpose

Runs ONCE before all tests to create infrastructure and share metadata with workers.

### Location

`tests/globalSetup.ts`

### Complete File

```typescript
/**
 * 🌍 GLOBAL SETUP FOR VITEST
 *
 * This file runs ONCE before all tests start.
 * It:
 * 1. Initializes all containers and schemas
 * 2. Makes schema metadata available to all test files via a file
 * 3. Returns a teardown function to clean up after all tests
 */

import {
  initializeInfrastructure,
  cleanupInfrastructure,
  getInfrastructure,
  CONTAINER_COUNT,
  TOTAL_SCHEMAS,
} from "../src/__tests__/shared/testInfrastructure";

/**
 * Serializable schema metadata for test files
 */
export interface SchemaMeta {
  id: number;
  service: string;
  environment: string;
  schemaName: string;
  connectionUri: string;
  containerIndex: number;
}

/**
 * Serializable infrastructure object
 */
export interface SerializableInfra {
  schemas: SchemaMeta[];
  containerCount: number;
  totalSchemas: number;
}

// Global variable declaration
declare global {
  var __DB_INFRA__: SerializableInfra | undefined;
}

/**
 * Global setup - runs before all tests
 */
export default async function setup() {
  console.log("\n🌍 ============================================");
  console.log("🌍 GLOBAL SETUP - INITIALIZING INFRASTRUCTURE");
  console.log("🌍 ============================================\n");

  const startTime = Date.now();

  // Step 1: Initialize containers and schemas
  // This creates 12 PostgreSQL containers and 96 schemas
  await initializeInfrastructure();

  // Step 2: Get infrastructure object
  const infra = await getInfrastructure();

  // Step 3: Build serializable schema metadata
  // Extract only what test files need (remove Prisma clients, etc.)
  const schemas: SchemaMeta[] = infra.schemas.map((schema, index) => ({
    id: index,
    service: schema.service,
    environment: schema.environment,
    schemaName: schema.schemaName,
    connectionUri: schema.connectionUri,
    containerIndex: schema.containerIndex,
  }));

  const serializableInfra: SerializableInfra = {
    schemas,
    containerCount: CONTAINER_COUNT,
    totalSchemas: TOTAL_SCHEMAS,
  };

  // Step 4: Write infrastructure data to a file for worker threads
  // globalSetup runs in a separate process from workers
  // File is the bridge between processes
  const fs = await import("fs/promises");
  const path = await import("path");
  const infraFilePath = path.join(__dirname, ".vitest-infra.json");
  await fs.writeFile(infraFilePath, JSON.stringify(serializableInfra, null, 2));

  // Also set global (for backward compatibility, but workers won't see this)
  global.__DB_INFRA__ = serializableInfra;

  const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log("✅ ============================================");
  console.log("✅ GLOBAL SETUP COMPLETE!");
  console.log("✅ ============================================");
  console.log(`📊 Infrastructure Stats:`);
  console.log(`   • Containers: ${CONTAINER_COUNT}`);
  console.log(`   • Total Schemas: ${TOTAL_SCHEMAS}`);
  console.log(`   • Initialization Time: ${elapsedTime}s`);
  console.log("");
  console.log("🎯 Schema Distribution:");

  // Group schemas by service for visualization
  const schemasByService = schemas.reduce((acc, schema) => {
    acc[schema.service] = (acc[schema.service] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  Object.entries(schemasByService).forEach(([service, count]) => {
    console.log(`   • ${service}: ${count} schemas`);
  });

  console.log("\n🚀 Ready to run tests!\n");

  // Return teardown function
  // Vitest calls this after all tests complete
  return async () => {
    console.log("\n🧹 ============================================");
    console.log("🧹 GLOBAL TEARDOWN - CLEANING UP");
    console.log("🧹 ============================================\n");

    await cleanupInfrastructure();

    console.log("\n✅ GLOBAL TEARDOWN COMPLETE!\n");
  };
}
```

### Key Points

**Why write to a file instead of using global variables?**

- `globalSetup` runs in a **separate process** from worker threads
- Global variables don't transfer between processes
- File acts as shared memory between processes

**Why use SerializableInfra?**

- Prisma clients can't be serialized to JSON
- Only extract primitive data (strings, numbers)
- Workers will create their own Prisma clients

**Why return a teardown function?**

- Vitest automatically calls the returned function after tests
- Ensures containers are always stopped
- Prevents Docker container accumulation

---

## 📄 tests/setupFile.ts

### Purpose

Runs in EACH worker thread to load infrastructure metadata from file.

### Location

`tests/setupFile.ts`

### Complete File

```typescript
/**
 * 🌍 VITEST SETUP FILE (In-Process)
 *
 * This runs ONCE in each worker thread before its tests run.
 * Unlike globalSetup, this runs in the same process as tests,
 * allowing us to set global variables accessible to test files.
 */

import { beforeAll } from "vitest";

/**
 * Serializable schema metadata
 */
export interface SchemaMeta {
  id: number;
  service: string;
  environment: string;
  schemaName: string;
  connectionUri: string;
  containerIndex: number;
}

/**
 * Serializable infrastructure object
 */
export interface SerializableInfra {
  schemas: SchemaMeta[];
  containerCount: number;
  totalSchemas: number;
}

// Global variable declarations
declare global {
  var __DB_INFRA__: SerializableInfra | undefined;
  var __DB_INFRA_INITIALIZED__: boolean | undefined;
}

/**
 * Worker thread initialization
 * Each worker reads infrastructure from the file created by globalSetup
 */
beforeAll(async () => {
  // Check if already initialized in this worker
  // Vitest might run setupFiles multiple times
  if (global.__DB_INFRA_INITIALIZED__) {
    console.log(`⚡ Worker ${process.pid} already initialized, skipping`);
    return;
  }

  const fs = await import("fs/promises");
  const path = await import("path");
  const infraFilePath = path.join(__dirname, ".vitest-infra.json");

  // Wait for infrastructure file from globalSetup (with timeout)
  const maxWait = 60000; // 60 seconds
  const startTime = Date.now();

  console.log(`⏳ Worker ${process.pid} waiting for infrastructure...`);

  while (true) {
    try {
      // Try to read the file
      const data = await fs.readFile(infraFilePath, "utf-8");
      const serializableInfra = JSON.parse(data);

      // Store in global for this worker thread
      // All tests in this worker can access this
      global.__DB_INFRA__ = serializableInfra;
      global.__DB_INFRA_INITIALIZED__ = true;

      console.log(
        `\n✅ Worker ${process.pid} ready - loaded ${serializableInfra.totalSchemas} schemas\n`
      );
      break; // Success!
    } catch (err) {
      // File doesn't exist yet or can't be read

      // Check timeout
      if (Date.now() - startTime > maxWait) {
        throw new Error(
          `❌ Timeout waiting for infrastructure file from globalSetup.\n` +
            `Expected file: ${infraFilePath}\n` +
            `Error: ${err instanceof Error ? err.message : String(err)}\n` +
            `Make sure globalSetup is configured in vitest.config.ts`
        );
      }

      // Wait a bit before retrying
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }
}, 300000); // 5 minute timeout for this hook
```

### Key Points

**Why use `beforeAll`?**

- Runs before any test in this worker
- Ensures infrastructure is loaded before tests execute
- Part of Vitest's normal test lifecycle

**Why poll for the file?**

- Race condition: globalSetup might still be creating file
- Polling with timeout ensures we wait for file to exist
- 100ms intervals = minimal CPU usage
- 60-second timeout prevents infinite waiting

**Why check `__DB_INFRA_INITIALIZED__`?**

- Vitest might run setupFiles multiple times
- Prevents redundant file reads
- Optimization for faster startup

**Why 300-second timeout on hook?**

- Container creation takes ~60 seconds
- Need buffer for slow systems
- Better to wait than fail prematurely

---

## 📄 tests/schemaAllocator.ts

### Purpose

Allocates READ and WRITE schemas to tests within each file.

### Location

`tests/schemaAllocator.ts`

### High-Level Structure

Due to file length (~400 lines), here's the annotated structure:

```typescript
/**
 * 🎯 SCHEMA ALLOCATOR
 *
 * Per-file schema allocation strategy:
 * - Read-only tests → Share ONE schema
 * - Mutating tests → Each gets its OWN unique schema
 */

import { PrismaClient } from "@prisma/client";
import type { SchemaMeta, SerializableInfra } from "./setupFile";

// ========================================
// SECTION 1: TYPE DEFINITIONS
// ========================================

/**
 * Test context passed to test functions
 */
export interface TestContext {
  db: PrismaClient; // Prisma client for this schema
  schema: SchemaMeta; // Full schema metadata
  schemaName: string; // Quick access to schema name
}

/**
 * Test function signature
 */
export type TestFn = (context: TestContext) => Promise<void> | void;

/**
 * Schema allocator interface returned by createSchemaAllocator
 */
export interface SchemaAllocator {
  useReadSchema: (fn: TestFn) => () => Promise<void>; // Wrapper for read tests
  useWriteSchema: (fn: TestFn) => () => Promise<void>; // Wrapper for write tests
  cleanup: () => Promise<void>; // Cleanup function
}

/**
 * Internal state for schema allocation (per file)
 */
interface AllocatorState {
  serviceName: string; // Service this allocator is for
  readSchema: SchemaMeta | null; // The ONE read schema (lazy init)
  writeSchemas: SchemaMeta[]; // Array of write schemas (lazy init)
  writeIndex: number; // Current write schema index
  readClient: PrismaClient | null; // Cached read client
  writeClients: Map<number, PrismaClient>; // Cached write clients
}

// ========================================
// SECTION 2: INFRASTRUCTURE ACCESS
// ========================================

/**
 * Get infrastructure from global (with error handling)
 */
function getInfra(): SerializableInfra {
  const infra = global.__DB_INFRA__;
  if (!infra) {
    throw new Error(
      "❌ Database infrastructure not initialized! " +
        "This should be set by setupFile.ts before tests run."
    );
  }
  return infra;
}

/**
 * Wait for infrastructure to be available (lazy initialization)
 * Polls global.__DB_INFRA__ until available or timeout
 */
async function waitForInfra(
  timeoutMs: number = 5000
): Promise<SerializableInfra> {
  const startTime = Date.now();

  while (!global.__DB_INFRA__) {
    if (Date.now() - startTime > timeoutMs) {
      throw new Error(
        "❌ Timeout waiting for database infrastructure. " +
          "Make sure setupFiles is configured in vitest.config.ts"
      );
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return global.__DB_INFRA__!;
}

// ========================================
// SECTION 3: MAIN FACTORY FUNCTION
// ========================================

/**
 * Create a schema allocator for a specific service
 *
 * LAZY INITIALIZATION: Schemas are partitioned only when first test runs
 *
 * @param serviceName - The service name (e.g., 'auth', 'users', 'payment')
 * @returns Schema allocator with useReadSchema, useWriteSchema, cleanup
 */
export function createSchemaAllocator(serviceName: string): SchemaAllocator {
  // Create state object immediately
  const state: AllocatorState = {
    serviceName,
    readSchema: null, // Will be set on first test
    writeSchemas: [], // Will be set on first test
    writeIndex: 0,
    readClient: null,
    writeClients: new Map(),
  };

  // Flag to track if we've initialized
  let initialized = false;

  /**
   * Lazy initialization - happens on first test execution
   * This is called by both useReadSchema and useWriteSchema
   */
  const ensureInitialized = async () => {
    if (initialized) return; // Already done

    // Wait for infrastructure (from setupFile.ts)
    const infra = await waitForInfra();

    if (!infra || !infra.schemas) {
      throw new Error("❌ Database infrastructure not found!");
    }

    // Filter schemas for this service
    const serviceSchemas = infra.schemas.filter(
      (s) => s.service === serviceName
    );

    if (serviceSchemas.length === 0) {
      throw new Error(
        `❌ No schemas found for service '${serviceName}'. ` +
          `Available services: ${[
            ...new Set(infra.schemas.map((s) => s.service)),
          ].join(", ")}`
      );
    }

    // Sort for deterministic allocation
    serviceSchemas.sort((a, b) => a.id - b.id);

    // Partition: First schema = reads, rest = writes
    const [readSchema, ...writeSchemas] = serviceSchemas;

    if (writeSchemas.length === 0) {
      console.warn(
        `⚠️  WARNING: Service '${serviceName}' has only 1 schema. ` +
          `Mutating tests will share the read schema.`
      );
    }

    // Update state
    state.readSchema = readSchema;
    state.writeSchemas = writeSchemas.length > 0 ? writeSchemas : [readSchema];
    initialized = true;

    // Log allocation summary
    console.log(`\n${"=".repeat(60)}`);
    console.log(`🎯 Schema Allocation for Service: '${serviceName}'`);
    console.log(`${"=".repeat(60)}`);
    console.log(`📖 READ Schema (Shared):  ${readSchema.schemaName}`);
    console.log(`✏️  WRITE Schemas (${state.writeSchemas.length} available):`);
    state.writeSchemas.forEach((schema, index) => {
      console.log(`   ${index + 1}. ${schema.schemaName}`);
    });
    console.log(`${"=".repeat(60)}\n`);
  };

  // ========================================
  // SECTION 4: PRISMA CLIENT MANAGEMENT
  // ========================================

  /**
   * Get or create a Prisma client for a schema
   * Clients are cached to avoid recreating on every test
   */
  const getOrCreateClient = async (
    schema: SchemaMeta,
    clientMap: Map<number, PrismaClient> | null,
    clientKey: number | "read"
  ): Promise<PrismaClient> => {
    // Check if client already exists in cache
    if (clientKey === "read" && state.readClient) {
      return state.readClient;
    }
    if (
      typeof clientKey === "number" &&
      clientMap &&
      clientMap.has(clientKey)
    ) {
      return clientMap.get(clientKey)!;
    }

    // Create new client with schema-specific connection
    const connectionUrl = new URL(schema.connectionUri);
    connectionUrl.searchParams.set("schema", schema.schemaName);

    const client = new PrismaClient({
      datasources: { db: { url: connectionUrl.toString() } },
      log: ["error"], // Only log errors
    });

    // Connect to database
    await client.$connect();

    // Store in cache
    if (clientKey === "read") {
      state.readClient = client;
    } else if (typeof clientKey === "number" && clientMap) {
      clientMap.set(clientKey, client);
    }

    return client;
  };

  // ========================================
  // SECTION 5: TEST WRAPPERS
  // ========================================

  /**
   * Wrapper for read-only tests (shares one schema)
   *
   * Usage: it('test name', useReadSchema(async ({ db, schema }) => {...}))
   */
  const useReadSchema = (fn: TestFn) => {
    return async () => {
      // Lazy initialization on first use
      await ensureInitialized();

      if (!state.readSchema) {
        throw new Error(
          `❌ No read schema available for service '${serviceName}'`
        );
      }

      // Get or create READ client (cached for reuse)
      const db = await getOrCreateClient(state.readSchema, null, "read");

      // Diagnostic logging
      console.log(
        `📖 READ Schema (Shared): ${state.readSchema.schemaName} ` +
          `for service '${serviceName}'`
      );

      // Build context object
      const context: TestContext = {
        db,
        schema: state.readSchema,
        schemaName: state.readSchema.schemaName,
      };

      // Execute the actual test function
      await fn(context);
    };
  };

  /**
   * Wrapper for mutating tests (each gets unique schema)
   *
   * Usage: it('test name', useWriteSchema(async ({ db, schema }) => {...}))
   */
  const useWriteSchema = (fn: TestFn) => {
    return async () => {
      // Lazy initialization on first use
      await ensureInitialized();

      // Allocate next write schema
      const schemaIndex = state.writeIndex;

      // CRITICAL: Fail fast if we run out of write schemas
      if (schemaIndex >= state.writeSchemas.length) {
        throw new Error(
          `❌ SCHEMA EXHAUSTION: Service '${serviceName}' has exhausted write schemas!\n` +
            `   Available write schemas: ${state.writeSchemas.length}\n` +
            `   Write test attempting to run: ${schemaIndex + 1}\n` +
            `   Solution: Increase SCHEMAS_PER_CONTAINER or reduce write tests\n` +
            `   Current allocation: ${state.writeSchemas
              .map((s) => s.schemaName)
              .join(", ")}`
        );
      }

      const schema = state.writeSchemas[schemaIndex];

      // Diagnostic logging
      console.log(
        `🔒 WRITE Schema Allocated: ${schema.schemaName} ` +
          `(${schemaIndex + 1}/${state.writeSchemas.length}) ` +
          `for service '${serviceName}'`
      );

      // Increment for next test
      state.writeIndex++;

      // Get or create WRITE client for this schema
      const db = await getOrCreateClient(
        schema,
        state.writeClients,
        schemaIndex
      );

      // Build context object
      const context: TestContext = {
        db,
        schema,
        schemaName: schema.schemaName,
      };

      // Execute the actual test function
      await fn(context);
    };
  };

  // ========================================
  // SECTION 6: CLEANUP
  // ========================================

  /**
   * Cleanup function - disconnect all Prisma clients
   * Call this in afterAll() hook to prevent memory leaks
   *
   * Usage: afterAll(async () => { await cleanup(); });
   */
  const cleanup = async () => {
    console.log(
      `\n🧹 Cleaning up schema allocator for service '${serviceName}'...`
    );

    let disconnectedCount = 0;

    // Disconnect read client
    if (state.readClient) {
      try {
        await state.readClient.$disconnect();
        console.log(
          `   ✅ Disconnected READ client (${state.readSchema?.schemaName})`
        );
        disconnectedCount++;
      } catch (error) {
        console.warn(`   ⚠️  Failed to disconnect READ client:`, error);
      }
      state.readClient = null;
    }

    // Disconnect all write clients
    for (const [index, client] of state.writeClients.entries()) {
      try {
        await client.$disconnect();
        const schemaName =
          state.writeSchemas[index]?.schemaName || `schema-${index}`;
        console.log(
          `   ✅ Disconnected WRITE client ${index + 1} (${schemaName})`
        );
        disconnectedCount++;
      } catch (error) {
        console.warn(
          `   ⚠️  Failed to disconnect WRITE client ${index + 1}:`,
          error
        );
      }
    }
    state.writeClients.clear();

    console.log(
      `🧹 Cleanup complete: ${disconnectedCount} client(s) disconnected\n`
    );
  };

  // ========================================
  // SECTION 7: RETURN INTERFACE
  // ========================================

  return {
    useReadSchema,
    useWriteSchema,
    cleanup,
  };
}

// ========================================
// SECTION 8: HELPER FUNCTIONS (OPTIONAL)
// ========================================

/**
 * Helper: Get all available services from infrastructure
 */
export function getAvailableServices(): string[] {
  try {
    const infra = getInfra();
    if (!infra || !infra.schemas) return [];
    return [...new Set(infra.schemas.map((s) => s.service))];
  } catch {
    return [];
  }
}

/**
 * Helper: Get schema count for a service
 */
export function getSchemaCount(serviceName: string): {
  total: number;
  read: number;
  write: number;
} {
  try {
    const infra = getInfra();
    if (!infra || !infra.schemas) {
      return { total: 0, read: 0, write: 0 };
    }

    const serviceSchemas = infra.schemas.filter(
      (s) => s.service === serviceName
    );
    const total = serviceSchemas.length;
    const read = total > 0 ? 1 : 0;
    const write = total > 1 ? total - 1 : total;

    return { total, read, write };
  } catch {
    return { total: 0, read: 0, write: 0 };
  }
}
```

### Key Design Decisions

**Why lazy initialization?**

- Infrastructure might not be ready when file loads
- Delays schema partitioning until first test runs
- Allows flexible test execution order

**Why cache Prisma clients?**

- Creating clients is expensive (~100ms)
- Same schema used multiple times in a file
- Reuse clients = faster test execution

**Why fail fast on schema exhaustion?**

- Clear error message helps debugging
- Better than silent schema reuse
- Points to exact solution

**Why separate READ and WRITE maps?**

- READ has only one client (singleton pattern)
- WRITE has multiple clients (Map structure)
- Different access patterns, different storage

---

## 📄 src/**tests**/shared/testInfrastructure.ts

### Purpose

Creates and manages PostgreSQL containers and schemas. Core infrastructure layer.

### Location

`src/__tests__/shared/testInfrastructure.ts`

### Configuration Constants (Top of File)

```typescript
// Infrastructure constants
export const MAX_WORKER_THREADS = 6;
export const CONTAINERS_PER_THREAD = 2;
export const CONTAINER_COUNT = MAX_WORKER_THREADS * CONTAINERS_PER_THREAD; // 12
export const SCHEMAS_PER_CONTAINER = 8;
export const TOTAL_SCHEMAS = CONTAINER_COUNT * SCHEMAS_PER_CONTAINER; // 96

// Service names (cycles through for containers)
export const SERVICES = [
  "auth",
  "users",
  "payment",
  "inventory",
  "analytics",
  "notification",
  "orders",
  "shipping",
  "notifications",
  "reporting",
  "billing",
  "audit",
];

// Environment names (cycles through for containers)
export const ENVIRONMENTS = [
  "prod-us-east",
  "prod-us-west",
  "prod-eu-central",
  "prod-apac-south",
  "prod-canada",
];
```

### Customization Guide

**To change number of containers:**

```typescript
export const CONTAINER_COUNT = 24; // Was 12
// Result: 24 containers × 8 schemas = 192 total schemas
```

**To change schemas per container:**

```typescript
export const SCHEMAS_PER_CONTAINER = 16; // Was 8
// Result: 12 containers × 16 schemas = 192 total schemas
```

**To add/remove services:**

```typescript
export const SERVICES = [
  "auth",
  "users",
  "payment",
  // Add more services here
  "custom-service",
];
```

**To change table structure:**

```typescript
// In initializeInfrastructure(), find schema creation loop
// Add more CREATE TABLE statements:

await prisma.$executeRawUnsafe(`
  CREATE TABLE "${schemaName}".your_custom_table (
    id SERIAL PRIMARY KEY,
    // Add your columns
  )
`);
```

### Key Functions

**`initializeInfrastructure()`**

- Creates all containers in parallel
- Creates all schemas in parallel
- Creates tables in each schema
- Returns TestInfrastructure object

**`getInfrastructure()`**

- Returns singleton infrastructure instance
- Auto-initializes if not already done

**`cleanupInfrastructure()`**

- Disconnects all Prisma clients
- Stops all containers
- Cleans up resources

**`getRandomSchema()`**

- Helper to get a random schema
- Useful for ad-hoc testing

**`getSchemasByService(service: string)`**

- Filter schemas by service name
- Returns array of matching schemas

---

## 📊 Configuration Summary

### File Dependencies

```
vitest.config.ts
  ↓
tests/globalSetup.ts
  ↓
src/__tests__/shared/testInfrastructure.ts
  ↓
src/utils/ContainerManager.ts

vitest.config.ts
  ↓
tests/setupFile.ts
  ↓
(reads .vitest-infra.json)

tests/schemaAllocator.ts
  ↓
(reads global.__DB_INFRA__)
```

### Configuration Matrix

| File                  | Purpose           | Runs       | Process     | Can Access  |
| --------------------- | ----------------- | ---------- | ----------- | ----------- |
| vitest.config.ts      | Main config       | N/A        | Main        | N/A         |
| globalSetup.ts        | Create infra      | Once       | Separate    | File system |
| setupFile.ts          | Load infra        | Per worker | Worker      | global vars |
| schemaAllocator.ts    | Allocate schemas  | Per file   | Worker      | global vars |
| testInfrastructure.ts | Manage containers | Once       | globalSetup | Containers  |

### Key Global Variables

```typescript
// Set by setupFile.ts, read by schemaAllocator.ts
global.__DB_INFRA__: SerializableInfra

// Structure:
{
  schemas: [
    {
      id: 0,
      service: "auth",
      environment: "prod-us-east",
      schemaName: "test_auth_prod-us-east_schema1",
      connectionUri: "postgresql://test_user_1:test_pass_1@localhost:xxxxx/test_auth_prod-us-east",
      containerIndex: 0
    },
    // ... 95 more schemas
  ],
  containerCount: 12,
  totalSchemas: 96
}
```

---

## 🎯 Next Steps

Now that you understand all configuration files:

### → **[04_WRITING_TESTS.md](04_WRITING_TESTS.md)**

Learn how to write tests using this infrastructure.

---

**Previous:** [02_INSTALLATION_GUIDE.md](02_INSTALLATION_GUIDE.md) | **Next:** [04_WRITING_TESTS.md](04_WRITING_TESTS.md)
