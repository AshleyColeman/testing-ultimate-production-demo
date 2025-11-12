# Skill 9: CREATIVE EDGE CASE DETECTION

## 📋 PURPOSE

Think creatively and deeply about unusual scenarios, timing issues, and unexpected situations that might break the code.

**Goal**: Go beyond obvious tests and discover hidden edge cases.

---

## 🎯 WHEN TO USE

- After analyzing method logic
- After understanding database operations
- When user requests "more creative tests"
- When looking for hidden bugs

---

## 💡 CREATIVE THINKING FRAMEWORK

### The "What If" Method

Ask these questions for every method:

#### 1. **What if TWO things happen at the SAME TIME?**

```typescript
// Method: reserveInventory(productId, quantity)

// Creative scenarios:
- What if 2 users reserve the last item simultaneously?
- What if user reserves while admin deletes the product?
- What if inventory is updated while reservation is processing?
- What if 100 concurrent reservations happen?

// Tests to add:
- Race condition: 2 users, 1 item left
- Concurrent delete during reservation
- Inventory update mid-transaction
- Stress test: 100 concurrent reservations
```

#### 2. **What if the data is in an UNEXPECTED STATE?**

```typescript
// Method: cancelOrder(orderId)

// Creative scenarios:
- What if order is already cancelled?
- What if order is in "processing" but payment failed?
- What if order has some items shipped, some not?
- What if order was deleted from DB but cache still has it?
- What if order status is null (corrupted data)?

// Tests to add:
- Double cancellation attempt
- Cancel order with inconsistent state
- Cancel order with partial fulfillment
- Cancel order missing from DB
- Cancel order with null/corrupt status
```

#### 3. **What if there's TOO MUCH data?**

```typescript
// Method: deleteUser(userId)

// Creative scenarios:
- What if user has 100,000 orders?
- What if cascade chain is 5 levels deep?
- What if deleting takes longer than transaction timeout?
- What if cascade affects 1 million records?

// Tests to add:
- Delete user with 10,000+ related records
- Delete with deep cascade chain (5+ levels)
- Delete with transaction timeout simulation
- Performance test: measure time for large cascade
```

#### 4. **What if the input is WEIRD?**

```typescript
// Method: createUser(input)

// Creative scenarios:
- What if name contains only emojis? 🚀💻🎉
- What if email is 500 characters long?
- What if name has SQL injection attempt?
- What if all fields are empty strings vs null?
- What if input has unexpected extra fields?
- What if unicode characters (Arabic, Chinese, emoji)?
- What if name is just whitespace "   "?

// Tests to add:
- Create user with emoji-only name
- Create user with extremely long email
- Create user with SQL injection strings
- Create user with null vs "" vs "   " (whitespace)
- Create user with extra unexpected fields
- Create user with various unicode (中文, العربية, 🎉)
```

#### 5. **What if there's a CIRCULAR DEPENDENCY?**

```typescript
// Method: deleteCategory(categoryId)

// Creative scenarios:
- What if Category A references B, and B references A?
- What if product is in deleted category AND deleted warehouse?
- What if FK cascade creates infinite loop?
- What if self-referencing FK (category.parentId → category.id)?

// Tests to add:
- Delete category with circular parent reference
- Delete with multiple cascading paths to same record
- Delete self-referencing record
- Detect and prevent infinite cascade loops
```

#### 6. **What if TIMING matters?**

```typescript
// Method: applyDiscount(orderId, code)

// Creative scenarios:
- What if discount expires in the middle of checkout?
- What if user applies discount twice in 1ms?
- What if discount is applied after order is paid?
- What if system clock changes during processing?
- What if discount code expires at EXACTLY midnight?

// Tests to add:
- Apply discount at exact expiration time
- Double-apply discount (rapid succession)
- Apply discount to completed order
- Test with time boundary conditions
```

#### 7. **What if TRANSACTION fails HALFWAY?**

```typescript
// Method: transferFunds(fromAccount, toAccount, amount)

// Creative scenarios:
- What if debit succeeds but credit fails?
- What if network error after debit?
- What if database crashes after first operation?
- What if deadlock occurs mid-transaction?

// Tests to add:
- Simulate failure after debit (rollback test)
- Network error mid-transaction
- Deadlock detection and recovery
- Partial transaction rollback verification
```

