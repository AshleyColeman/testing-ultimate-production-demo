# 🔄 Quick Migration Guide for Existing Tests

## Overview

Three infrastructure fixes require updates to existing test files. This guide shows exactly what to change.

---

## Changes Required

### Change 1: Add Cleanup Hook (All 3 Files)

**Why:** Prevents memory leaks from unclosed Prisma connections

### Change 2: Remove Double-Await Pattern (All 3 Files)

**Why:** Simplified actions pattern - single await is cleaner

### Change 3: Remove User Table Creation (user-actions.test.ts only)

**Why:** Table now created globally in infrastructure

---

## File 1: auth-login-new-pattern.test.ts

### Step 1: Update Import

```typescript
// Change this:
const { useReadSchema, useWriteSchema } = createSchemaAllocator("auth");

// To this:
const { useReadSchema, useWriteSchema, cleanup } =
  createSchemaAllocator("auth");
```

### Step 2: Add Cleanup Hook

```typescript
describe("Auth Service - Login (Schema Allocator Pattern)", () => {
  // ... all existing tests ...

  // Add this at the end, before closing the describe block:
  afterAll(async () => {
    await cleanup();
  });
});
```

### Step 3: No Action Call Changes Needed

This file uses raw SQL, not action calls, so no double-await changes needed.

---

## File 2: user-actions.test.ts

### Step 1: Update Import

```typescript
// Change this:
const { useReadSchema, useWriteSchema } = createSchemaAllocator("users");

// To this:
const { useReadSchema, useWriteSchema, cleanup } =
  createSchemaAllocator("users");
```

### Step 2: Add Cleanup Hook

```typescript
describe("User Actions Integration Tests", () => {
  // ... all existing tests ...

  // Add this at the end, before closing the describe block:
  afterAll(async () => {
    await cleanup();
  });
});
```

### Step 3: Remove ALL Table Creation (7 instances)

**Find and delete these blocks in Tests #1, #2, #3, #5, #7, #9, #10:**

```typescript
// DELETE THIS ENTIRE BLOCK:
await db.$executeRawUnsafe(`
  CREATE TABLE IF NOT EXISTS "${schemaName}".user (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`);
```

### Step 4: Update Action Calls (11 instances)

**Find and replace all action calls:**

```typescript
// OLD PATTERN - Find these:
await (await createUserAction)({...})
await (await getUserByIdAction)({...})
await (await updateUserAction)({...})
await (await deleteUserAction)({...})
await (await getAllUsersAction)({...})
await (await searchUsersAction)({...})

// NEW PATTERN - Replace with:
await createUserAction({...})
await getUserByIdAction({...})
await updateUserAction({...})
await deleteUserAction({...})
await getAllUsersAction({...})
await searchUsersAction({...})

// Just remove the inner "await" and one set of parentheses
```

**Specific locations:**

- Test #1: Line ~92 - `createUserAction`
- Test #2: Lines ~143, ~156 - `createUserAction` (2 calls)
- Test #3: Lines ~201, ~215 - `createUserAction`, `getUserByIdAction`
- Test #4: Line ~254 - `getUserByIdAction`
- Test #5: Lines ~297, ~315 - `createUserAction`, `updateUserAction`
- Test #6: Line ~353 - `updateUserAction`
- Test #7: Lines ~398, ~414, ~432 - `createUserAction`, `deleteUserAction`, `getUserByIdAction`
- Test #8: Line ~462 - `deleteUserAction`
- Test #9: Lines ~508, ~515, ~522, ~536 - `createUserAction` (3 calls), `getAllUsersAction`
- Test #10: Lines ~580, ~587, ~600 - `createUserAction` (2 calls), `searchUsersAction`

---

## File 3: schema-isolation-validation.test.ts

### Step 1: Update Import

```typescript
// Change this:
const { useReadSchema, useWriteSchema } = createSchemaAllocator("audit");

// To this:
const { useReadSchema, useWriteSchema, cleanup } =
  createSchemaAllocator("audit");
```

### Step 2: Add Cleanup Hook

```typescript
describe("Schema Isolation Validation", () => {
  // ... all existing tests ...

  // Add this at the end, before closing the describe block:
  afterAll(async () => {
    await cleanup();
  });
});
```

### Step 3: No Other Changes Needed

This file uses raw SQL and test_data table (which already exists), so no other changes required.

---

## 🔍 How to Verify Changes

### 1. Check TypeScript Compilation

```powershell
npx tsc --noEmit
```

Should pass with no errors.

### 2. Look for Cleanup Logs

When tests run, you should see:

```
🧹 Cleaning up schema allocator for service 'users'...
   ✅ Disconnected READ client (test_users_schema1)
   ✅ Disconnected WRITE client 1 (test_users_schema2)
   ✅ Disconnected WRITE client 2 (test_users_schema3)
   ...
🧹 Cleanup complete: 8 client(s) disconnected
```

### 3. Verify Tests Still Pass

```powershell
npx vitest run src/__tests__/microservices/
```

All tests should pass as before.

---

## 📊 Summary of Changes

### auth-login-new-pattern.test.ts

- ✅ Add cleanup import and hook
- ✅ No action call changes (uses raw SQL)
- ✅ No table removal (uses test_data)

### user-actions.test.ts

- ✅ Add cleanup import and hook
- ✅ Update 11 action calls (remove double-await)
- ✅ Remove 7 table creation blocks

### schema-isolation-validation.test.ts

- ✅ Add cleanup import and hook
- ✅ No action call changes (uses raw SQL)
- ✅ No table removal (uses test_data)

---

## ⏱️ Estimated Time

- **auth-login-new-pattern.test.ts:** 2 minutes
- **user-actions.test.ts:** 10 minutes (many changes)
- **schema-isolation-validation.test.ts:** 2 minutes
- **Total:** ~15 minutes

---

## ✅ Checklist

After migration, verify:

- [ ] All 3 files import `cleanup` from `createSchemaAllocator`
- [ ] All 3 files have `afterAll(async () => { await cleanup(); })` hook
- [ ] user-actions.test.ts has NO `CREATE TABLE` statements
- [ ] user-actions.test.ts uses single-await for all action calls
- [ ] TypeScript compiles without errors
- [ ] Tests run successfully
- [ ] Cleanup logs appear in test output

---

## 🚀 After Migration

Once all files are migrated:

1. Run full test suite to validate
2. Check for cleanup logs in output
3. Monitor for any connection leak warnings
4. Use the new rules for all future test generation

The infrastructure is now production-ready! 🎉
