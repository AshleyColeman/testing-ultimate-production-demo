# 🔧 Troubleshooting Guide

## 📋 Table of Contents

1. [Setup Issues](#setup-issues)
2. [Container Issues](#container-issues)
3. [Schema Issues](#schema-issues)
4. [Test Execution Issues](#test-execution-issues)
5. [Performance Issues](#performance-issues)
6. [Error Messages Dictionary](#error-messages-dictionary)
7. [Debugging Techniques](#debugging-techniques)

---

## 🚨 Setup Issues

### Issue: "Docker connection refused"

**Error:**

```
Error: connect ECONNREFUSED /var/run/docker.sock
```

**Cause:** Docker daemon is not running

**Solutions:**

1. Start Docker Desktop
2. Verify Docker is running:
   ```powershell
   docker ps
   ```
3. Check Docker socket permissions (Linux/Mac)
4. Restart Docker service

---

### Issue: "Timeout waiting for infrastructure file"

**Error:**

```
❌ Timeout waiting for infrastructure file from globalSetup.
Expected file: C:\...\tests\.vitest-infra.json
```

**Cause:** globalSetup didn't complete or file wasn't created

**Solutions:**

1. **Check globalSetup configuration:**

   ```typescript
   // vitest.config.ts
   globalSetup: ["./tests/globalSetup.ts"], // ✓ Correct path?
   ```

2. **Check for errors in globalSetup:**

   ```powershell
   # Run tests with verbose output
   npm test -- --reporter=verbose
   ```

3. **Verify file path:**

   ```typescript
   // tests/setupFile.ts
   const infraFilePath = path.join(__dirname, ".vitest-infra.json");
   console.log("Looking for:", infraFilePath);
   ```

4. **Manually check if file exists:**
   ```powershell
   dir tests\.vitest-infra.json
   ```

---

### Issue: "Module not found: @prisma/client"

**Error:**

```
Cannot find module '@prisma/client'
```

**Cause:** Prisma client not generated

**Solutions:**

```powershell
# Generate Prisma client
npx prisma generate

# Verify generation
dir node_modules\.prisma\client
```

---

### Issue: "TypeScript compilation errors"

**Error:**

```
TS2307: Cannot find module '../../../tests/schemaAllocator'
```

**Solutions:**

1. **Check tsconfig.json includes tests:**

   ```json
   {
     "include": [
       "src/**/*",
       "tests/**/*" // ← Make sure this is included
     ]
   }
   ```

2. **Verify file paths:**

   ```typescript
   // Correct import based on your structure
   import { createSchemaAllocator } from "../../../tests/schemaAllocator";
   ```

3. **Check TypeScript types:**
   ```json
   {
     "compilerOptions": {
       "types": ["vitest/globals", "node"]
     }
   }
   ```

---

## 🐳 Container Issues

### Issue: "Port already in use"

**Error:**

```
Error: Port 5432 is already allocated
```

**Cause:** PostgreSQL container from previous run still active

**Solutions:**

1. **Stop all containers:**

   ```powershell
   docker stop $(docker ps -aq)
   ```

2. **Remove stopped containers:**

   ```powershell
   docker rm $(docker ps -aq)
   ```

3. **Check for orphaned containers:**

   ```powershell
   docker ps -a | Select-String "postgres"
   ```

4. **Use dynamic ports (recommended):**
   ```typescript
   // Testcontainers automatically uses random ports
   // No changes needed in ContainerManager
   ```

---

### Issue: "Container failed to start"

**Error:**

```
Error: Container did not start within timeout
```

**Solutions:**

1. **Check Docker resources:**

   - Docker Desktop → Settings → Resources
   - Increase memory to at least 4GB
   - Increase CPU to at least 2 cores

2. **Check Docker logs:**

   ```powershell
   docker logs <container_id>
   ```

3. **Verify Docker image:**

   ```powershell
   docker pull postgres:16
   ```

4. **Increase timeout in ContainerManager:**
   ```typescript
   await container.startContainer({ timeout: 120000 }); // 2 minutes
   ```

---

### Issue: "Too many containers"

**Error:**

```
Error: Docker daemon out of memory
```

**Cause:** Creating 12 containers exceeds available resources

**Solutions:**

1. **Reduce container count:**

   ```typescript
   // src/__tests__/shared/testInfrastructure.ts
   export const CONTAINER_COUNT = 6; // Was 12
   ```

2. **Increase SCHEMAS_PER_CONTAINER:**

   ```typescript
   export const SCHEMAS_PER_CONTAINER = 16; // Was 8
   // Maintains same total schemas with fewer containers
   ```

3. **Clean up Docker resources:**
   ```powershell
   docker system prune -a
   ```

---

## 🗄️ Schema Issues

### Issue: "SCHEMA EXHAUSTION"

**Error:**

```
❌ SCHEMA EXHAUSTION: Service 'users' has exhausted write schemas!
   Available write schemas: 7
   Write test attempting to run: 8
```

**Cause:** More write tests than available write schemas

**Solutions:**

1. **Option 1: Increase schemas per container**

   ```typescript
   // src/__tests__/shared/testInfrastructure.ts
   export const SCHEMAS_PER_CONTAINER = 16; // Was 8
   // Now each service has 15 write schemas (1 read + 15 write)
   ```

2. **Option 2: Split test file**

   ```typescript
   // Original: user-tests.test.ts (10 write tests) ❌

   // Split into:
   // user-crud.test.ts (5 write tests) ✓
   // user-validation.test.ts (5 write tests) ✓
   ```

3. **Option 3: Convert reads to useReadSchema**
   ```typescript
   // Review your tests - are some writes actually reads?
   it("gets user count", useReadSchema(/* ... */)); // ✓ Changed from useWriteSchema
   ```

**Prevention:**
Calculate schema needs before writing tests:

- **1 READ schema** (shared by all read tests)
- **N WRITE schemas** (one per write test)
- **Max write tests per file:** `SCHEMAS_PER_CONTAINER - 1`

---

### Issue: "No schemas found for service"

**Error:**

```
❌ No schemas found for service 'custom-service'.
Available services: auth, users, payment, ...
```

**Cause:** Service name doesn't match SERVICES array

**Solutions:**

1. **Check service name spelling:**

   ```typescript
   const { useReadSchema, useWriteSchema, cleanup } =
     createSchemaAllocator("users");
   //                                                                         ^^^^^^
   // Must match exactly (case-sensitive)
   ```

2. **Add service to SERVICES array:**

   ```typescript
   // src/__tests__/shared/testInfrastructure.ts
   export const SERVICES = [
     "auth",
     "users",
     "payment",
     "custom-service", // ← Add your service here
     // ...
   ];
   ```

3. **Check available services:**
   ```typescript
   import { getAvailableServices } from "../../../tests/schemaAllocator";
   console.log("Available:", getAvailableServices());
   ```

---

### Issue: "Schema does not exist"

**Error:**

```
error: schema "test_auth_prod-us-east_schema1" does not exist
```

**Cause:** Schema wasn't created or connection to wrong container

**Solutions:**

1. **Verify schema creation in globalSetup:**

   ```typescript
   // Should see in logs:
   // ✅ Infrastructure ready: 12 containers, 96 schemas
   ```

2. **Check schema creation loop:**

   ```typescript
   // src/__tests__/shared/testInfrastructure.ts
   // In initializeInfrastructure(), verify:
   await prisma.$executeRawUnsafe(`CREATE SCHEMA "${schemaName}"`);
   ```

3. **List schemas in container:**

   ```powershell
   # Get container ID
   docker ps | Select-String "postgres"

   # Connect to container
   docker exec -it <container_id> psql -U test_user_1 -d test_auth_prod-us-east

   # List schemas
   \dn
   ```

---

## 🧪 Test Execution Issues

### Issue: "Database infrastructure not initialized"

**Error:**

```
❌ Database infrastructure not initialized!
This should be set by setupFile.ts before tests run.
```

**Cause:** setupFile.ts didn't run or global variable not set

**Solutions:**

1. **Verify setupFiles configuration:**

   ```typescript
   // vitest.config.ts
   setupFiles: ["./tests/setupFile.ts"], // ✓ Correct path?
   ```

2. **Check setupFile.ts execution:**

   ```typescript
   // Add logging
   beforeAll(async () => {
     console.log("setupFile.ts running in worker:", process.pid);
     // ... rest of code
   }, 300000);
   ```

3. **Increase timeout:**
   ```typescript
   // tests/setupFile.ts
   beforeAll(async () => {
     // ...
   }, 600000); // Increase to 10 minutes
   ```

---

### Issue: "Tests timing out"

**Error:**

```
Test timed out in 300000ms
```

**Cause:** Container/schema creation slower than expected

**Solutions:**

1. **Increase timeout in vitest.config.ts:**

   ```typescript
   export default defineConfig({
     test: {
       testTimeout: 600000, // 10 minutes
       hookTimeout: 600000, // 10 minutes
     },
   });
   ```

2. **Check container performance:**

   ```powershell
   # Monitor Docker stats
   docker stats
   ```

3. **Optimize container creation:**
   ```typescript
   // Create containers with more parallelism
   const containerPromises = Array.from({ length: CONTAINER_COUNT }, ...);
   await Promise.all(containerPromises); // ✓ Already parallel
   ```

---

### Issue: "Memory leak warnings"

**Error:**

```
Warning: Possible EventEmitter memory leak detected
```

**Cause:** Prisma clients not disconnected

**Solutions:**

1. **Add cleanup hook (MANDATORY):**

   ```typescript
   describe("My Tests", () => {
     const { useReadSchema, useWriteSchema, cleanup } =
       createSchemaAllocator("users");

     // ... tests ...

     afterAll(async () => {
       await cleanup(); // ✓ Must call this!
     });
   });
   ```

2. **Verify cleanup is called:**

   ```typescript
   // Check logs for:
   // 🧹 Cleaning up schema allocator for service 'users'...
   // ✅ Disconnected READ client (test_users_...)
   // ✅ Disconnected WRITE client 1 (test_users_...)
   ```

3. **Check for multiple allocators:**

   ```typescript
   // ❌ BAD - Creating allocator multiple times
   describe("Tests", () => {
     it("test 1", () => {
       const { useReadSchema } = createSchemaAllocator("users"); // ⚠️ Creates new allocator
     });
   });

   // ✅ GOOD - Create once, reuse
   describe("Tests", () => {
     const { useReadSchema, cleanup } = createSchemaAllocator("users");
     it("test 1", useReadSchema(/* ... */));
     afterAll(async () => await cleanup());
   });
   ```

---

### Issue: "Tests pass locally but fail in CI"

**Cause:** Timing differences, resource constraints, or environment issues

**Solutions:**

1. **Increase timeouts for CI:**

   ```typescript
   // vitest.config.ts
   export default defineConfig({
     test: {
       testTimeout: process.env.CI ? 900000 : 300000, // 15 min in CI
       hookTimeout: process.env.CI ? 900000 : 300000,
     },
   });
   ```

2. **Ensure Docker available in CI:**

   ```yaml
   # .github/workflows/test.yml
   jobs:
     test:
       runs-on: ubuntu-latest
       services:
         docker:
           image: docker:dind
           options: --privileged
   ```

3. **Check CI resource limits:**
   - Increase CI machine size
   - Reduce CONTAINER_COUNT for CI
   - Use cached Docker images

---

## ⚡ Performance Issues

### Issue: "Tests are slow"

**Problem:** Test suite takes too long to run

**Solutions:**

1. **Verify parallel execution:**

   ```typescript
   // vitest.config.ts
   poolOptions: {
     forks: {
       singleFork: false,  // ✓ Must be false
       maxForks: 6,        // ✓ Adjust based on CPU
     },
   },
   ```

2. **Optimize container creation:**

   ```typescript
   // Use container reuse (experimental)
   const container = new ContainerManager({
     reuse: true, // Reuse containers between runs
   });
   ```

3. **Reduce schema count if not needed:**

   ```typescript
   export const SCHEMAS_PER_CONTAINER = 4; // Faster startup
   ```

4. **Profile slow tests:**
   ```powershell
   npm test -- --reporter=verbose --timeout=60000
   ```

---

### Issue: "High memory usage"

**Problem:** System running out of memory

**Solutions:**

1. **Reduce parallel workers:**

   ```typescript
   // vitest.config.ts
   poolOptions: {
     forks: {
       maxForks: 3, // Reduce from 6
     },
   },
   ```

2. **Ensure cleanup hooks:**

   ```typescript
   // Every test file must have:
   afterAll(async () => {
     await cleanup();
   });
   ```

3. **Monitor memory:**

   ```powershell
   # Watch memory during tests
   Get-Process node | Select-Object CPU,Memory
   ```

4. **Check Docker memory:**
   ```powershell
   docker stats
   ```

---

## 📖 Error Messages Dictionary

### Infrastructure Errors

| Error                            | Meaning                   | Solution                       |
| -------------------------------- | ------------------------- | ------------------------------ |
| `Docker connection refused`      | Docker not running        | Start Docker Desktop           |
| `Port already in use`            | Old containers running    | `docker stop $(docker ps -aq)` |
| `Container did not start`        | Container startup failed  | Check Docker resources         |
| `Timeout waiting for infra file` | globalSetup didn't finish | Check globalSetup logs         |

### Schema Errors

| Error                                     | Meaning                 | Solution                                     |
| ----------------------------------------- | ----------------------- | -------------------------------------------- |
| `SCHEMA EXHAUSTION`                       | Too many write tests    | Increase SCHEMAS_PER_CONTAINER or split file |
| `No schemas found for service`            | Service name mismatch   | Check SERVICES array                         |
| `Schema does not exist`                   | Schema not created      | Verify globalSetup completed                 |
| `Database infrastructure not initialized` | setupFile.ts didn't run | Check setupFiles config                      |

### Test Errors

| Error                               | Meaning               | Solution                        |
| ----------------------------------- | --------------------- | ------------------------------- |
| `Test timed out`                    | Test took too long    | Increase testTimeout            |
| `Memory leak detected`              | Missing cleanup       | Add afterAll cleanup hook       |
| `Cannot read property of undefined` | Schema not allocated  | Verify allocator initialization |
| `Connection terminated`             | Database disconnected | Check container health          |

---

## 🔍 Debugging Techniques

### 1. Enable Verbose Logging

```typescript
// tests/schemaAllocator.ts
// All key operations already have console.log statements

// tests/globalSetup.ts
console.log("🌍 GLOBAL SETUP - INITIALIZING INFRASTRUCTURE");

// tests/setupFile.ts
console.log(`✅ Worker ${process.pid} ready`);
```

### 2. Add Custom Logging

```typescript
it(
  "my test",
  useWriteSchema(async ({ db, schema, schemaName }) => {
    console.log("TEST START:", schemaName);

    // Your test code

    console.log("TEST END:", schemaName);
  })
);
```

### 3. Inspect Infrastructure

```typescript
// In any test file:
it(
  "debug infrastructure",
  useReadSchema(async () => {
    console.log("Global infra:", global.__DB_INFRA__);
    console.log("Available services:", getAvailableServices());
    console.log("Schema count for users:", getSchemaCount("users"));
  })
);
```

### 4. Check Schema Allocation

```typescript
const { useReadSchema, useWriteSchema, cleanup } =
  createSchemaAllocator("users");
// Look for logs:
// 🎯 Schema Allocation for Service: 'users'
// 📖 READ Schema (Shared): test_users_prod-us-east_schema1
// ✏️  WRITE Schemas (7 available):
//    1. test_users_prod-us-east_schema2
//    ...
```

### 5. Test Prisma Connection

```typescript
it(
  "test connection",
  useReadSchema(async ({ db }) => {
    const result = await db.$queryRaw`SELECT 1 as test`;
    console.log("Connection test:", result);
  })
);
```

### 6. List All Schemas

```powershell
# Connect to a container
docker exec -it <container_id> psql -U test_user_1 -d test_db

# List schemas
\dn

# List tables in a schema
\dt "test_users_prod-us-east_schema1".*
```

### 7. Monitor Test Execution

```powershell
# Run with verbose reporter
npm test -- --reporter=verbose

# Run specific test file
npx vitest run src/__tests__/microservices/example.test.ts --reporter=verbose

# Watch mode for debugging
npm test -- --watch
```

### 8. Check File Generation

```powershell
# Verify .vitest-infra.json created
dir tests\.vitest-infra.json

# View contents
Get-Content tests\.vitest-infra.json | ConvertFrom-Json | Format-List
```

### 9. Profile Performance

```typescript
it(
  "profile test",
  useWriteSchema(async ({ db, schemaName }) => {
    const start = Date.now();

    // Your operations
    await db.$executeRawUnsafe(`...`);

    const elapsed = Date.now() - start;
    console.log(`Test took ${elapsed}ms`);
  })
);
```

### 10. Isolate Problem

```typescript
// Comment out tests to isolate which one fails
describe("My Tests", () => {
  const { useWriteSchema, cleanup } = createSchemaAllocator("users");

  it.skip("test 1", useWriteSchema(/* ... */)); // Skip this
  it("test 2", useWriteSchema(/* ... */)); // Run this
  it.skip("test 3", useWriteSchema(/* ... */)); // Skip this

  afterAll(async () => await cleanup());
});
```

---

## 🆘 Getting Help

### Self-Diagnosis Checklist

Run through this before asking for help:

- [ ] Docker Desktop is running: `docker ps`
- [ ] Prisma client generated: `npx prisma generate`
- [ ] TypeScript compiles: `npx tsc --noEmit`
- [ ] globalSetup configured correctly in vitest.config.ts
- [ ] setupFiles configured correctly in vitest.config.ts
- [ ] Service name matches SERVICES array
- [ ] cleanup() called in afterAll hook
- [ ] Schema-qualified queries: `"${schemaName}".table`
- [ ] Not exceeding available write schemas per file
- [ ] Tests self-contained (no shared state)

### Collecting Debug Information

```powershell
# Collect system info
node --version
npm --version
docker --version

# Check Docker containers
docker ps -a

# Check disk space
Get-PSDrive C

# Check available memory
Get-WmiObject Win32_OperatingSystem | Select-Object TotalVisibleMemorySize,FreePhysicalMemory

# Run tests with full output
npm test -- --reporter=verbose > test-output.log 2>&1
```

---

## 🔜 Next Steps

If you're experiencing issues migrating from another testing setup:

### → **[06_MIGRATION_GUIDE.md](06_MIGRATION_GUIDE.md)**

Learn how to migrate existing tests to this parallel schema pattern.

---

**Previous:** [04_WRITING_TESTS.md](04_WRITING_TESTS.md) | **Next:** [06_MIGRATION_GUIDE.md](06_MIGRATION_GUIDE.md)
