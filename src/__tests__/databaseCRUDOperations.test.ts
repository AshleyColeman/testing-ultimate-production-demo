/**
 * 🗄️ DATABASE CRUD OPERATIONS DEMO
 *
 * This test demonstrates REAL database interactions:
 * 1. CREATE (INSERT) - Add records to PostgreSQL
 * 2. READ (SELECT) - Query and verify data
 * 3. UPDATE - Modify existing records
 * 4. DELETE - Remove records
 *
 * Unlike the 500+ mock tests, this shows actual database state changes
 * and verifies data integrity throughout the lifecycle.
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import path from "path";
import fs from "fs";
import {
  initializeInfrastructure,
  getInfrastructure,
  getSchemasByService,
  cleanupInfrastructure,
} from "./shared/testInfrastructure";
import { createLogger } from "../utils/Logger";
import { PrismaClient } from "@prisma/client";

describe("🗄️ Database CRUD Operations - Real Data Verification", () => {
  const logger = createLogger("DatabaseCRUD");
  let testPrisma: PrismaClient | null = null;
  let testSchema: any = null;
  let logFile: fs.WriteStream | null = null;
  let isLoggingEnabled = true; // Flag to control logging

  // Create detailed execution log
  const logFilePath = path.join(
    process.cwd(),
    "logs",
    "database-crud-demo.log"
  );

  const log = (message: string, data?: any) => {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}`;
    console.log(logEntry);

    // Only write to file if logging is enabled and stream is writable
    if (isLoggingEnabled && logFile && logFile.writable && !logFile.destroyed) {
      try {
        logFile.write(logEntry + "\n");
        if (data) {
          const dataStr = JSON.stringify(data, null, 2);
          console.log(dataStr);
          logFile.write(dataStr + "\n");
        }
      } catch (error) {
        // Silently fail on log write errors - don't break tests
      }
    } else if (data) {
      console.log(JSON.stringify(data, null, 2));
    }
  };

  // ========================================================================
  // SETUP: Initialize Infrastructure
  // ========================================================================
  beforeAll(async () => {
    // Initialize log file
    const logDir = path.dirname(logFilePath);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    logFile = fs.createWriteStream(logFilePath, { flags: "w" });

    log("🚀 ============================================");
    log("🚀 DATABASE CRUD OPERATIONS TEST - STARTING");
    log("🚀 ============================================");
    log("");
    log("📋 Initializing test infrastructure...");

    try {
      // Initialize shared infrastructure (containers + schemas)
      await initializeInfrastructure();
      const infra = await getInfrastructure();

      log(
        `✅ Infrastructure ready: ${infra.containers.length} containers, ${infra.schemas.length} schemas`
      );
      log("");

      // Get a random auth schema for our tests
      const authSchemas = await getSchemasByService("auth");
      if (!authSchemas || authSchemas.length === 0) {
        throw new Error("No auth schemas available");
      }

      testSchema = authSchemas[Math.floor(Math.random() * authSchemas.length)];

      log(`📊 Selected test schema: ${testSchema.schemaName}`);
      log(`   Service: ${testSchema.service}`);
      log(`   Environment: ${testSchema.environment}`);
      log("");

      // Create Prisma client for this specific schema
      testPrisma = new PrismaClient({
        datasources: {
          db: {
            url: testSchema.connectionUri,
          },
        },
        log: ["error"], // Only log errors to keep output clean
      });

      // Connect to database
      await testPrisma.$connect();
      log("✅ Connected to database");
      log("");

      // Create the ServiceLog table in this schema
      log("📊 Creating database table structure...");
      await testPrisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "ServiceLog" (
          id SERIAL PRIMARY KEY,
          "serviceName" TEXT NOT NULL,
          "logLevel" TEXT NOT NULL,
          message TEXT NOT NULL,
          timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
          "instanceId" TEXT NOT NULL,
          environment TEXT NOT NULL,
          "processingTime" INTEGER
        )
      `);
      log("✅ Database table created");
      log("");
    } catch (error) {
      log("❌ Setup failed:", error);
      throw error;
    }
  }, 300000); // 5 minute timeout

  // ========================================================================
  // CLEANUP: Tear Down Infrastructure
  // ========================================================================
  afterAll(async () => {
    console.log("");
    console.log("🧹 ============================================");
    console.log("🧹 CLEANUP - STARTING");
    console.log("🧹 ============================================");

    // Disconnect Prisma client
    if (testPrisma) {
      try {
        await testPrisma.$disconnect();
        console.log("✅ Disconnected from database");
      } catch (error) {
        console.log("⚠️ Error disconnecting from database:", error);
      }
    }

    // Cleanup infrastructure
    try {
      await cleanupInfrastructure();
      console.log("✅ Infrastructure cleaned up");
    } catch (error) {
      console.log("⚠️ Error during infrastructure cleanup:", error);
    }

    // Disable logging before closing file to prevent "write after end" errors
    isLoggingEnabled = false;

    // Close log file safely with a promise
    if (logFile && logFile.writable && !logFile.destroyed) {
      await new Promise<void>((resolve) => {
        logFile!.end(() => {
          console.log("✅ Log file closed");
          resolve();
        });
      });
    }
    console.log("");
  }, 180000); // 3 minute timeout

  // ========================================================================
  // TEST 1: CREATE (INSERT) - Add Records to Database
  // ========================================================================
  it("should INSERT a new user record into the database", async () => {
    // Ensure setup completed successfully
    if (!testPrisma) {
      throw new Error("Test infrastructure not initialized");
    }

    log("📝 ============================================");
    log("📝 TEST 1: CREATE (INSERT) Operation");
    log("📝 ============================================");
    log("");

    // Define test data
    const userData = {
      serviceName: "auth-service",
      logLevel: "INFO",
      message: "User registration successful",
      instanceId: `instance-${Date.now()}`,
      environment: "test",
      processingTime: 150,
    };

    log("📊 Inserting user record with data:", userData);

    // INSERT into database
    const createdRecord = await testPrisma.serviceLog.create({
      data: userData,
    });

    log("✅ Record created with ID:", createdRecord.id);
    log("📊 Full created record:", createdRecord);
    log("");

    // VERIFY: Record exists in database
    const verifyRecord = await testPrisma.serviceLog.findUnique({
      where: { id: createdRecord.id },
    });

    log("🔍 Verification - Record retrieved from database:", verifyRecord);
    log("");

    // ASSERTIONS: Verify all fields match
    expect(verifyRecord).not.toBeNull();
    expect(verifyRecord?.id).toBe(createdRecord.id);
    expect(verifyRecord?.serviceName).toBe(userData.serviceName);
    expect(verifyRecord?.logLevel).toBe(userData.logLevel);
    expect(verifyRecord?.message).toBe(userData.message);
    expect(verifyRecord?.instanceId).toBe(userData.instanceId);
    expect(verifyRecord?.environment).toBe(userData.environment);
    expect(verifyRecord?.processingTime).toBe(userData.processingTime);

    log("✅ TEST 1 PASSED: Record successfully inserted and verified");
    log("   - Record ID: " + createdRecord.id);
    log("   - Service: " + verifyRecord?.serviceName);
    log("   - Message: " + verifyRecord?.message);
    log("");
  });

  // ========================================================================
  // TEST 2: UPDATE - Modify Existing Records
  // ========================================================================
  it("should UPDATE an existing record in the database", async () => {
    // Ensure setup completed successfully
    if (!testPrisma) {
      throw new Error("Test infrastructure not initialized");
    }

    log("✏️ ============================================");
    log("✏️ TEST 2: UPDATE Operation");
    log("✏️ ============================================");
    log("");

    // First, create a record to update
    const initialData = {
      serviceName: "payment-service",
      logLevel: "INFO",
      message: "Payment processing started",
      instanceId: `instance-${Date.now()}`,
      environment: "test",
      processingTime: 200,
    };

    log("📊 Step 1: Creating initial record:", initialData);
    const originalRecord = await testPrisma.serviceLog.create({
      data: initialData,
    });
    log("✅ Original record created with ID:", originalRecord.id);
    log("📊 Original state:", originalRecord);
    log("");

    // UPDATE the record
    const updatedData = {
      logLevel: "WARN",
      message: "Payment processing delayed - retrying",
      processingTime: 5000,
    };

    log("📊 Step 2: Updating record with new data:", updatedData);
    const updatedRecord = await testPrisma.serviceLog.update({
      where: { id: originalRecord.id },
      data: updatedData,
    });

    log("✅ Record updated successfully");
    log("📊 Updated state:", updatedRecord);
    log("");

    // VERIFY: Get the record again to confirm changes
    const verifyRecord = await testPrisma.serviceLog.findUnique({
      where: { id: originalRecord.id },
    });

    log("🔍 Verification - Final state from database:", verifyRecord);
    log("");

    // ASSERTIONS: Verify updates applied correctly
    expect(verifyRecord).not.toBeNull();
    expect(verifyRecord?.id).toBe(originalRecord.id);

    // Fields that should be CHANGED
    expect(verifyRecord?.logLevel).toBe("WARN");
    expect(verifyRecord?.message).toBe("Payment processing delayed - retrying");
    expect(verifyRecord?.processingTime).toBe(5000);

    // Fields that should remain UNCHANGED
    expect(verifyRecord?.serviceName).toBe(initialData.serviceName);
    expect(verifyRecord?.instanceId).toBe(initialData.instanceId);
    expect(verifyRecord?.environment).toBe(initialData.environment);

    log("✅ TEST 2 PASSED: Record successfully updated and verified");
    log("   - Record ID: " + originalRecord.id);
    log("   - Log Level: INFO → WARN ✓");
    log("   - Processing Time: 200ms → 5000ms ✓");
    log("   - Message updated ✓");
    log("");
  });

  // ========================================================================
  // TEST 3: READ (SELECT) - Query and Verify Data
  // ========================================================================
  it("should SELECT and retrieve records from the database", async () => {
    // Ensure setup completed successfully
    if (!testPrisma) {
      throw new Error("Test infrastructure not initialized");
    }

    log("🔍 ============================================");
    log("🔍 TEST 3: READ (SELECT) Operation");
    log("🔍 ============================================");
    log("");

    // Create multiple test records
    const testRecords = [
      {
        serviceName: "inventory-service",
        logLevel: "INFO",
        message: "Stock level check completed",
        instanceId: "inventory-1",
        environment: "production",
        processingTime: 100,
      },
      {
        serviceName: "inventory-service",
        logLevel: "ERROR",
        message: "Stock level below threshold",
        instanceId: "inventory-1",
        environment: "production",
        processingTime: 120,
      },
      {
        serviceName: "inventory-service",
        logLevel: "INFO",
        message: "Reorder triggered successfully",
        instanceId: "inventory-1",
        environment: "production",
        processingTime: 150,
      },
    ];

    log("📊 Step 1: Creating test records...");
    const createdRecords = [];
    for (const record of testRecords) {
      const created = await testPrisma.serviceLog.create({ data: record });
      createdRecords.push(created);
      log(`   ✓ Created record ID ${created.id}: ${record.message}`);
    }
    log("");

    // SELECT: Query all inventory-service records
    log("📊 Step 2: Querying all inventory-service records...");
    const inventoryRecords = await testPrisma.serviceLog.findMany({
      where: {
        serviceName: "inventory-service",
        instanceId: "inventory-1",
      },
      orderBy: {
        id: "asc",
      },
    });

    log(`✅ Retrieved ${inventoryRecords.length} records from database`);
    log("📊 Retrieved records:");
    inventoryRecords.forEach((record, idx) => {
      log(
        `   ${idx + 1}. ID: ${record.id}, Level: ${record.logLevel}, Message: ${
          record.message
        }`
      );
    });
    log("");

    // SELECT: Query specific record with filter
    log("📊 Step 3: Querying ERROR level records...");
    const errorRecords = await testPrisma.serviceLog.findMany({
      where: {
        serviceName: "inventory-service",
        logLevel: "ERROR",
      },
    });

    log(`✅ Retrieved ${errorRecords.length} ERROR records`);
    log("📊 Error record details:", errorRecords[0]);
    log("");

    // SELECT: Count records
    log("📊 Step 4: Counting total inventory-service records...");
    const recordCount = await testPrisma.serviceLog.count({
      where: {
        serviceName: "inventory-service",
        instanceId: "inventory-1",
      },
    });

    log(`✅ Total count: ${recordCount} records`);
    log("");

    // ASSERTIONS: Verify query results
    expect(inventoryRecords).toHaveLength(3);
    expect(errorRecords).toHaveLength(1);
    expect(recordCount).toBe(3);

    // Verify data integrity
    expect(inventoryRecords[0].serviceName).toBe("inventory-service");
    expect(inventoryRecords[1].logLevel).toBe("ERROR");
    expect(inventoryRecords[2].message).toBe("Reorder triggered successfully");

    // Verify ordering
    expect(inventoryRecords[0].id).toBeLessThan(inventoryRecords[1].id);
    expect(inventoryRecords[1].id).toBeLessThan(inventoryRecords[2].id);

    log("✅ TEST 3 PASSED: Records successfully queried and verified");
    log("   - Total records: " + recordCount);
    log("   - ERROR records: " + errorRecords.length);
    log("   - All data integrity checks passed ✓");
    log("");
  });

  // ========================================================================
  // TEST 4: DELETE - Remove Records from Database
  // ========================================================================
  it("should DELETE a record from the database", async () => {
    // Ensure setup completed successfully
    if (!testPrisma) {
      throw new Error("Test infrastructure not initialized");
    }

    log("🗑️ ============================================");
    log("🗑️ TEST 4: DELETE Operation");
    log("🗑️ ============================================");
    log("");

    // Create a record to delete
    const testData = {
      serviceName: "notification-service",
      logLevel: "INFO",
      message: "Email notification sent",
      instanceId: `instance-${Date.now()}`,
      environment: "test",
      processingTime: 300,
    };

    log("📊 Step 1: Creating record to delete:", testData);
    const recordToDelete = await testPrisma.serviceLog.create({
      data: testData,
    });
    log("✅ Record created with ID:", recordToDelete.id);
    log("");

    // Verify it exists before deletion
    log("📊 Step 2: Verifying record exists before deletion...");
    const beforeDelete = await testPrisma.serviceLog.findUnique({
      where: { id: recordToDelete.id },
    });
    log("✅ Record found:", beforeDelete?.message);
    expect(beforeDelete).not.toBeNull();
    log("");

    // DELETE the record
    log("📊 Step 3: Deleting record...");
    await testPrisma.serviceLog.delete({
      where: { id: recordToDelete.id },
    });
    log(`✅ Record ID ${recordToDelete.id} deleted from database`);
    log("");

    // VERIFY: Record no longer exists
    log("📊 Step 4: Verifying record no longer exists...");
    const afterDelete = await testPrisma.serviceLog.findUnique({
      where: { id: recordToDelete.id },
    });

    log(
      "🔍 Query result:",
      afterDelete === null ? "null (record not found)" : afterDelete
    );
    log("");

    // ASSERTIONS: Verify deletion
    expect(afterDelete).toBeNull();

    log("✅ TEST 4 PASSED: Record successfully deleted and verified");
    log(
      "   - Record ID " + recordToDelete.id + " no longer exists in database ✓"
    );
    log("");
  });

  // ========================================================================
  // BONUS TEST: Complex CRUD Workflow
  // ========================================================================
  it("should demonstrate a complete CRUD lifecycle workflow", async () => {
    // Ensure setup completed successfully
    if (!testPrisma) {
      throw new Error("Test infrastructure not initialized");
    }

    log("🔄 ============================================");
    log("🔄 BONUS: Complete CRUD Lifecycle Workflow");
    log("🔄 ============================================");
    log("");

    // STEP 1: CREATE multiple related records
    log("📊 STEP 1: CREATE - Building transaction log...");
    const transactionRecords = [];
    for (let i = 1; i <= 5; i++) {
      const record = await testPrisma.serviceLog.create({
        data: {
          serviceName: "analytics-service",
          logLevel: "INFO",
          message: `Processing batch ${i} of 5`,
          instanceId: "analytics-worker-1",
          environment: "production",
          processingTime: 100 * i,
        },
      });
      transactionRecords.push(record);
      log(`   ✓ Created batch ${i}, ID: ${record.id}`);
    }
    log("✅ Created 5 transaction records");
    log("");

    // STEP 2: READ - Query and analyze
    log("📊 STEP 2: READ - Analyzing transaction data...");
    const allRecords = await testPrisma.serviceLog.findMany({
      where: {
        serviceName: "analytics-service",
        instanceId: "analytics-worker-1",
      },
    });

    const avgProcessingTime =
      allRecords.reduce((sum, r) => sum + (r.processingTime || 0), 0) /
      allRecords.length;

    log(`   ✓ Total records: ${allRecords.length}`);
    log(`   ✓ Average processing time: ${avgProcessingTime}ms`);
    expect(allRecords).toHaveLength(5);
    expect(avgProcessingTime).toBe(300); // (100+200+300+400+500)/5
    log("");

    // STEP 3: UPDATE - Mark some as completed
    log("📊 STEP 3: UPDATE - Marking batches as completed...");
    for (let i = 0; i < 3; i++) {
      await testPrisma.serviceLog.update({
        where: { id: transactionRecords[i].id },
        data: {
          message: `Batch ${i + 1} completed successfully`,
          logLevel: "SUCCESS",
        },
      });
      log(`   ✓ Updated batch ${i + 1} to SUCCESS`);
    }
    log("✅ Updated 3 records to completed status");
    log("");

    // STEP 4: READ - Verify updates
    log("📊 STEP 4: READ - Verifying completion status...");
    const completedCount = await testPrisma.serviceLog.count({
      where: {
        serviceName: "analytics-service",
        instanceId: "analytics-worker-1",
        logLevel: "SUCCESS",
      },
    });
    log(`   ✓ Completed batches: ${completedCount}`);
    expect(completedCount).toBe(3);
    log("");

    // STEP 5: DELETE - Clean up completed records
    log("📊 STEP 5: DELETE - Cleaning up completed batches...");
    const deletedResult = await testPrisma.serviceLog.deleteMany({
      where: {
        serviceName: "analytics-service",
        instanceId: "analytics-worker-1",
        logLevel: "SUCCESS",
      },
    });
    log(`   ✓ Deleted ${deletedResult.count} completed records`);
    expect(deletedResult.count).toBe(3);
    log("");

    // STEP 6: READ - Final verification
    log("📊 STEP 6: READ - Final state verification...");
    const remainingRecords = await testPrisma.serviceLog.findMany({
      where: {
        serviceName: "analytics-service",
        instanceId: "analytics-worker-1",
      },
    });
    log(`   ✓ Remaining records: ${remainingRecords.length}`);
    remainingRecords.forEach((r, idx) => {
      log(`      ${idx + 1}. Batch ${idx + 4}, Status: ${r.logLevel}`);
    });
    expect(remainingRecords).toHaveLength(2);
    log("");

    log("✅ BONUS TEST PASSED: Complete CRUD lifecycle executed successfully");
    log("   - Created: 5 records ✓");
    log("   - Read: Multiple queries ✓");
    log("   - Updated: 3 records ✓");
    log("   - Deleted: 3 records ✓");
    log("   - Final state: 2 records remaining ✓");
    log("");
  });
});
