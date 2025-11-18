# 📦 Installation Guide - Setting Up Vitest Parallel Testing

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Step-by-Step Installation](#step-by-step-installation)
3. [Directory Structure](#directory-structure)
4. [Installing Dependencies](#installing-dependencies)
5. [Creating Configuration Files](#creating-configuration-files)
6. [Creating Core Files](#creating-core-files)
7. [Creating Utility Files](#creating-utility-files)
8. [First Test File](#first-test-file)
9. [Running Tests](#running-tests)
10. [Verification](#verification)

---

## ✅ Prerequisites

Before starting, ensure you have:

### Required Software

- **Node.js** 18.0.0 or higher
- **npm** or **yarn** or **pnpm**
- **Docker Desktop** installed and running
  - Docker daemon must be active
  - Testcontainers requires Docker access

### Required Knowledge

- Basic TypeScript/JavaScript
- Basic understanding of PostgreSQL
- Familiarity with testing concepts
- Basic Docker knowledge (helpful but not required)

### System Requirements

- **RAM:** Minimum 8GB (16GB recommended)
- **Disk Space:** 5GB free for Docker images
- **OS:** Windows, macOS, or Linux

---

## 🚀 Step-by-Step Installation

### Step 1: Create or Navigate to Your Project

```powershell
# Create new project
mkdir my-parallel-tests
cd my-parallel-tests

# OR navigate to existing project
cd path\to\your\project
```

### Step 2: Initialize Node.js Project (if new)

```powershell
# Initialize package.json
npm init -y

# OR with specific settings
npm init
```

### Step 3: Initialize TypeScript (if new)

```powershell
# Install TypeScript
npm install --save-dev typescript @types/node

# Create tsconfig.json
npx tsc --init
```

---

## 📁 Directory Structure

Create the following directory structure:

```
your-project/
├── package.json
├── tsconfig.json
├── vitest.config.ts                    # ← Create this
├── tests/                              # ← Create this folder
│   ├── globalSetup.ts                  # ← Create this
│   ├── setupFile.ts                    # ← Create this
│   └── schemaAllocator.ts              # ← Create this
├── src/
│   ├── __tests__/
│   │   ├── shared/
│   │   │   ├── testInfrastructure.ts   # ← Create this
│   │   │   └── testHelpers.ts          # ← Create this (optional)
│   │   └── microservices/
│   │       └── example.test.ts         # ← Your test files go here
│   └── utils/
│       ├── ContainerManager.ts         # ← Create this
│       ├── Logger.ts                   # ← Create this
│       ├── LRUCache.ts                 # ← Create this
│       ├── MemoryManager.ts            # ← Create this
│       └── MemoryMonitor.ts            # ← Create this
├── prisma/
│   └── schema.prisma                   # ← Create this
└── logs/                               # ← Auto-created
    └── combined.log
```

### Create Directories

```powershell
# Create all directories at once
mkdir tests
mkdir src\__tests__\shared
mkdir src\__tests__\microservices
mkdir src\utils
mkdir prisma
mkdir logs
```

---

## 📦 Installing Dependencies

### Core Dependencies

```powershell
# Testing framework
npm install --save-dev vitest @vitest/ui

# Database & ORM
npm install @prisma/client
npm install --save-dev prisma

# Testcontainers
npm install --save-dev testcontainers

# PostgreSQL driver
npm install pg
npm install --save-dev @types/pg

# Utilities
npm install uuid winston dotenv
npm install --save-dev @types/uuid
```

### TypeScript & Build Tools

```powershell
npm install --save-dev typescript tsx @types/node
```

### Verification

```powershell
# Check installations
npm list vitest
npm list testcontainers
npm list @prisma/client
npm list prisma
```

Your `package.json` should now include:

```json
{
  "dependencies": {
    "@prisma/client": "^5.11.0",
    "dotenv": "^16.3.1",
    "pg": "^8.11.3",
    "prisma": "^5.11.0",
    "testcontainers": "^10.7.0",
    "uuid": "^9.0.1",
    "winston": "^3.11.0"
  },
  "devDependencies": {
    "@types/node": "^20.11.0",
    "@types/pg": "^8.10.9",
    "@types/uuid": "^9.0.7",
    "@vitest/ui": "^3.2.4",
    "tsx": "^4.7.0",
    "typescript": "^5.3.3",
    "vitest": "^3.2.4"
  }
}
```

---

## ⚙️ Creating Configuration Files

### 1. TypeScript Configuration (`tsconfig.json`)

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "lib": ["ES2022"],
    "moduleResolution": "node",
    "esModuleInterop": true,
    "skipLibCheck": true,
    "strict": true,
    "resolveJsonModule": true,
    "declaration": true,
    "outDir": "./dist",
    "rootDir": "./",
    "baseUrl": "./",
    "paths": {
      "@/*": ["./src/*"],
      "@/prisma/client": ["./node_modules/.prisma/client"]
    },
    "types": ["vitest/globals", "node"]
  },
  "include": ["src/**/*", "tests/**/*", "vitest.config.ts"],
  "exclude": ["node_modules", "dist"]
}
```

### 2. Vitest Configuration (`vitest.config.ts`)

```typescript
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    testTimeout: 300000, // 5 minutes per test
    hookTimeout: 300000, // 5 minutes for hooks
    teardownTimeout: 120000, // 2 minutes for teardown
    isolate: false,
    pool: "forks", // Use fork pool for parallel execution
    poolOptions: {
      forks: {
        singleFork: false, // Allow parallel execution
        minForks: 1,
        maxForks: 6, // Run up to 6 test files in parallel
      },
    },
    // Global setup - runs ONCE across all workers
    globalSetup: ["./tests/globalSetup.ts"],
    // Setup file - runs in each worker thread
    setupFiles: ["./tests/setupFile.ts"],
    include: ["src/**/*.test.ts", "src/**/*.spec.ts"],
    exclude: ["node_modules", "dist", ".git"],
    reporters: ["verbose"],
    sequence: {
      setupFiles: "list",
      hooks: "list",
      concurrent: false, // Keep deterministic for schema allocation
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@/prisma/client": path.resolve(
        __dirname,
        "./node_modules/.prisma/client"
      ),
    },
  },
});
```

### 3. Prisma Schema (`prisma/schema.prisma`)

```prisma
// This is a minimal schema for the testing infrastructure
// You can add your actual models here

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Example model (optional - testcontainers creates schemas dynamically)
model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  name      String
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("user")
}
```

### 4. Environment Variables (`.env`)

```env
# This is used by Prisma for local development
# Testcontainers creates its own databases dynamically
DATABASE_URL="postgresql://postgres:password@localhost:5432/mydb?schema=public"
```

### 5. Add Scripts to `package.json`

```json
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run",
    "test:ui": "vitest --ui",
    "prisma:generate": "prisma generate",
    "build": "tsc",
    "dev": "tsx watch src/index.ts"
  }
}
```

### 6. Generate Prisma Client

```powershell
npx prisma generate
```

---

## 🔧 Creating Core Files

### 1. Global Setup (`tests/globalSetup.ts`)

**Purpose:** Runs once before all tests to create containers and schemas.

**Location:** `tests/globalSetup.ts`

**Content:** [See full file in 03_CONFIGURATION_FILES.md](03_CONFIGURATION_FILES.md#globalsetupts)

**Key Points:**

- Imports `initializeInfrastructure()` from testInfrastructure
- Creates all 12 containers and 96 schemas
- Writes metadata to `.vitest-infra.json`
- Returns teardown function

**Quick Version:**

```typescript
import {
  initializeInfrastructure,
  cleanupInfrastructure,
  getInfrastructure,
  CONTAINER_COUNT,
  TOTAL_SCHEMAS,
} from "../src/__tests__/shared/testInfrastructure";

