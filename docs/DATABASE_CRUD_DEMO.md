# 🗄️ Database CRUD Operations Demo

## Overview

This is a **standalone test file** that demonstrates **real database interactions** with actual data verification, unlike the 500+ mock tests.

## What It Does

The test file (`databaseCRUDOperations.test.ts`) demonstrates:

1. **CREATE (INSERT)** - Add new records to PostgreSQL
2. **READ (SELECT)** - Query and retrieve data
3. **UPDATE** - Modify existing records
4. **DELETE** - Remove records

**Key Difference:** This test verifies **actual database state** - no hardcoded mock values!

---

## Running the Test

### Single Command

```bash
npx vitest run src/__tests__/databaseCRUDOperations.test.ts
```

### With Watch Mode (for development)

```bash
npx vitest watch src/__tests__/databaseCRUDOperations.test.ts
```

### With Verbose Output

```bash
npx vitest run src/__tests__/databaseCRUDOperations.test.ts --reporter=verbose
```

---

## What You'll See

### Console Output

```
🚀 ============================================
🚀 DATABASE CRUD OPERATIONS TEST - STARTING
🚀 ============================================

📋 Initializing test infrastructure...
✅ Infrastructure ready: 5 containers, 20 schemas
📊 Selected test schema: auth_prod-us-east_instance2

📝 ============================================
📝 TEST 1: CREATE (INSERT) Operation
📝 ============================================

📊 Inserting user record with data: {...}
✅ Record created with ID: 1
🔍 Verification - Record retrieved from database: {...}
✅ TEST 1 PASSED: Record successfully inserted and verified

✏️ ============================================
✏️ TEST 2: UPDATE Operation
✏️ ============================================

📊 Step 1: Creating initial record: {...}
✅ Original record created with ID: 2
📊 Step 2: Updating record with new data: {...}
✅ Record updated successfully
🔍 Verification - Final state from database: {...}
✅ TEST 2 PASSED: Record successfully updated and verified
   - Log Level: INFO → WARN ✓
   - Processing Time: 200ms → 5000ms ✓

🔍 ============================================
🔍 TEST 3: READ (SELECT) Operation
🔍 ============================================

📊 Step 1: Creating test records...
   ✓ Created record ID 3: Stock level check completed
   ✓ Created record ID 4: Stock level below threshold
   ✓ Created record ID 5: Reorder triggered successfully
📊 Step 2: Querying all inventory-service records...
✅ Retrieved 3 records from database
📊 Step 3: Querying ERROR level records...
✅ Retrieved 1 ERROR records
📊 Step 4: Counting total inventory-service records...
✅ Total count: 3 records
✅ TEST 3 PASSED: Records successfully queried and verified

🗑️ ============================================
🗑️ TEST 4: DELETE Operation
🗑️ ============================================

📊 Step 1: Creating record to delete: {...}
✅ Record created with ID: 6
📊 Step 2: Verifying record exists before deletion...
✅ Record found: Email notification sent
📊 Step 3: Deleting record...
✅ Record ID 6 deleted from database
📊 Step 4: Verifying record no longer exists...
🔍 Query result: null (record not found)
✅ TEST 4 PASSED: Record successfully deleted and verified

🔄 ============================================
🔄 BONUS: Complete CRUD Lifecycle Workflow
🔄 ============================================

📊 STEP 1: CREATE - Building transaction log...
   ✓ Created batch 1, ID: 7
   ✓ Created batch 2, ID: 8
   ✓ Created batch 3, ID: 9
   ✓ Created batch 4, ID: 10
   ✓ Created batch 5, ID: 11
📊 STEP 2: READ - Analyzing transaction data...
   ✓ Total records: 5
   ✓ Average processing time: 300ms
📊 STEP 3: UPDATE - Marking batches as completed...
   ✓ Updated batch 1 to SUCCESS
   ✓ Updated batch 2 to SUCCESS
   ✓ Updated batch 3 to SUCCESS
📊 STEP 4: READ - Verifying completion status...
   ✓ Completed batches: 3
📊 STEP 5: DELETE - Cleaning up completed batches...
   ✓ Deleted 3 completed records
📊 STEP 6: READ - Final state verification...
   ✓ Remaining records: 2
✅ BONUS TEST PASSED: Complete CRUD lifecycle executed successfully

Test Files  1 passed (1)
     Tests  5 passed (5)
  Duration  ~15-20s
```