#### 8. **What if NULL, UNDEFINED, and EMPTY STRING are different?**

```typescript
// Method: updateUser(id, updates)

// Creative scenarios:
- What's the difference between { name: null } and { name: undefined }?
- What about { name: "" } vs { name: "   " }?
- What if updating to null clears the field?
- What if updating to "" keeps old value?

// Tests to add:
- Update with null value (explicitly set to null)
- Update with undefined (field omitted)
- Update with empty string
- Update with whitespace-only string
- Verify different behaviors for each
```

---

## 🔍 EDGE CASE DISCOVERY PATTERNS

### Pattern 1: Boundary Hunting

For every numeric field, test:

- **Zero**: Often special case (division, counting)
- **Negative**: Should it be allowed?
- **Maximum**: What's the limit? Test it.
- **Minimum**: What's the smallest valid value?
- **Just over max**: Test max + 1
- **Just under min**: Test min - 1

```typescript
// Method: setPriority(taskId, priority)
// Assume priority is 1-10

// Creative boundary tests:
- Set priority = 0 (below min)
- Set priority = 1 (min boundary)
- Set priority = 10 (max boundary)
- Set priority = 11 (above max)
- Set priority = -1 (negative)
- Set priority = 999999 (extreme value)
- Set priority = 1.5 (decimal instead of integer)
```

### Pattern 2: Cascade Chain Analysis

For every FK relationship, trace the cascade:

```typescript
// Schema:
// Company → Department → Employee → Task → Subtask

// Creative cascade tests:
- Delete company: verify 4-level cascade
- Delete department with 10,000 employees (performance)
- Delete employee mid-cascade (concurrent operation)
- Delete with circular reference (if exists)
- Delete and verify audit trail maintained
- Delete and measure cascade time
```

### Pattern 3: State Machine Exploration

For every status/state field, map all transitions:

```typescript
// Order statuses: pending → processing → shipped → delivered
//                                      ↓
//                                  cancelled

// Creative state tests:
- All valid transitions (pending → processing → shipped → delivered)
- Invalid transitions (delivered → pending)
- Skip transitions (pending → delivered)
- Reverse transitions (delivered → pending)
- Transition from null/undefined state
- Transition to same state (no-op)
- Rapid state changes (pending → cancelled → pending)
```

### Pattern 4: Unicode & Special Characters

Test every string field with:

```typescript
const creativeInputs = [
  "Normal Name",                    // baseline
  "Name-With-Hyphens",             // punctuation
  "Name.With.Dots",                // dots
  "Name'With'Quotes",              // quotes
  'Name"With"DoubleQuotes',        // double quotes
  "Name\nWith\nNewlines",          // newlines
  "Name\tWith\tTabs",              // tabs
  "Name With   Spaces",            // multiple spaces
  "   Name With Leading Spaces",   // leading spaces
  "Name With Trailing Spaces   ",  // trailing spaces
  "🚀 Name With Emoji 🎉",         // emoji
  "中文名字",                       // Chinese
  "الاسم العربي",                  // Arabic
  "Имя",                           // Cyrillic
  "Name<script>alert('xss')</script>", // XSS attempt
  "Name'; DROP TABLE users; --",   // SQL injection
  "Name\\With\\Backslashes",       // backslashes
  "Name/With/Slashes",             // forward slashes
  String.fromCharCode(0),          // null byte
  "\u200B\u200B\u200BName",        // zero-width spaces
  "A".repeat(10000),               // extremely long (10k chars)
];

// Test each input and verify:
- Correct storage (no corruption)
- Correct retrieval (no encoding issues)
- No security vulnerabilities (XSS, SQL injection)
- No crashes or errors
```

### Pattern 5: Timing Windows

Identify time-dependent logic:

```typescript
// Method: isEligibleForDiscount(userId)
// Logic: User registered > 30 days ago

// Creative timing tests:
- User registered exactly 30 days ago (boundary)
- User registered 29 days, 23 hours, 59 minutes ago (just before)
- User registered 30 days, 0 hours, 1 second ago (just after)
- User registered in future (clock skew)
- User registered at epoch (1970-01-01)
- User registered at max date (2100-01-01)
- Check during daylight saving time transition
- Check during leap second
```