export interface SchemaMeta {
  id: number;
  service: string;
  environment: string;
  schemaName: string;
  connectionUri: string;
  containerIndex: number;
}

export interface SerializableInfra {
  schemas: SchemaMeta[];
  containerCount: number;
  totalSchemas: number;
}

declare global {
  var __DB_INFRA__: SerializableInfra | undefined;
}

export default async function setup() {
  console.log("\n🌍 GLOBAL SETUP - INITIALIZING INFRASTRUCTURE\n");

  const startTime = Date.now();
  await initializeInfrastructure();
  const infra = await getInfrastructure();

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

  const fs = await import("fs/promises");
  const path = await import("path");
  const infraFilePath = path.join(__dirname, ".vitest-infra.json");
  await fs.writeFile(infraFilePath, JSON.stringify(serializableInfra, null, 2));

  global.__DB_INFRA__ = serializableInfra;

  const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`✅ GLOBAL SETUP COMPLETE! Time: ${elapsedTime}s\n`);

  return async () => {
    console.log("\n🧹 GLOBAL TEARDOWN - CLEANING UP\n");
    await cleanupInfrastructure();
  };
}
```

---

### 2. Setup File (`tests/setupFile.ts`)

**Purpose:** Runs in each worker thread to load infrastructure metadata.

**Location:** `tests/setupFile.ts`

**Content:** [See full file in 03_CONFIGURATION_FILES.md](03_CONFIGURATION_FILES.md#setupfilets)

**Quick Version:**

```typescript
import { beforeAll } from "vitest";

