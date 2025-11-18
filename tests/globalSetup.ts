/**
 * 🌍 GLOBAL SETUP FOR VITEST
 *
 * This file runs ONCE before all tests start.
 * It:
 * 1. Initializes all containers and schemas
 * 2. Makes schema metadata available to all test files via a global variable
 * 3. Returns a teardown function to clean up after all tests
 *
 * This replaces the orchestrator pattern - Vitest discovers tests naturally.
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
 * (Can be accessed via global variable)
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

// Global variable to store infrastructure (accessible from all test files)
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

  // Initialize containers and schemas
  await initializeInfrastructure();
  const infra = await getInfrastructure();

  // Build serializable schema metadata
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

  // Write infrastructure data to a file for worker threads to read
  // (globalSetup runs in a separate process, so we can't use global variables)
  const fs = await import("fs/promises");
  const path = await import("path");
  const infraFilePath = path.join(__dirname, ".vitest-infra.json");
  await fs.writeFile(infraFilePath, JSON.stringify(serializableInfra, null, 2));

  // Also set global for backward compatibility (though it won't be accessible to workers)
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
  const schemasByService = schemas.reduce((acc, schema) => {
    acc[schema.service] = (acc[schema.service] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  Object.entries(schemasByService).forEach(([service, count]) => {
    console.log(`   • ${service}: ${count} schemas`);
  });
  console.log("");

  // Return teardown function
  return async () => {
    console.log("\n🧹 ============================================");
    console.log("🧹 GLOBAL TEARDOWN - CLEANING UP");
    console.log("🧹 ============================================\n");

    await cleanupInfrastructure();

    // Clean up infrastructure file
    const fs = await import("fs/promises");
    const path = await import("path");
    const infraFilePath = path.join(__dirname, ".vitest-infra.json");
    try {
      await fs.unlink(infraFilePath);
    } catch (err) {
      // File might not exist, that's ok
    }

    console.log("✅ Global teardown complete!");
  };
}
