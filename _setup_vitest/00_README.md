# 🚀 Vitest Parallel Testing with Schema Isolation - Complete Setup Guide

## 📋 Documentation Index

Welcome to the complete guide for setting up Vitest parallel testing with PostgreSQL testcontainers and schema isolation. This proof of concept demonstrates how to run integration tests in parallel while ensuring complete data isolation.

### 📚 Documentation Structure

1. **[00_README.md](00_README.md)** _(You are here)_ - Overview and index
2. **[01_ARCHITECTURE_OVERVIEW.md](01_ARCHITECTURE_OVERVIEW.md)** - System architecture and core concepts
3. **[02_INSTALLATION_GUIDE.md](02_INSTALLATION_GUIDE.md)** - Step-by-step setup for new projects
4. **[03_CONFIGURATION_FILES.md](03_CONFIGURATION_FILES.md)** - Detailed explanation of each config file
5. **[04_WRITING_TESTS.md](04_WRITING_TESTS.md)** - How to write tests with the schema allocator pattern
6. **[05_TROUBLESHOOTING.md](05_TROUBLESHOOTING.md)** - Common issues and solutions
7. **[06_MIGRATION_GUIDE.md](06_MIGRATION_GUIDE.md)** - Converting existing tests to this pattern

---

## 🎯 What This System Does

This testing framework allows you to:

- ✅ **Run tests in parallel** using Vitest's fork pool (6 concurrent workers)
- ✅ **Isolate test data** using PostgreSQL schemas (96 schemas across 12 containers)
- ✅ **Share read-only operations** efficiently (1 shared schema per service)
- ✅ **Isolate write operations** completely (unique schema per write test)
- ✅ **Scale to 50+ test files** without data conflicts
- ✅ **Use real PostgreSQL databases** via testcontainers (not mocks)

---

## 🏗️ System Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    VITEST TEST RUNNER                        │
│                 (6 Parallel Worker Threads)                  │
└──────────────┬──────────────────────────────────────────────┘
               │
               ├─ Worker 1 ─> Test File 1 ─> Service "auth"
               ├─ Worker 2 ─> Test File 2 ─> Service "users"
               ├─ Worker 3 ─> Test File 3 ─> Service "payment"
               ├─ Worker 4 ─> Test File 4 ─> Service "inventory"
               ├─ Worker 5 ─> Test File 5 ─> Service "analytics"
               └─ Worker 6 ─> Test File 6 ─> Service "notification"
                      │
                      ▼
         ┌─────────────────────────────────┐
         │   Schema Allocator (per file)   │
         │  • 1 READ (shared by reads)     │
         │  • 7 WRITE (1 per write test)   │
         └────────────┬────────────────────┘
                      │
                      ▼
         ┌─────────────────────────────────┐
         │  12 PostgreSQL Containers       │
         │  • 8 schemas per container      │
         │  • 96 total schemas available   │
         └─────────────────────────────────┘
