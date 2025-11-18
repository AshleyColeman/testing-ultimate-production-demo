import { ContainerManager } from "../../utils/ContainerManager";
import { PrismaClient } from "@prisma/client";
import { LRUCache } from "../../utils/LRUCache";
import { MemoryManager } from "../../utils/MemoryManager";
import { MemoryMonitor } from "../../utils/MemoryMonitor";
import { createLogger } from "../../utils/Logger";

/**
 * 🏗️ SHARED TEST INFRASTRUCTURE
 *
 * This module provides centralized infrastructure for all 50+ test files.
 * It ensures efficient resource sharing and consistent setup across the entire test suite.
 */

export interface SchemaConfig {
  containerIndex: number;
  schemaName: string;
  connectionUri: string;
  prisma: PrismaClient;
  service: string;
  environment: string;
}

export interface TestInfrastructure {
  containers: ContainerManager[];
  schemas: SchemaConfig[];
  connectionCache: LRUCache<string, PrismaClient>;
  memoryManager: MemoryManager;
  memoryMonitor: MemoryMonitor;
  logger: ReturnType<typeof createLogger>;
  isInitialized: boolean;
}

// Singleton infrastructure instance
let infrastructure: TestInfrastructure | null = null;
let initializationPromise: Promise<TestInfrastructure> | null = null;

// Infrastructure constants
// With 6 worker threads, we create 2 containers per thread = 12 containers total
// Each container has 8 schemas (1 READ + 7 WRITE)
// This allows 6 test files to run in parallel, each with 2 containers (16 schemas)
export const MAX_WORKER_THREADS = 6;
export const CONTAINERS_PER_THREAD = 2;
export const CONTAINER_COUNT = MAX_WORKER_THREADS * CONTAINERS_PER_THREAD; // 12 containers
export const SCHEMAS_PER_CONTAINER = 8;
export const TOTAL_SCHEMAS = CONTAINER_COUNT * SCHEMAS_PER_CONTAINER; // 96 schemas

// Service and environment configuration
// With 12 containers, we cycle through these services
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

export const ENVIRONMENTS = [
  "prod-us-east",
  "prod-us-west",
  "prod-eu-central",
  "prod-apac-south",
  "prod-canada",
];

/**
 * Initialize the shared infrastructure (call once at the beginning)
 */