### Log File

A detailed execution log is created at: **`logs/database-crud-demo.log`**

Check this file for:

- Exact timestamps
- Full data payloads
- Step-by-step execution trace
- Database state at each step

```bash
# View the log
cat logs/database-crud-demo.log

# Or on Windows
Get-Content logs/database-crud-demo.log
```

---

## Test Breakdown

### Test 1: INSERT (CREATE)

**What it does:**

- Creates a new `ServiceLog` record
- Inserts it into PostgreSQL
- Queries the database to verify it exists
- Compares all fields to ensure data integrity

**Key verification:**

```typescript
const createdRecord = await testPrisma.serviceLog.create({ data: userData });
const verifyRecord = await testPrisma.serviceLog.findUnique({
  where: { id: createdRecord.id },
});
expect(verifyRecord?.serviceName).toBe(userData.serviceName);
```

---

### Test 2: UPDATE

**What it does:**

- Creates an initial record (payment-service)
- Updates specific fields (logLevel, message, processingTime)
- Verifies changes in database
- Confirms unchanged fields remain intact

**Key verification:**

```typescript
// Updated fields
expect(verifyRecord?.logLevel).toBe("WARN"); // Changed from INFO
expect(verifyRecord?.processingTime).toBe(5000); // Changed from 200

// Unchanged fields
expect(verifyRecord?.serviceName).toBe(initialData.serviceName);
```

---

### Test 3: SELECT (READ)

**What it does:**

- Creates 3 related records (inventory-service)
- Queries all records for a service
- Filters by specific criteria (ERROR level)
- Counts records
- Verifies ordering and data integrity

**Key verification:**

```typescript
const inventoryRecords = await testPrisma.serviceLog.findMany({
  where: { serviceName: "inventory-service" },
  orderBy: { id: "asc" },
});
expect(inventoryRecords).toHaveLength(3);
expect(inventoryRecords[0].id).toBeLessThan(inventoryRecords[1].id);
```

---

### Test 4: DELETE

**What it does:**

- Creates a record (notification-service)
- Verifies it exists before deletion
- Deletes the record
- Queries again to confirm it's gone

**Key verification:**

```typescript
const beforeDelete = await testPrisma.serviceLog.findUnique({ where: { id } });
expect(beforeDelete).not.toBeNull(); // Exists

await testPrisma.serviceLog.delete({ where: { id } });

const afterDelete = await testPrisma.serviceLog.findUnique({ where: { id } });
expect(afterDelete).toBeNull(); // Gone
```

---

### Bonus Test: Complete Lifecycle

**What it does:**

- Demonstrates a realistic workflow
- Creates 5 transaction records
- Analyzes data (calculates average processing time)
- Updates 3 records to "completed" status
- Deletes completed records
- Verifies final state (2 records remain)

**Why it matters:**
Shows how CRUD operations work together in a real application workflow.

---

## Key Differences from Mock Tests

### Mock Tests (500+ tests)

```typescript
// Hardcoded expectations
expect(result).toBe(true);
expect(response.status).toBe(200);
// No actual database interaction
```

### CRUD Demo Tests

```typescript
// Real database operations
const created = await prisma.serviceLog.create({ data });
const verified = await prisma.serviceLog.findUnique({
  where: { id: created.id },
});

// Verify actual database state
expect(verified?.id).toBe(created.id);
expect(verified?.message).toBe(data.message);
```

