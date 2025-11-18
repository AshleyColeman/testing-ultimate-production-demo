/**
 * 🌍 VITEST SETUP FILE (In-Process)
 *
 * This runs ONCE before all tests in the SAME process.
 * Unlike globalSetup, this allows us to set global variables
 * that are accessible to test files.
 */

import {
  initializeInfrastructure,
  getInfrastructure,
  cleanupInfrastructure,
  CONTAINER_COUNT,
  TOTAL_SCHEMAS,
} from "../src/__tests__/shared/testInfrastructure";
import { beforeAll, afterAll } from "vitest";

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

// Global variable to store infrastructure
declare global {
  var __DB_INFRA__: SerializableInfra | undefined;
  var __DB_INFRA_INITIALIZED__: boolean | undefined;
  var __CLEANUP_REGISTERED__: boolean | undefined;
}

/**
 * Worker thread initialization
 * In parallel mode, globalSetup has already created containers and written data to a file
 * Each worker thread reads the infrastructure from the file
 */
beforeAll(async () => {
  // Check if already initialized in this worker
  if (global.__DB_INFRA_INITIALIZED__) {
    return;
  }

  const fs = await import("fs/promises");
  const path = await import("path");
  const infraFilePath = path.join(__dirname, ".vitest-infra.json");

  // Wait for infrastructure file from globalSetup (with timeout)
  const maxWait = 60000; // 60 seconds
  const startTime = Date.now();

  while (true) {
    try {
      const data = await fs.readFile(infraFilePath, "utf-8");
      const serializableInfra = JSON.parse(data);

      // Store in global for this worker thread
      global.__DB_INFRA__ = serializableInfra;
      global.__DB_INFRA_INITIALIZED__ = true;

      console.log(
        `\n✅ Worker ${process.pid} ready - loaded infrastructure from globalSetup\n`
      );
      break;
    } catch (err) {
      if (Date.now() - startTime > maxWait) {
        throw new Error(
          `❌ Timeout waiting for infrastructure file from globalSetup.\n` +
            `Expected file: ${infraFilePath}\n` +
            `Error: ${err instanceof Error ? err.message : String(err)}\n` +
            `Make sure globalSetup is configured in vitest.config.ts`
        );
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }
}, 300000); // 5 minute timeout