```

### Key Concepts

1. **Global Setup** - Runs once before all tests to create containers and schemas
2. **Setup Files** - Each worker reads infrastructure data from a shared file
3. **Schema Allocator** - Per-test-file pattern that allocates READ and WRITE schemas
4. **Lazy Initialization** - Schemas and Prisma clients created only when needed
5. **Cleanup Hooks** - Disconnect all Prisma clients to prevent memory leaks

---

## 📊 Resource Allocation

### Container Distribution

- **12 PostgreSQL containers** (2 per worker thread)
- Each container serves a different "service" (auth, users, payment, etc.)
- Each container has a unique database, username, and password

### Schema Distribution

- **8 schemas per container** = **96 total schemas**
- **Per test file allocation:**
  - 1 READ schema (shared by all read-only tests)
  - 7 WRITE schemas (one per write test)

### Example for a Test File with 10 Tests

- 3 read-only tests → Share 1 schema
- 7 write tests → Each gets unique schema
- **Total: 8 schemas needed for this file**

---

## 🔑 Core Principles

### 1. **Parallel Execution Without Conflicts**

Tests run simultaneously in different workers, but each test file gets its own isolated schemas. No two tests ever write to the same schema.

### 2. **Efficient Resource Sharing**

Read-only tests share a schema because they don't modify data. This saves resources while maintaining safety.

### 3. **Lazy Initialization**

Infrastructure is created only when needed:

- Containers start in global setup
- Schemas created during global setup
- Prisma clients created when first test runs
- Clients reused within the same test file

### 4. **Memory Management**

All Prisma clients are properly disconnected after tests complete using cleanup hooks. This prevents memory leaks.

### 5. **Real Database Testing**

Uses actual PostgreSQL containers via testcontainers, not mocks. Tests interact with real databases, providing confidence that code works in production.

---

## 🚦 Quick Start

If you're new to this system:

1. **Start with [Architecture Overview](01_ARCHITECTURE_OVERVIEW.md)** to understand how it works
2. **Follow [Installation Guide](02_INSTALLATION_GUIDE.md)** to set it up in your project
3. **Study [Configuration Files](03_CONFIGURATION_FILES.md)** to understand each file's purpose
4. **Read [Writing Tests](04_WRITING_TESTS.md)** to learn the pattern
5. **Reference [Troubleshooting](05_TROUBLESHOOTING.md)** when you encounter issues

---

## 📦 Technology Stack

- **[Vitest](https://vitest.dev/)** - Fast test runner with parallel execution
- **[Testcontainers](https://testcontainers.com/)** - PostgreSQL containers for testing
- **[Prisma](https://www.prisma.io/)** - Type-safe database client
- **[PostgreSQL](https://www.postgresql.org/)** - Relational database with schema support
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe JavaScript

---

## 🎓 Learning Path

### For Beginners

1. Understand Vitest basics (global setup, setup files, hooks)
2. Learn PostgreSQL schema concept (like mini-databases)
3. Understand testcontainers (Docker containers for testing)
4. Study the schema allocator pattern (READ vs WRITE)

### For Experienced Developers

1. Review architecture overview for high-level understanding
2. Examine configuration files to see implementation details
3. Study a sample test file to see the pattern in action
4. Adapt the system to your specific needs

---

## 💡 Why This Approach?

### Problems It Solves

**❌ Without This System:**

- Tests run sequentially (slow)
- Shared database causes conflicts
- Need complex cleanup between tests
- Flaky tests due to data pollution
- Hard to debug which test broke what

**✅ With This System:**

- Tests run in parallel (6x faster)
- Each test has isolated data
- No cleanup needed (fresh schema per test)
- Reliable, deterministic tests
- Easy to debug (isolated schemas)

---

## 📈 Performance Characteristics

### Setup Time

- **Initial container creation:** ~30-40 seconds (one time)
- **Schema creation:** ~20-30 seconds (one time)
- **Total setup:** ~60 seconds before first test runs

### Test Execution

- **Parallel execution:** 6 tests run simultaneously
- **Schema allocation:** <10ms per test
- **Prisma client creation:** ~50-100ms (cached after first use)

### Cleanup

- **Container shutdown:** ~5-10 seconds
- **Prisma disconnection:** <1 second

### Scalability

- Current: 96 schemas support ~90 write tests across all files
- Can scale: Increase SCHEMAS_PER_CONTAINER or CONTAINER_COUNT
- Example: 12 containers × 16 schemas = 192 schemas (supports ~180 write tests)

---

## 🔧 Customization Options

You can customize:

- Number of containers (CONTAINER_COUNT)
- Schemas per container (SCHEMAS_PER_CONTAINER)
- Worker threads (maxForks in vitest.config.ts)
- Service names (SERVICES array)
- Environment names (ENVIRONMENTS array)
- Database tables created in each schema

---

## 📞 Support & Resources

### This Documentation

- Complete code examples
- Line-by-line explanations
- Common issues and solutions
- Best practices and patterns

### External Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testcontainers Documentation](https://testcontainers.com/)
- [Prisma Documentation](https://www.prisma.io/docs)
- [PostgreSQL Schema Documentation](https://www.postgresql.org/docs/current/ddl-schemas.html)

---

## ✅ Success Criteria

You'll know the system is working when:

1. ✅ All containers start successfully
2. ✅ All schemas are created without errors
3. ✅ Tests run in parallel (see 6 workers active)
4. ✅ No schema exhaustion errors
5. ✅ All tests pass consistently
6. ✅ No memory leak warnings
7. ✅ Cleanup completes without errors

---

## 🎯 Next Steps

Ready to get started? Proceed to:

### → **[01_ARCHITECTURE_OVERVIEW.md](01_ARCHITECTURE_OVERVIEW.md)**

This will give you a deep understanding of how the system works before you start setting it up.

---

## 📝 Document Version

- **Version:** 1.0.0
- **Last Updated:** November 18, 2025
- **Proof of Concept Status:** Production-Ready
- **Tested With:**
  - Vitest 3.2.4
  - Testcontainers 10.7.0
  - Prisma 5.11.0
  - PostgreSQL 16 (via testcontainers)
  - Node.js 18+

---

## 🙏 Acknowledgments

This system is built on best practices from:

- Vitest parallel execution patterns
- Testcontainers isolation strategies
- Prisma schema management
- PostgreSQL multi-tenancy patterns

---

**Ready to dive in? Let's go! →** [Architecture Overview](01_ARCHITECTURE_OVERVIEW.md)
