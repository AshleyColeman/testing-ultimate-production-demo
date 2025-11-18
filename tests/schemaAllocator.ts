/**
 * 🎯 SCHEMA ALLOCATOR
 *
 * Per-file schema allocation strategy:
 *
 * RULES (per test file):
 * 1. Read-only tests → Share ONE schema (all reads in the file use the same schema)
 * 2. Mutating tests → Each gets its OWN unique schema (no sharing between mutations)
 *
 * USAGE in test files:
 *
 * ```ts
 * import { createSchemaAllocator } from '../../../tests/schemaAllocator';
 *
 * const { useReadSchema, useWriteSchema } = createSchemaAllocator('auth');
 *
 * describe('Auth Service', () => {
 *   it('gets all users (read)', useReadSchema(async ({ db, schema }) => {
 *     // SELECT only - shares schema with other reads
 *     const users = await db.$queryRaw`SELECT * FROM users`;
 *   }));
 *
 *   it('creates a user (write)', useWriteSchema(async ({ db, schema }) => {
 *     // INSERT/UPDATE/DELETE - gets unique schema
 *     await db.$executeRaw`INSERT INTO users ...`;
 *   }));
 *
 *   it('updates a user (write)', useWriteSchema(async ({ db, schema }) => {
 *     // Gets a DIFFERENT schema than the previous write test
 *   }));
 * });
 * ```
 */

import { PrismaClient } from "@prisma/client";
import type { SchemaMeta, SerializableInfra } from "./setupFile";

/**
 * Test context passed to test functions
 */
export interface TestContext {
  db: PrismaClient;
  schema: SchemaMeta;
  schemaName: string;
}

/**
 * Test function signature
 */
export type TestFn = (context: TestContext) => Promise<void> | void;

/**
 * Schema allocator for a single test file
 */
export interface SchemaAllocator {
  useReadSchema: (fn: TestFn) => () => Promise<void>;
  useWriteSchema: (fn: TestFn) => () => Promise<void>;
  cleanup: () => Promise<void>;
}

/**
 * Internal state for schema allocation (per file)
 */
interface AllocatorState {
  serviceName: string;
  readSchema: SchemaMeta | null;
  writeSchemas: SchemaMeta[];
  writeIndex: number;
  readClient: PrismaClient | null;
  writeClients: Map<number, PrismaClient>;
}

/**
 * Get infrastructure from global setup (with retry logic for timing)
 */
function getInfra(): SerializableInfra {
  const infra = global.__DB_INFRA__;
  if (!infra) {
    throw new Error(
      "❌ Database infrastructure not initialized! This should be set by setupFile.ts before tests run."
    );
  }
  return infra;
}

/**
 * Wait for infrastructure to be available (lazy initialization)
 */
async function waitForInfra(
  timeoutMs: number = 5000
): Promise<SerializableInfra> {
  const startTime = Date.now();

  while (!global.__DB_INFRA__) {
    if (Date.now() - startTime > timeoutMs) {
      throw new Error(
        "❌ Timeout waiting for database infrastructure. Make sure setupFiles is configured in vitest.config.ts"
      );
    }
    // Wait a bit before checking again
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return global.__DB_INFRA__!;
}

/**
 * Create a schema allocator for a specific service (LAZY INITIALIZATION)
 *
 * @param serviceName - The service name (e.g., 'auth', 'payment', 'inventory')
 * @returns Schema allocator with useReadSchema and useWriteSchema helpers
 */
export function createSchemaAllocator(serviceName: string): SchemaAllocator {
  // Internal state for this file (created immediately)
  const state: AllocatorState = {
    serviceName,
    readSchema: null,
    writeSchemas: [],
    writeIndex: 0,
    readClient: null,
    writeClients: new Map(),
  };

  // Flag to track if we've initialized
  let initialized = false;

  /**
   * Lazy initialization - happens on first test execution
   */
  const ensureInitialized = async () => {
    if (initialized) return;

    // Wait for infrastructure to be available
    const infra = await waitForInfra();

    if (!infra || !infra.schemas) {
      throw new Error(
        "❌ Database infrastructure not found! Check setupFiles configuration."
      );
    }

    // Filter schemas for this service
    const serviceSchemas = infra.schemas.filter(
      (s) => s.service === serviceName
    );

    if (serviceSchemas.length === 0) {
      throw new Error(
        `❌ No schemas found for service '${serviceName}'. Available services: ${[
          ...new Set(infra.schemas.map((s) => s.service)),
        ].join(", ")}`
      );
    }

    // Sort schemas by id for deterministic allocation
    serviceSchemas.sort((a, b) => a.id - b.id);

    // Partition: First schema = reads, rest = writes
    const [readSchema, ...writeSchemas] = serviceSchemas;

    if (writeSchemas.length === 0) {
      console.warn(
        `⚠️  WARNING: Service '${serviceName}' has only 1 schema. Mutating tests will share the read schema.`
      );
      console.warn(
        `   Consider adding more schemas to this service for proper isolation.`
      );
    }

    // Update state
    state.readSchema = readSchema;
    state.writeSchemas = writeSchemas.length > 0 ? writeSchemas : [readSchema];
    initialized = true;

    // Log schema allocation summary
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

  /**
   * Get or create a Prisma client for a schema
   */
  const getOrCreateClient = async (
    schema: SchemaMeta,
    clientMap: Map<number, PrismaClient> | null,
    clientKey: number | "read"
  ): Promise<PrismaClient> => {
    // Check if client already exists
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

    // Create new client with search_path in connection string
    const connectionUrl = new URL(schema.connectionUri);
    connectionUrl.searchParams.set("schema", schema.schemaName);

    const client = new PrismaClient({
      datasources: { db: { url: connectionUrl.toString() } },
      log: ["error"],
    });

    // Connect
    await client.$connect();

    // Store client
    if (clientKey === "read") {
      state.readClient = client;
    } else if (typeof clientKey === "number" && clientMap) {
      clientMap.set(clientKey, client);
    }

    return client;
  };

  /**
   * Wrapper for read-only tests (shares one schema)
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

      const db = await getOrCreateClient(state.readSchema, null, "read");

      // Diagnostic logging
      console.log(
        `📖 READ Schema (Shared): ${state.readSchema.schemaName} for service '${serviceName}'`
      );

      const context: TestContext = {
        db,
        schema: state.readSchema,
        schemaName: state.readSchema.schemaName,
      };

      await fn(context);
    };
  };

  /**
   * Wrapper for mutating tests (each gets unique schema)
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
        `🔒 WRITE Schema Allocated: ${schema.schemaName} (${schemaIndex + 1}/${
          state.writeSchemas.length
        }) for service '${serviceName}'`
      );

      // Increment for next test
      state.writeIndex++;

      const db = await getOrCreateClient(
        schema,
        state.writeClients,
        schemaIndex
      );

      const context: TestContext = {
        db,
        schema,
        schemaName: schema.schemaName,
      };

      await fn(context);
    };
  };

  /**
   * Cleanup function - disconnect all Prisma clients
   * Call this in afterAll() hook to prevent memory leaks
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

  return {
    useReadSchema,
    useWriteSchema,
    cleanup,
  };
}

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