export interface SchemaMeta {
  id: number;
  service: string;
  environment: string;
  schemaName: string;
  connectionUri: string;
  containerIndex: number;
}

export interface SerializableInfra {
  schemas: SchemaMeta[];
  containerCount: number;
  totalSchemas: number;
}

declare global {
  var __DB_INFRA__: SerializableInfra | undefined;
  var __DB_INFRA_INITIALIZED__: boolean | undefined;
}

beforeAll(async () => {
  if (global.__DB_INFRA_INITIALIZED__) {
    return;
  }

  const fs = await import("fs/promises");
  const path = await import("path");
  const infraFilePath = path.join(__dirname, ".vitest-infra.json");

  const maxWait = 60000; // 60 seconds
  const startTime = Date.now();

  while (true) {
    try {
      const data = await fs.readFile(infraFilePath, "utf-8");
      const serializableInfra = JSON.parse(data);

      global.__DB_INFRA__ = serializableInfra;
      global.__DB_INFRA_INITIALIZED__ = true;

      console.log(`\n✅ Worker ${process.pid} ready\n`);
      break;
    } catch (err) {
      if (Date.now() - startTime > maxWait) {
        throw new Error(
          `❌ Timeout waiting for infrastructure file.\n` +
            `Expected file: ${infraFilePath}`
        );
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }
}, 300000);
```

---

### 3. Schema Allocator (`tests/schemaAllocator.ts`)

**Purpose:** Allocates READ and WRITE schemas to tests in each file.

**Location:** `tests/schemaAllocator.ts`

**Content:** [See full file in 03_CONFIGURATION_FILES.md](03_CONFIGURATION_FILES.md#schemaallocatorts)

**This is a LONG file** (~400 lines). **Copy from the current POC project:**

```powershell
# Copy from this POC project
copy c:\Users\Ashley\source\repos\testing-ultimate-production-demo\tests\schemaAllocator.ts .\tests\
```

Or reference the detailed version in Configuration Files guide.

---

### 4. Test Infrastructure (`src/__tests__/shared/testInfrastructure.ts`)

**Purpose:** Creates containers and schemas, manages infrastructure lifecycle.

**Location:** `src/__tests__/shared/testInfrastructure.ts`

**This is a LONG file** (~400 lines). **Copy from the current POC project:**

```powershell
# Copy from this POC project
copy "c:\Users\Ashley\source\repos\testing-ultimate-production-demo\src\__tests__\shared\testInfrastructure.ts" ".\src\__tests__\shared\"
```

Or reference the detailed version in Configuration Files guide.

**Key Configuration Constants:**

```typescript
export const MAX_WORKER_THREADS = 6;
export const CONTAINERS_PER_THREAD = 2;
export const CONTAINER_COUNT = 12;
export const SCHEMAS_PER_CONTAINER = 8;
export const TOTAL_SCHEMAS = 96;

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
```

---

## 🛠️ Creating Utility Files

### 1. Container Manager (`src/utils/ContainerManager.ts`)

**Purpose:** Manages PostgreSQL testcontainers lifecycle.

**Copy from POC:**

```powershell
copy "c:\Users\Ashley\source\repos\testing-ultimate-production-demo\src\utils\ContainerManager.ts" ".\src\utils\"
```

**Key Features:**

- Starts/stops PostgreSQL containers
- Manages connection URIs
- Handles container reuse
- Provides database credentials

---

### 2. Logger (`src/utils/Logger.ts`)

**Purpose:** Centralized logging for infrastructure and tests.

**Copy from POC:**

```powershell
copy "c:\Users\Ashley\source\repos\testing-ultimate-production-demo\src\utils\Logger.ts" ".\src\utils\"
```

---

### 3. LRU Cache (`src/utils/LRUCache.ts`)

**Purpose:** Cache Prisma clients with automatic eviction.

**Copy from POC:**

```powershell
copy "c:\Users\Ashley\source\repos\testing-ultimate-production-demo\src\utils\LRUCache.ts" ".\src\utils\"
```

---

### 4. Memory Manager (`src/utils/MemoryManager.ts`)

**Purpose:** Tracks memory usage across components.

**Copy from POC:**

```powershell
copy "c:\Users\Ashley\source\repos\testing-ultimate-production-demo\src\utils\MemoryManager.ts" ".\src\utils\"
```

---

### 5. Memory Monitor (`src/utils/MemoryMonitor.ts`)

**Purpose:** Monitors memory during test execution.

**Copy from POC:**

```powershell
copy "c:\Users\Ashley\source\repos\testing-ultimate-production-demo\src\utils\MemoryMonitor.ts" ".\src\utils\"
```

---

### 6. Test Helpers (Optional) (`src/__tests__/shared/testHelpers.ts`)

**Purpose:** Shared utilities for tests.

```typescript
export function simulateProductionOperation(): Promise<number> {
  return new Promise((resolve) => {
    const delay = Math.random() * 100 + 50;
    setTimeout(() => resolve(delay), delay);
  });
}

export function generateTestData(type: string): any {
  return {
    id: Math.floor(Math.random() * 10000),
    type,
    timestamp: new Date().toISOString(),
    data: { random: Math.random() },
  };
}

export function formatTestName(name: string): string {
  return `🧪 ${name}`;
}
```

---

## 📝 First Test File

### Create Example Test

**Location:** `src/__tests__/microservices/example.test.ts`

```typescript
import { describe, expect, it, afterAll } from "vitest";
import { createSchemaAllocator } from "../../../tests/schemaAllocator";

// Create schema allocator for 'auth' service
const { useReadSchema, useWriteSchema, cleanup } =
  createSchemaAllocator("auth");

describe("Example Test Suite", () => {
  // READ test - shares schema with other reads
  it(
    "should read data (READ - shared schema)",
    useReadSchema(async ({ db, schema, schemaName }) => {
      console.log(`📖 READ: Using schema: ${schemaName}`);

      // Query existing data
      const result = await db.$queryRawUnsafe(
        `SELECT * FROM "${schemaName}".test_data LIMIT 5`
      );

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);

      console.log(`✅ READ completed on schema: ${schemaName}`);
    })
  );

  // WRITE test - gets unique schema
  it(
    "should create data (WRITE - unique schema)",
    useWriteSchema(async ({ db, schema, schemaName }) => {
      console.log(`✏️  WRITE: Using schema: ${schemaName}`);

      // Insert test data
      await db.$executeRawUnsafe(`
        INSERT INTO "${schemaName}".test_data 
        (test_type, test_name, test_result, execution_time_ms)
        VALUES ('example', 'first-test', 'PASS', 100)
      `);

      // Verify insertion
      const result = await db.$queryRawUnsafe(
        `SELECT * FROM "${schemaName}".test_data WHERE test_type = 'example'`
      );

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect((result as any[]).length).toBeGreaterThan(0);

      console.log(`✅ WRITE completed on schema: ${schemaName}`);
    })
  );

  // Cleanup hook - MANDATORY
  afterAll(async () => {
    await cleanup();
  });
});
```

---

## ▶️ Running Tests

### 1. Ensure Docker is Running

```powershell
# Check Docker status
docker ps

# If not running, start Docker Desktop
```

### 2. Generate Prisma Client

```powershell
npx prisma generate
```

### 3. Run Tests

```powershell
# Run all tests
npm test

# Run tests once (no watch mode)
npm run test:run

# Run with UI
npm run test:ui

# Run specific file
npx vitest run src/__tests__/microservices/example.test.ts
```

### 4. Expected Output

```
🌍 ============================================
🌍 GLOBAL SETUP - INITIALIZING INFRASTRUCTURE
🌍 ============================================

🏗️ Initializing shared test infrastructure...
📦 Creating container infrastructure...
✅ Container 1 (auth) ready
✅ Container 2 (users) ready
... (more containers)
🗄️ Creating schema infrastructure...
✅ Infrastructure ready: 12 containers, 96 schemas

============================================================
🎯 Schema Allocation for Service: 'auth'
============================================================
📖 READ Schema (Shared):  test_auth_prod-us-east_schema1
✏️  WRITE Schemas (7 available):
   1. test_auth_prod-us-east_schema2
   2. test_auth_prod-us-east_schema3
   ... (more schemas)
============================================================

 ✓ src/__tests__/microservices/example.test.ts (2 tests)
   ✓ should read data (READ - shared schema)
   ✓ should create data (WRITE - unique schema)

🧹 Cleaning up schema allocator for service 'auth'...
   ✅ Disconnected READ client (test_auth_prod-us-east_schema1)
   ✅ Disconnected WRITE client 1 (test_auth_prod-us-east_schema2)
🧹 Cleanup complete: 2 client(s) disconnected

Test Files  1 passed (1)
     Tests  2 passed (2)
```

---

## ✅ Verification

### Checklist

Run through this checklist to verify everything is working:

- [ ] Docker Desktop is running
- [ ] `npm test` starts without errors
- [ ] Global setup completes (~60 seconds)
- [ ] 12 containers are created
- [ ] 96 schemas are created
- [ ] Test file runs successfully
- [ ] Schema allocation logs appear
- [ ] Tests pass
- [ ] Cleanup runs without errors
- [ ] No memory leak warnings

### Common Issues

**Issue: Timeout waiting for infrastructure file**

```
Solution: Check that globalSetup is configured in vitest.config.ts
```

**Issue: Docker connection refused**

```
Solution: Ensure Docker Desktop is running: docker ps
```

**Issue: Port already in use**

```
Solution: Stop existing containers: docker ps | docker stop <container-id>
```

**Issue: Schema exhaustion**

```
Solution: Reduce write tests per file OR increase SCHEMAS_PER_CONTAINER
```

---

## 📊 Project Size Estimates

### File Sizes

- `vitest.config.ts`: ~50 lines
- `tests/globalSetup.ts`: ~130 lines
- `tests/setupFile.ts`: ~100 lines
- `tests/schemaAllocator.ts`: ~400 lines
- `src/__tests__/shared/testInfrastructure.ts`: ~400 lines
- Utility files: ~100-300 lines each

### Total Lines of Code

- **Core testing infrastructure:** ~1,500 lines
- **Utilities:** ~1,000 lines
- **Configuration:** ~200 lines
- **Total:** ~2,700 lines

### Time Estimates

- **Setup from scratch:** 2-4 hours
- **Copy from POC:** 30-60 minutes
- **First test file:** 15 minutes
- **Learning curve:** 1-2 days

---

## 🎯 Next Steps

After successful installation:

1. **Understand each file** - Read [03_CONFIGURATION_FILES.md](03_CONFIGURATION_FILES.md)
2. **Write more tests** - Follow [04_WRITING_TESTS.md](04_WRITING_TESTS.md)
3. **Customize services** - Modify SERVICES array in testInfrastructure.ts
4. **Scale resources** - Adjust CONTAINER_COUNT or SCHEMAS_PER_CONTAINER

---

**Previous:** [01_ARCHITECTURE_OVERVIEW.md](01_ARCHITECTURE_OVERVIEW.md) | **Next:** [03_CONFIGURATION_FILES.md](03_CONFIGURATION_FILES.md)
