# 🎯 Selective Test Runner Guide

## Overview

The **Selective Test Runner** allows you to run individual test files with the same full infrastructure as the main orchestrator, but much faster and more focused.

## 🚀 Quick Start

### Run Your Action Test

```bash
npm run test:selective -- user-actions.test.ts
```

### Expected Output

```
🎯 SELECTIVE RUNNER: Loading test file: user-actions.test.ts
📁 Full path: C:\Users\Ashley\source\repos\testing-ultimate-production-demo\src\__tests__\microservices\user-actions.test.ts
✅ Test file found, proceeding with infrastructure setup...

🚀 Loading test file: user-actions.test.ts
✅ Test file loaded successfully

📊 Test Execution Summary:
   • Test File: user-actions.test.ts
   • Execution Time: 2341ms
   • Status: ✅ SUCCESS
   • Infrastructure: Full (5 containers, 20 schemas)

🏗️  Infrastructure Verification:
   • PostgreSQL Containers: ✅ Available
   • Redis Containers: ✅ Available
   • Auth Schemas: 4 available
   • Logger: ✅ Available

🏁 SELECTIVE RUNNER COMPLETED
   • Total Runtime: 5678ms
   • Infrastructure Cleanup: ✅ Handled by framework
```

## 📋 Available Commands

### Using npm Script (Recommended)

```bash
# Test specific files
npm run test:selective -- user-actions.test.ts
npm run test:selective -- auth-login.test.ts
npm run test:selective -- payment-process.test.ts
npm run test:selective -- inventory-stock.test.ts
npm run test:selective -- analytics-events.test.ts
```

### Using Vitest Directly

```bash
npx vitest run src/__tests__/selectiveTestRunner.test.ts -- --test-file=user-actions.test.ts
```

## 🆚 Comparison: Selective Runner vs Direct Vitest

| Feature | Selective Runner | Direct Vitest |
|---------|------------------|---------------|
| ✅ Infrastructure | Full (5 containers, 20 schemas) | ❌ None |
| ✅ Database Setup | Automatic schemas, tables, data | ❌ Manual setup required |
| ✅ Service Factory | Configured with dependencies | ❌ Not available |
| ✅ Connection Pooling | Optimized LRU cache | ❌ No pooling |
| ✅ Memory Management | Real-time monitoring | ❌ Basic |
| ✅ Logging | Winston with multiple formats | ❌ Console only |
| ⏱️ Startup Time | 10-15s (infrastructure) | <1s (but useless) |
| 🎯 Use Case | Development, debugging, CI/CD | ❌ Tests fail |

## 🎯 When to Use

### 🛠️ Development
```bash
# Quick feedback while coding
npm run test:selective -- user-actions.test.ts
```

### 🐛 Debugging
```bash
# Isolate failing tests
npm run test:selective -- auth-login.test.ts
```

### 🚀 CI/CD PR Pipelines
```bash
# Run only affected tests in pull requests
npm run test:selective -- payment-validation-errors.test.ts
```

### 📊 Performance Testing
```bash
# Test specific performance scenarios
npm run test:selective -- inventory-stock.test.ts
```

## 🔧 How It Works

### 1. Infrastructure Creation
- Creates 5 PostgreSQL containers (auth, payment, inventory, analytics, notification)
- Sets up 20 database schemas (4 per service)
- Establishes connection pooling and memory management

### 2. Dynamic Test Loading
- Parses command line argument `--test-file=<filename>`
- Validates file existence
- Dynamically imports the test module
- Executes tests within the infrastructure context

### 3. Metrics Recording
- Records execution time and performance data
- Logs infrastructure usage statistics
- Provides detailed execution summary

## 🔍 Error Handling

### File Not Found
```
❌ No test file specified. Use: --test-file=<filename>.test.ts
```

### Test File Missing
```
❌ Test file not found: /path/to/missing/file.test.ts
```

### Test Execution Failures
```
❌ Test Execution Failed:
   • Test File: user-actions.test.ts
   • Error: Test validation failed
   • Execution Time: 1234ms
```

## 📁 File Structure

The selective runner looks for test files in:
```
src/__tests__/microservices/
├── user-actions.test.ts          ← Your new test
├── auth-login.test.ts
├── auth-registration.test.ts
├── payment-process.test.ts
├── inventory-stock.test.ts
└── ... (all other test files)
```

## 🎉 Benefits

### ✅ Full Infrastructure
- Same environment as production tests
- All services and dependencies available
- Real database operations

### ⚡ Fast Execution
- Only runs your specified test file
- Skips 500+ unrelated tests
- Perfect for iterative development

### 🎯 Focused Testing
- Isolate specific functionality
- Easier debugging
- Cleaner output

### 📊 Production-Ready
- Same validation and error handling
- Metrics and logging
- CI/CD compatible

## 🚀 Integration with Workflow

### Development Workflow
```bash
# 1. Make changes to your action code
vim src/services/users/actions.ts

# 2. Test specific functionality
npm run test:selective -- user-actions.test.ts

# 3. Run full suite before commit
npx vitest run src/__tests__/ultimateProductionDemo.test.ts
```

### CI/CD Pipeline
```yaml
# In your CI/CD config
- name: Run affected tests
  run: |
    if [[ ${{changed_files}} == *"users/actions.ts"* ]]; then
      npm run test:selective -- user-actions.test.ts
    fi
```

---

**File:** `docs/SELECTIVE_TEST_RUNNER.md`
**Date:** November 14, 2025
**Status:** Production Ready 🚀