---

## 🧪 CREATIVE TEST GENERATION

### Example: analyzeMethod(method) → creativeEdgeCases

```typescript
function generateCreativeEdgeCases(method: Method): EdgeCase[] {
  const edgeCases = [];

  // Check for concurrency potential
  if (method.modifiesSharedResource) {
    edgeCases.push({
      name: `Concurrent ${method.name} calls on same resource`,
      description: "2 users call method simultaneously",
      category: "race-condition",
      priority: "HIGH",
    });
  }

  // Check for cascade chains
  if (method.deleteOperation && method.hasCascades) {
    edgeCases.push({
      name: `Delete with ${method.cascadeLevels}-level cascade chain`,
      description: `Test performance and correctness of deep cascade`,
      category: "cascade-chain",
      priority: "HIGH",
    });
  }

  // Check for state transitions
  if (method.modifiesStatusField) {
    const invalidTransitions = findInvalidStateTransitions(method);
    invalidTransitions.forEach((transition) => {
      edgeCases.push({
        name: `Invalid state transition: ${transition.from} → ${transition.to}`,
        description: `Attempt invalid transition and verify rejection`,
        category: "state-transition",
        priority: "MEDIUM",
      });
    });
  }

  // Check for null/undefined/empty differences
  if (method.hasOptionalFields) {
    edgeCases.push({
      name: "Test null vs undefined vs empty string behavior",
      description: "Verify different handling of null/''/undefined",
      category: "nullability",
      priority: "MEDIUM",
    });
  }

  // Check for unicode/special chars
  if (method.acceptsStringInput) {
    edgeCases.push({
      name: "Test with emoji and unicode characters",
      description: "Verify emoji storage and retrieval",
      category: "unicode",
      priority: "LOW",
    });
  }

  // Check for transaction rollback scenarios
  if (method.usesTransaction) {
    edgeCases.push({
      name: "Test transaction rollback on error",
      description: "Simulate error mid-transaction and verify rollback",
      category: "transaction",
      priority: "HIGH",
    });
  }

  // Check for large dataset performance
  if (method.deletesRecords || method.queriesRecords) {
    edgeCases.push({
      name: `Test with 10,000+ related records`,
      description: "Verify performance with large dataset",
      category: "performance",
      priority: "MEDIUM",
    });
  }

  return edgeCases;
}
```

---

## 📊 CREATIVE TEST CATEGORIES

### 1. Concurrency Edge Cases

```typescript
// Tests that require thinking about simultaneous operations
[
  "2 users create record with same unique value simultaneously",
  "User deletes while another updates same record",
  "100 concurrent operations on same resource",
  "Read while write is in progress",
  "Two transactions modifying related records",
  "Deadlock scenario (A waits for B, B waits for A)",
];
```

### 2. Data Volume Edge Cases

```typescript
// Tests that require thinking about scale
[
  "Delete record with 10,000+ related records",
  "Query returning 100,000+ results",
  "Transaction with 1,000+ operations",
  "Cascade affecting 1 million records",
  "Bulk insert 50,000 records",
  "Pagination with 10,000 pages",
];
```

### 3. State Corruption Edge Cases

```typescript
// Tests that require thinking about data integrity
[
  "Record in unexpected state (status = null)",
  "FK reference to deleted record (orphaned)",
  "Circular FK references",
  "Partial transaction commit (data inconsistency)",
  "Duplicate records that should be unique",
  "Record exists in cache but not DB",
];
```

### 4. Character/Encoding Edge Cases

```typescript
// Tests that require thinking about string handling
[
  "Name with only emoji 🚀💻",
  "Name with Arabic script: العربية",
  "Name with Chinese characters: 中文",
  "Name with SQL injection: '; DROP TABLE--",
  "Name with XSS: <script>alert('xss')</script>",
  "Name with null byte: \\0",
  "Name with zero-width spaces: \\u200B",
  "Name with 10,000 characters",
];
```