---

## Architecture

### Uses Same Infrastructure

The CRUD test uses the **same containers and schemas** as the 500+ test suite:

1. **Shares infrastructure** via `getInfrastructure()`
2. **Randomly selects** an auth schema
3. **Creates Prisma client** connected to that schema
4. **Performs real operations** on PostgreSQL

### Schema Used

```typescript
testSchema = {
  schemaName: "auth_prod-us-east_instance2",
  connectionString: "postgresql://test:test@localhost:55432/testdb",
  service: "auth",
  region: "us-east",
  instance: 2,
};
```

### Database Model

Uses the `ServiceLog` Prisma model:

```prisma
model ServiceLog {
  id             Int      @id @default(autoincrement())
  serviceName    String
  logLevel       String
  message        String
  timestamp      DateTime @default(now())
  instanceId     String
  environment    String
  processingTime Int?
}
```

---

## Expected Results

### Test Summary

```
Test Files  1 passed (1)
     Tests  5 passed (5)
  Duration  15-20s
```

### Coverage

- ✅ **INSERT**: 1 test (plus bonus)
- ✅ **SELECT**: 1 test (plus bonus)
- ✅ **UPDATE**: 1 test (plus bonus)
- ✅ **DELETE**: 1 test (plus bonus)
- ✅ **Lifecycle**: 1 comprehensive test

**Total: 5 tests** demonstrating all CRUD operations with real data

---

## Debugging

### View Database State

The test uses a random schema. To see which one, check the log:

```bash
cat logs/database-crud-demo.log | grep "Selected test schema"
```

### Connect to Database

```bash
# Find the schema from logs
Selected test schema: auth_prod-us-east_instance2

# Connect with psql
docker exec -it <container-id> psql -U test -d testdb

# Query the schema
\c testdb
SET search_path TO auth_prod-us-east_instance2;
SELECT * FROM "ServiceLog";
```

### Troubleshooting

| Issue                  | Solution                                            |
| ---------------------- | --------------------------------------------------- |
| "Container not found"  | Run `docker ps` to verify containers are running    |
| "Schema doesn't exist" | Infrastructure needs initialization - run full test |
| "Connection failed"    | Check Docker is running and has network access      |
| "Timeout"              | Increase timeout in beforeAll (currently 5 min)     |

---

## Running with Main Test Suite

You can run this alongside the main orchestrator:

```bash
# Run both tests
npx vitest run src/__tests__/ultimateProductionDemo.test.ts src/__tests__/databaseCRUDOperations.test.ts

# Or run all tests
npx vitest run src/__tests/
```

**Note:** Infrastructure is shared via singleton pattern, so it's created once and used by both.

---

## Production Use Cases

This pattern demonstrates:

1. **Integration Testing** - Real database interactions
2. **Data Verification** - Ensuring data integrity
3. **State Management** - Testing complex workflows
4. **Migration Validation** - Verifying schema changes work

---

## Next Steps

### Extend the Tests

You can add more tests for:

- **Transactions** - Using `prisma.$transaction()`
- **Bulk Operations** - `createMany()`, `updateMany()`, `deleteMany()`
- **Relations** - Testing foreign key relationships
- **Constraints** - Testing unique constraints, validations
- **Performance** - Measuring query execution time

### Use Other Models

Try the other Prisma models:

```typescript
// Metric model
await testPrisma.metric.create({ data: {...} });

// Transaction model
await testPrisma.transaction.create({ data: {...} });
```

---

## Summary

✅ **Real database CRUD operations** (not mocks)  
✅ **Actual data verification** (queries confirm state)  
✅ **Comprehensive logging** (see every step)  
✅ **Production-like workflow** (realistic scenarios)  
✅ **Reuses infrastructure** (same containers as 500+ tests)  
✅ **Easy to run** (one command)

**This is what people want to see!** 🚀