export async function initializeInfrastructure(): Promise<TestInfrastructure> {
  // If already initialized, return immediately
  if (infrastructure?.isInitialized) {
    return infrastructure;
  }

  // If initialization is in progress, wait for it
  if (initializationPromise) {
    return initializationPromise;
  }

  // Start initialization
  initializationPromise = (async () => {
    const logger = createLogger("TestInfrastructure", "logs/combined.log");
    logger.info("🏗️ Initializing shared test infrastructure...");

    // Initialize production infrastructure
    const connectionCache = new LRUCache<string, PrismaClient>({
      maxSize: 30,
      enableStats: true,
      onEvict: (key, client) => {
        logger.info(`🗑️ Cache eviction: ${key}`);
        client.$disconnect().catch(() => {});
      },
    });

    const memoryManager = MemoryManager.getInstance();
    const memoryMonitor = MemoryMonitor.getInstance();
    memoryMonitor.startMonitoring();

    // Register infrastructure components
    memoryManager.registerComponent({
      name: "sharedConnectionCache",
      getMemoryUsage: () => connectionCache.getStats().currentSize * 3000,
      getStats: () => connectionCache.getStats(),
      cleanup: async () => {
        logger.info("🧹 Shared cache cleanup initiated...");
      },
    });

    memoryManager.registerComponent({
      name: "sharedMemoryMonitor",
      getMemoryUsage: () => 8000,
      getStats: () => ({ status: "active", monitoring: "shared" }),
      cleanup: async () => {
        memoryMonitor.stopMonitoring();
      },
    });

    logger.info("📦 Creating container infrastructure...");
    const containers: ContainerManager[] = [];

    // Create containers in parallel
    const containerPromises = Array.from(
      { length: CONTAINER_COUNT },
      async (_, i) => {
        const container = new ContainerManager({
          database: `test_${SERVICES[i]}_${ENVIRONMENTS[i]}`,
          username: `test_user_${i + 1}`,
          password: `test_pass_${i + 1}`,
          reuse: false,
        });

        await container.startContainer();

        memoryManager.registerComponent({
          name: `container_${SERVICES[i]}_${ENVIRONMENTS[i]}`,
          getMemoryUsage: () => 10000 + Math.random() * 5000,
          getStats: () => ({
            service: SERVICES[i],
            environment: ENVIRONMENTS[i],
            containerId: i + 1,
            status: "ready",
          }),
          getPriority: () => (SERVICES[i] === "auth" ? 5 : 3),
        });

        logger.info(`✅ Container ${i + 1} (${SERVICES[i]}) ready`);
        return container;
      }
    );

    const containerResults = await Promise.all(containerPromises);
    containers.push(...containerResults);

    // Give all containers a moment to fully stabilize
    logger.info("⏳ Waiting for all containers to fully stabilize...");
    await new Promise((resolve) => setTimeout(resolve, 3000));

    logger.info("🗄️ Creating schema infrastructure...");
    const schemas: SchemaConfig[] = [];

    // Create schemas in parallel
    const schemaPromises = [];
    for (
      let containerIndex = 0;
      containerIndex < containers.length;
      containerIndex++
    ) {
      const container = containers[containerIndex];
      const connectionUri = container.getConnectionUri()!;
      const service = SERVICES[containerIndex];
      const environment = ENVIRONMENTS[containerIndex];

      for (
        let schemaIndex = 0;
        schemaIndex < SCHEMAS_PER_CONTAINER;
        schemaIndex++
      ) {
        const schemaName = `test_${service}_${environment}_schema${
          schemaIndex + 1
        }`;

        const schemaPromise = (async () => {
          let prisma = connectionCache.get(connectionUri);

          if (!prisma) {
            prisma = new PrismaClient({
              datasources: { db: { url: connectionUri } },
              log: ["error"],
            });

            // Retry connection with exponential backoff
            let connected = false;
            let attempts = 0;
            const maxAttempts = 5;

            while (!connected && attempts < maxAttempts) {
              try {
                await prisma.$connect();
                // Verify connection works
                await prisma.$queryRaw`SELECT 1`;
                connected = true;
                connectionCache.set(connectionUri, prisma);
              } catch (error) {
                attempts++;
                if (attempts >= maxAttempts) {
                  logger.error(
                    `❌ Failed to connect to ${service} after ${maxAttempts} attempts`
                  );
                  logger.error(`   Error: ${(error as Error).message}`);
                  throw new Error(
                    `Failed to connect after ${maxAttempts} attempts`
                  );
                }
                // Longer wait times with exponential backoff
                const waitTime = Math.min(2000 * Math.pow(1.5, attempts), 8000);
                logger.info(
                  `   ⏳ Retry ${attempts}/${maxAttempts} in ${waitTime}ms...`
                );
                await new Promise((resolve) => setTimeout(resolve, waitTime));
              }
            }
          }

          await prisma.$executeRawUnsafe(`CREATE SCHEMA "${schemaName}"`);

          // Create test tables
          await prisma.$executeRawUnsafe(`
          CREATE TABLE "${schemaName}".test_data (
            id SERIAL PRIMARY KEY,
            test_type VARCHAR(100) NOT NULL,
            test_name VARCHAR(200) NOT NULL,
            test_result VARCHAR(50) NOT NULL,
            execution_time_ms INTEGER,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            metadata JSONB
          )
        `);

          await prisma.$executeRawUnsafe(`
          CREATE TABLE "${schemaName}".test_metrics (
            id SERIAL PRIMARY KEY,
            metric_name VARCHAR(100) NOT NULL,
            metric_value DECIMAL(10,2) NOT NULL,
            test_file VARCHAR(200) NOT NULL,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);

          // Create user table for user service tests
          await prisma.$executeRawUnsafe(`
          CREATE TABLE "${schemaName}".user (
            id SERIAL PRIMARY KEY,
            email VARCHAR(255) UNIQUE NOT NULL,
            name VARCHAR(100) NOT NULL,
            "isActive" BOOLEAN DEFAULT true,
            "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);

          return {
            containerIndex,
            schemaName,
            connectionUri,
            prisma,
            service,
            environment,
          };
        })();

        schemaPromises.push(schemaPromise);
      }
    }

    const schemaResults = await Promise.all(schemaPromises);
    schemas.push(...schemaResults);

    logger.info(
      `✅ Infrastructure ready: ${containers.length} containers, ${schemas.length} schemas`
    );

    infrastructure = {
      containers,
      schemas,
      connectionCache,
      memoryManager,
      memoryMonitor,
      logger,
      isInitialized: true,
    };

    return infrastructure;
  })();

  return initializationPromise;
}

/**
 * Get the shared infrastructure (auto-initializes on first call)
 */
export async function getInfrastructure(): Promise<TestInfrastructure> {
  if (!infrastructure?.isInitialized) {
    // Auto-initialize on first access
    await initializeInfrastructure();
  }
  return infrastructure!;
}

/**
 * Cleanup the shared infrastructure (call once at the end)
 */
export async function cleanupInfrastructure(): Promise<void> {
  if (!infrastructure) {
    return;
  }

  const { containers, connectionCache, memoryMonitor, logger } = infrastructure;

  logger.info("🧹 Starting infrastructure cleanup...");

  // Disconnect all cached connections
  const connectionUris = containers.map((c) => c.getConnectionUri()!);
  for (const uri of connectionUris) {
    const client = connectionCache.get(uri);
    if (client) {
      await client.$disconnect();
      connectionCache.delete(uri);
    }
  }

  memoryMonitor.stopMonitoring();

  // Stop all containers
  await Promise.all(
    containers.map(async (container, index) => {
      try {
        await container.stopContainer();
        logger.info(`✅ Container ${index + 1} stopped`);
      } catch {}
    })
  );

  logger.info("✅ Infrastructure cleanup complete");
  infrastructure = null;
}

/**
 * Get a random schema for testing
 */
export async function getRandomSchema(): Promise<SchemaConfig> {
  const infra = await getInfrastructure();
  const randomIndex = Math.floor(Math.random() * infra.schemas.length);
  return infra.schemas[randomIndex];
}

/**
 * Get schemas for a specific service
 */
export async function getSchemasByService(
  service: string
): Promise<SchemaConfig[]> {
  const infra = await getInfrastructure();
  return infra.schemas.filter((s: SchemaConfig) => s.service === service);
}

/**
 * Get schemas for a specific environment
 */
export async function getSchemasByEnvironment(
  environment: string
): Promise<SchemaConfig[]> {
  const infra = await getInfrastructure();
  return infra.schemas.filter(
    (s: SchemaConfig) => s.environment === environment
  );
}

/**
 * Execute a query on a random schema
 */
export async function executeOnRandomSchema(
  query: string,
  params?: any[]
): Promise<any> {
  const schema = await getRandomSchema();
  if (params) {
    return await schema.prisma.$queryRawUnsafe(query, ...params);
  }
  return await schema.prisma.$queryRawUnsafe(query);
}

/**
 * Record a test execution
 */
export async function recordTestExecution(
  testType: string,
  testName: string,
  testResult: string,
  executionTimeMs: number,
  metadata?: any
): Promise<void> {
  const schema = await getRandomSchema();
  await schema.prisma.$executeRawUnsafe(`
    INSERT INTO "${schema.schemaName}".test_data 
    (test_type, test_name, test_result, execution_time_ms, metadata)
    VALUES (
      '${testType}',
      '${testName}',
      '${testResult}',
      ${executionTimeMs},
      ${metadata ? `'${JSON.stringify(metadata)}'::jsonb` : "NULL"}
    )
  `);
}