### 5. Timing/Temporal Edge Cases

```typescript
// Tests that require thinking about time
[
  "Operation at exact midnight",
  "Operation during daylight saving transition",
  "Date in far past (1970-01-01)",
  "Date in far future (2100-01-01)",
  "Expiration at EXACT boundary time",
  "Concurrent operations within same millisecond",
  "Operation when system clock changes",
];
```

### 6. Null/Undefined/Empty Edge Cases

```typescript
// Tests that require thinking about absence of data
[
  "Field set to null explicitly",
  "Field set to undefined (omitted)",
  "Field set to empty string ''",
  "Field set to whitespace '   '",
  "Field set to zero vs null",
  "Updating field to null vs deleting field",
  "Optional field not provided vs provided as undefined",
];
```

---

## 🎯 CREATIVE EDGE CASE CHECKLIST

For each method, consider:

**Concurrency**

- [ ] What if 2+ users call this simultaneously?
- [ ] What if this is called while related record is being deleted?
- [ ] What if 100+ concurrent calls happen?

**Scale**

- [ ] What if there are 10,000+ related records?
- [ ] What if cascade chain is very deep?
- [ ] What if this takes longer than transaction timeout?

**State**

- [ ] What if record is in unexpected state?
- [ ] What if record is already deleted?
- [ ] What if status is null or corrupted?
- [ ] What if circular dependencies exist?

**Input**

- [ ] What if input has emoji or unicode?
- [ ] What if input is SQL injection attempt?
- [ ] What if input is XSS attempt?
- [ ] What if input is extremely long?
- [ ] What if input is null vs undefined vs ""?

**Timing**

- [ ] What if called at exact boundary time?
- [ ] What if called during time transition?
- [ ] What if expiration happens mid-operation?

**Transactions**

- [ ] What if transaction fails halfway?
- [ ] What if rollback is needed?
- [ ] What if deadlock occurs?
- [ ] What if nested transaction fails?

**Cascades**

- [ ] What if cascade affects many records?
- [ ] What if cascade is multi-level?
- [ ] What if cascade creates orphans?
- [ ] What if cascade has circular refs?

---

## 💡 EXAMPLE: Creative Analysis of deleteUser()

**Method**: `deleteUser(userId: string): Promise<void>`

**Obvious tests** (already covered):

- Delete existing user ✅
- Delete non-existent user ❌
- Delete and verify cascade to orders ✅

**Creative edge cases** (thinking deeper):

1. **Concurrency**: Delete user while another request is creating an order for them
2. **Scale**: Delete user with 50,000 orders (measure time, verify all deleted)
3. **Cascade Chain**: Delete user → orders → order_items → inventory_reservations (4-level cascade)
4. **State**: Delete user who is "soft deleted" (deleted_at IS NOT NULL but record exists)
5. **Circular**: Delete user who is their own referrer (referredBy = id)
6. **Transaction**: Simulate failure after deleting user but before deleting orders (rollback test)
7. **Timing**: Delete user at exact moment their trial expires
8. **Orphans**: Delete user and verify all related records properly handled (no orphans)
9. **Performance**: Measure delete time with 1, 100, 1000, 10000 orders
10. **Audit**: Delete user and verify audit log records who deleted and when
11. **Cache**: Delete user and verify cache invalidation
12. **Session**: Delete user with active session (verify session invalidated)

**Result**: 12 creative edge cases that go WAY beyond obvious testing!

---

## ✅ SUCCESS CRITERIA

Creative edge case discovery is complete when:

1. **Every method has 3-5 creative edge cases** beyond obvious tests
2. **All "what if" questions answered** (concurrency, scale, state, timing)
3. **Unusual inputs considered** (unicode, SQL injection, XSS, extremely long)
4. **State corruption scenarios identified** (null status, orphans, circular refs)
5. **Performance limits tested** (large datasets, deep cascades)
6. **Transaction failure scenarios covered** (rollback, deadlock)
7. **All edge cases have clear test descriptions** and expected outcomes

---

**File**: creative-edge-case-detection.md  
**Skill**: 9  
**Status**: Production-Ready  
**Purpose**: Think creatively about unusual scenarios and hidden edge cases
