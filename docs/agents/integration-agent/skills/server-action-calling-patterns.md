# Skill 19: Server Action Calling Patterns

## 🚨 CRITICAL SKILL - Prevents TypeScript Errors

This skill addresses the #1 most common issue when testing Next.js server actions: understanding that exported actions are **function factories**, not direct functions.

---

## 🎯 The Core Problem

When you see this in an action file:

```typescript
export const createUserAction = adminProcedure
  .schema(CreateUserSchema)
  .action(async ({ ctx, parsedInput }) => {
    const result = await ctx.svc.createUser(parsedInput);
    return { result, message: 'User created' };
  });
```

**The exported `createUserAction` is NOT the action itself.**  
It's a function that RETURNS the actual action handler.

TypeScript sees: `() => Promise<(input) => Promise<any>>`

---

## ✅ Correct Calling Pattern

### **Double Await Pattern**

```typescript
// ✅ CORRECT - Two-step process
const actionHandler = await createUserAction;        // 1st await: Get handler
const result = await actionHandler(testInput);       // 2nd await: Execute handler

// OR more concise:
const result = await (await createUserAction)(testInput);
```

### **Complete Test Template**

```typescript
it("[Test X/10] Description", async () => {
  await executeUserActionTest("Description", async () => {
    const testInput = {
      email: generateUniqueEmail(X),
      name: generateUniqueName(X),
      database: schema.prisma, // Critical: Database injection
    };

    // ✅ CORRECT: Double await for server actions
    const actionHandler = await createUserAction;
    const result = await actionHandler(testInput as any);

    expect(result).toBeDefined();
    expect(result.result).toBeDefined();
    // ... your assertions here

    const executionTime = await simulateProductionOperation();
    expect(executionTime).toBeGreaterThan(0);
    expect(executionTime).toBeLessThan(12000);

    return result;
  });
});
```

---

## ❌ Common Mistakes (What NOT to Do)

### **Single Await (TypeScript Error)**
```typescript
// ❌ WRONG - Causes "This expression is not callable" error
const result = await createUserAction(testInput);
```

### **No Await (TypeScript Error)**
```typescript
// ❌ WRONG - Causes "This expression is not callable" error  
const result = createUserAction(testInput);
```

---

## 🛡️ Error Handling (TypeScript Safe)

### **Proper Error Type Guards**

```typescript
// ✅ CORRECT: Type-safe error handling
try {
  const actionHandler = await createUserAction;
  const result = await actionHandler(invalidInput as any);
  expect.fail("Should have thrown validation error");
} catch (error) {
  expect(error).toBeDefined();
  
  // Type-safe error checking
  if (error instanceof Error) {
    expect(error.message).toContain("Invalid email format");
  } else {
    // Handle non-Error objects (Zod errors, etc.)
    expect(String(error)).toContain("Invalid email format");
  }
}
```

---

## 🔧 All Action Types Follow Same Pattern

```typescript
// ✅ EVERY action needs double await:
const getUserResult = await (await getUserByIdAction)({ 
  userId: '123', 
  database: schema.prisma 
});

const createResult = await (await createUserAction)({ 
  email: 'test@example.com', 
  name: 'Test', 
  database: schema.prisma 
});

const updateResult = await (await updateUserAction)({ 
  id: '123', 
  name: 'Updated', 
  database: schema.prisma 
});

const deleteResult = await (await deleteUserAction)({ 
  userId: '123', 
  database: schema.prisma 
});

const getAllResult = await (await getAllUsersAction)({ 
  page: 1, 
  limit: 10, 
  database: schema.prisma 
});

const searchResult = await (await searchUsersAction)({ 
  search: 'test', 
  page: 1, 
  limit: 10, 
  database: schema.prisma 
});
```

---

## 🧠 Why This Pattern Exists

Next.js server actions use a **procedure pattern**:

1. **Schema Validation**: Validates input against Zod schema
2. **Context Building**: Creates server context with services
3. **Handler Factory**: Returns configured async function
4. **Execution**: Handler executes with validated input and context

This is why you need two awaits:
- **First await**: Get the configured handler (after schema validation setup)
- **Second await**: Execute the handler with your input

---

## 📋 Integration Agent Rules

### **When generating server action tests:**

1. ✅ **Always use double await**: `await (await actionName)(input)`
2. ✅ **Never call directly**: Don't use `await actionName(input)`
3. ✅ **Always inject database**: Include `database: schema.prisma` in input
4. ✅ **Use type-safe error handling**: Check `error instanceof Error`
5. ✅ **Test all action types**: CRUD, search, pagination all follow same pattern

### **Quick Validation Checklist:**

- [ ] Used `await (await actionName)(input)` pattern
- [ ] Included `database: schema.prisma` in test input
- [ ] Used proper error type guards in catch blocks
- [ ] All 6 action types tested with correct pattern
- [ ] No TypeScript "not callable" errors

---

## 🔍 Debugging TypeScript Errors

### **Error: "This expression is not callable"**
- **Cause**: Using single await or no await
- **Fix**: Use double await pattern

### **Error: "'error' is of type 'unknown'"**
- **Cause**: Not using type guards in catch blocks
- **Fix**: Use `if (error instanceof Error)` check

### **Error: "Did you forget to use 'await'?"**
- **Cause**: TypeScript detected function factory pattern
- **Fix**: Use double await as shown above

---

## 🎯 Success Example

```typescript
// ✅ Perfect server action test
it("[Test 1/10] Create user with valid data", async () => {
  await executeUserActionTest("Create user with valid data", async () => {
    const userData = {
      email: generateUniqueEmail(1),
      name: generateUniqueName(1),
      database: schema.prisma,
    };

    // Double await pattern - CORRECT!
    const actionHandler = await createUserAction;
    const result = await actionHandler(userData as any);

    expect(result).toBeDefined();
    expect(result.result.email).toBe(userData.email);
    expect(result.message).toBe('Successfully created user');

    return result;
  });
});
```

---

**Master this skill to eliminate all TypeScript errors when testing Next.js server actions!**
