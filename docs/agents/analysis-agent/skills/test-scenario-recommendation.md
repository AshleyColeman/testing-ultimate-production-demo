# Skill 5: TEST SCENARIO RECOMMENDATION

## 📋 PURPOSE

Generate intelligent test scenario recommendations based on method analysis, database operations, and FK relationships.

**Goal**: Recommend exactly what needs to be tested and why.

---

## 🎯 WHEN TO USE

- After completing service analysis
- After database schema detection
- After FK analysis
- Before creating test plan
- For both traditional services AND Next.js action files

---

## ⚡ QUICK START

```typescript
// Step 1: Analyze method risks
const risks = assessMethodRisks(method, fkRelationships);

// Step 2: Generate happy path scenarios
const happyPath = generateHappyPathScenarios(method, risks);

// Step 3: Generate error scenarios
const errors = generateErrorScenarios(method, constraints);

// Step 4: Generate edge cases
const edgeCases = generateEdgeCaseScenarios(method);

// Step 5: Compile recommendations
return compileTestRecommendations(happyPath, errors, edgeCases);
```

---

## 🔍 TEST SCENARIO CATEGORIES

### Category 1: Happy Path Tests (60%)

**What**: Normal, successful operations

**When to recommend**:

- CREATE operations → Test creation with valid data
- READ operations → Test retrieval of existing records
- UPDATE operations → Test updates with valid changes
- DELETE operations → Test deletion of existing records

**Examples**:

```typescript
// For createUser():
1. Create user with minimal required fields ✅
2. Create user with all optional fields ✅
3. Create user and verify in database ✅
4. Create user with special characters ✅
5. Create multiple users sequentially ✅
6. Create user and verify timestamps ✅

// For getUserById():
1. Get existing user by valid ID ✅
2. Get user and verify all fields ✅
3. Get user immediately after creation ✅
```

### Category 2: Error Cases (30%)

**What**: Invalid inputs, constraint violations, not found

**When to recommend**:

- Unique constraints → Test duplicates
- NOT NULL constraints → Test missing fields
- FK constraints → Test invalid references
- Validation rules → Test invalid formats
- Not found → Test non-existent IDs

**Examples**:

```typescript
// For createUser():
7. Duplicate email (unique constraint) ❌
8. Invalid email format (validation) ❌
9. Missing required field (NOT NULL) ❌

// For getUserById():
7. Get non-existent user (returns null) ❌
8. Get with invalid ID format ❌

// For deleteUser():
7. Delete non-existent user (P2025) ❌
```

### Category 3: Edge Cases (10%)

**What**: Boundary conditions, unusual inputs

**When to recommend**:

- Maximum/minimum values
- Empty strings vs null
- Special characters
- Large datasets (performance)
- Timing issues (race conditions)

**Examples**:

```typescript
// For createUser():
10. Create user with maximum length name 🔸

// For deleteUser():
10. Delete user with 1000+ orders (performance) 🔸
```

---

## 🚀 ADVANCED TEST CATEGORIES

> **NEW**: When user requests MORE test variety, expand to 15-20 tests per method using these additional categories.

### Category 4: Performance & Scale Tests

**What**: Test with large datasets and concurrent operations

**When to recommend**:

- DELETE operations (test cascade performance)
- READ operations (test query performance)
- BULK operations (test transaction limits)
- Methods with loops or iterations

**Examples**:

```typescript
// For deleteUser():
11. Delete user with 10,000 related orders (performance) 🔸
12. Delete 100 users in parallel (concurrency) 🔸

// For getUsers():
11. Query 50,000 users with pagination 🔸
12. Concurrent reads (10 requests simultaneously) 🔸

// For bulkCreateUsers():
11. Create 1,000 users in single transaction 🔸
12. Create users until transaction limit 🔸
```

### Category 5: Data Integrity Tests

**What**: Test data consistency and correctness

**When to recommend**:

- Methods modifying multiple tables
- Methods with FK relationships
- Methods with calculated/derived fields

**Examples**:

```typescript
// For createOrder():
13. Create order and verify user.orderCount incremented 🔸
14. Create order and verify inventory.stock decremented 🔸

// For deleteUser():
13. Delete user and verify orphaned records SET NULL 🔸
14. Delete user and verify audit log created 🔸

// For updateUserEmail():
13. Update email and verify all related records updated 🔸
14. Update and verify composite unique constraints maintained 🔸
```

### Category 6: State Transition Tests

**What**: Test object lifecycle and state changes

**When to recommend**:

- Methods changing status fields
- Methods with workflow logic
- Methods with state machines

**Examples**:

```typescript
// For cancelOrder():
15. Transition from 'pending' → 'cancelled' ✅
16. Try transition from 'delivered' → 'cancelled' (invalid) ❌
17. Transition and verify side effects (refund created) 🔸

// For activateUser():
15. Transition from 'inactive' → 'active' ✅
16. Transition from 'banned' → 'active' (should fail) ❌
17. Activate and verify email sent 🔸
```

### Category 7: Timing & Race Condition Tests

**What**: Test concurrent operations and timing issues

**When to recommend**:

- Methods modifying shared resources
- Methods with locks or transactions
- Methods with time-based logic

**Examples**:

```typescript
// For reserveInventory():
18. Two users reserve last item simultaneously (race condition) 🔸
19. Reserve item while another deletes it (concurrency) 🔸

// For incrementCounter():
18. 100 concurrent increments (test final value) 🔸

// For expireSession():
18. Test session expiration timing (boundary at exact expiry time) 🔸
```

### Category 8: Boundary Value Tests

**What**: Test min/max/edge values for all fields

**When to recommend**:

- Numeric fields (test min, max, zero, negative)
- String fields (test empty, max length, Unicode)
- Date fields (test past, future, edge dates)

**Examples**:

```typescript
// For createProduct():
19. Create with price = 0 (minimum) 🔸
20. Create with price = 999999.99 (maximum) 🔸
21. Create with negative price (should fail) ❌
22. Create with name = "" (empty string) 🔸
23. Create with name = 255 chars (max length) 🔸
24. Create with Unicode emoji name 🔸

// For scheduleEvent():
19. Schedule for year 1970 (min date) 🔸
20. Schedule for year 2100 (max date) 🔸
21. Schedule for past date (should fail) ❌
```

### Category 9: Null & Optional Field Tests

**What**: Test nullable fields and optional parameters

**When to recommend**:

- Methods with optional parameters
- Tables with nullable columns
- Methods with partial updates

**Examples**:

```typescript
// For updateUser():
25. Update only email (other fields null) ✅
26. Update with null values (set fields to null) 🔸
27. Update with undefined vs null (different behaviors) 🔸

// For createProfile():
25. Create with all optional fields null ✅
26. Create with some optional fields ✅
27. Create and verify null vs empty string 🔸
```

### Category 10: Transaction & Rollback Tests

**What**: Test transactional behavior and rollback scenarios

**When to recommend**:

- Methods using Prisma transactions
- Methods modifying multiple tables
- Methods with complex error handling

**Examples**:

```typescript
// For transferFunds():
28. Transfer succeeds - both accounts updated ✅
29. Transfer fails - both accounts unchanged (rollback) ❌
30. Transfer with insufficient funds (rollback) ❌

// For createOrderWithPayment():
28. Create order and payment in transaction ✅
29. Payment fails - order rolled back ❌
30. Nested transaction success 🔸
```

### Category 11: Complex Query Tests

**What**: Test filtering, sorting, pagination, aggregation

**When to recommend**:

- Methods with query parameters
- Methods with search functionality
- Methods with aggregations (count, sum, avg)

**Examples**:

```typescript
// For searchUsers():
31. Search with single filter ✅
32. Search with multiple filters (AND logic) ✅
33. Search with OR logic ✅
34. Search with sorting (ASC/DESC) ✅
35. Search with pagination (skip/take) ✅
36. Search with no results (empty array) ✅
37. Search with special characters in query 🔸

// For getUserStatistics():
31. Aggregate count of users ✅
32. Aggregate with groupBy (users per role) ✅
33. Aggregate with complex conditions 🔸
```

### Category 12: Cascade Chain Tests

**What**: Test multi-level FK cascades

**When to recommend**:

- DELETE operations with nested relationships
- Methods affecting parent-child-grandchild chains

**Examples**:

```typescript
// For deleteCompany():
38. Delete company → cascades to departments → cascades to employees ✅
39. Delete company with 3-level cascade (company → dept → employee → tasks) 🔸
40. Verify all cascaded records deleted 🔸

// For deleteUser():
38. Delete user → cascades to orders → cascades to order_items ✅
39. Delete user and verify multi-table cascade correctness 🔸
```

---

## 📊 EXPANDED RECOMMENDATION FRAMEWORK

### For High-Complexity Methods (15-20 tests)

When user requests MORE tests or method is complex:

```typescript
interface ExpandedTestSuite {
  happyPath: 6-8 tests;        // 40%
  errors: 4-5 tests;            // 25%
  edgeCases: 2-3 tests;         // 15%
  performance: 2-3 tests;       // 10%
  dataIntegrity: 1-2 tests;     // 5%
  stateTransition: 1-2 tests;   // 5%
  // TOTAL: 16-23 tests
}
```

**Decision Tree**:

```typescript
function determineTestCount(method: Method): number {
  let baseTests = 10;

  // Add performance tests if:
  if (method.affectsMultipleTables || method.hasCascades) {
    baseTests += 2; // Add 2 performance tests
  }

  // Add data integrity tests if:
  if (method.hasCalculatedFields || method.modifiesMultipleTables) {
    baseTests += 2; // Add 2 integrity tests
  }

  // Add state transition tests if:
  if (method.hasStatusField || method.hasWorkflow) {
    baseTests += 2; // Add 2 state tests
  }

  // Add timing tests if:
  if (method.hasLocking || method.isTimeDependent) {
    baseTests += 2; // Add 2 timing tests
  }

  // Add boundary tests if:
  if (method.hasNumericInputs || method.hasStringLimits) {
    baseTests += 2; // Add 2 boundary tests
  }

  return baseTests; // 10-20 tests
}
```

---

## 📊 RECOMMENDATION FRAMEWORK

### For CREATE Operations

```typescript
interface CreateOperationTests {
  happyPath: [
    "Create with minimal required data",
    "Create with all optional fields",
    "Create and verify in database",
    "Create with special characters",
    "Create multiple records sequentially",
    "Create and verify auto-generated fields (ID, timestamps)"
  ];
  errors: [
    "Duplicate unique field (P2010/P2002)",
    "Missing required field (validation)",
    "Invalid field format (validation)",
    "Invalid FK reference (if applicable)"
  ];
  edgeCases: [
    "Create with maximum length values",
    "Create with boundary values (min/max)"
  ];
}
```

### For READ Operations

```typescript
interface ReadOperationTests {
  happyPath: [
    "Read existing record by ID",
    "Read and verify all fields",
    "Read immediately after creation",
    "Read multiple times (idempotent)",
    "Read with filters (if applicable)",
    "Read with sorting/pagination (if applicable)"
  ];
  errors: [
    "Read non-existent record (returns null/empty)",
    "Read with invalid ID format",
    "Read with null ID"
  ];
  edgeCases: ["Read from empty table", "Read with extreme filter values"];
}
```

### For UPDATE Operations

```typescript
interface UpdateOperationTests {
  happyPath: [
    "Update single field",
    "Update multiple fields",
    "Update and verify changes",
    "Update and verify timestamps changed",
    "Update with same values (no-op)",
    "Update multiple records"
  ];
  errors: [
    "Update non-existent record (P2025)",
    "Update to duplicate unique value",
    "Update with invalid data type",
    "Update with invalid FK reference"
  ];
  edgeCases: [
    "Update to null (if nullable)",
    "Update with maximum length value"
  ];
}
```

### For DELETE Operations

```typescript
interface DeleteOperationTests {
  happyPath: [
    "Delete existing record",
    "Delete and verify cannot retrieve after",
    "Delete and verify cascades (if FK CASCADE)",
    "Delete with no related records",
    "Delete multiple records",
    "Delete and verify SET NULL (if applicable)"
  ];
  errors: [
    "Delete non-existent record (P2025)",
    "Delete with invalid ID",
    "Delete restricted by FK (if ON DELETE RESTRICT)"
  ];
  edgeCases: [
    "Delete record with many related records (performance)",
    "Delete and verify multi-level cascades"
  ];
}
```

---

## 🎯 ACTION FILE TEST RECOMMENDATIONS (NEW)

### Action-Specific Test Categories

Action files require different test categories than traditional services:

#### Category 1: Schema Validation Tests (30%)

**What**: Test the adminProcedure schema validation layer

**When to recommend**: All action methods have schema validation

**Examples**:

```typescript
// For createUserAction with CreateUserSchema:
1. Valid input passes schema validation ✅
2. Missing required field fails at schema level ❌
3. Invalid email format fails at schema level ❌
4. Schema-level constraints (min/max length) enforced ❌
5. Schema composition (merge, omit) works correctly ✅

// For updateUserAction with merged schema:
6. ID validation from UserIdSchema works ❌
7. Update data validation from UpdateUserSchema works ✅
8. Schema merge doesn't create conflicts ✅
```

#### Category 2: Service Integration Tests (25%)

**What**: Test the integration between action and service layer

**When to recommend**: All action methods call service methods

**Examples**:

```typescript
// For createUserAction → ctx.svc.createUser:
9. Valid parsedInput passed correctly to service ✅
10. Service method called with correct parameters ✅
11. Service response data extracted correctly ✅
12. Service errors handled/propagated correctly ❌

// For updateUserAction with destructuring:
13. Parameter destructuring works correctly ✅
14. ID and updateData separated correctly ✅
15. Service called with separate parameters ✅
```

#### Category 3: Response Format Tests (20%)

**What**: Test how action methods wrap/format service responses

**When to recommend**: Most actions have specific response formats

**Examples**:

```typescript
// For full wrapper actions (createUserAction, updateUserAction):
16. Response contains result field with service data ✅
17. Response contains success field (boolean) ✅
18. Response contains message field (with fallback) ✅
19. Response contains errors field when applicable ✅
20. Default messages used when service doesn't provide ✅

// For simple wrapper actions (deleteUserAction):
21. Response contains result field only ✅
22. Response contains static success message ✅
```

#### Category 4: Admin Procedure Context Tests (15%)

**What**: Test the adminProcedure wrapper and context setup

**When to recommend**: All actions use adminProcedure

**Examples**:

```typescript
// Context and Infrastructure Tests:
23. Server context created with admin role ✅
24. Service initialized with correct context ✅
25. Database context passed to service correctly ✅
26. Context wrapper doesn't interfere with data ✅
```

#### Category 5: End-to-End Action Tests (10%)

**What**: Test the complete action flow from input to response

**When to recommend**: Verify complete functionality

**Examples**:

```typescript
// Complete Flow Tests:
27. Full success flow: validation → service → response format ✅
28. Full error flow: schema validation → early return ❌
29. Full error flow: service error → wrapped error response ❌
30. Action handles edge cases (optional fields, null values) 🔸
```

### Action File Test Templates

#### Template for CREATE Actions (e.g., createUserAction)

```typescript
const createActionTests = {
  schemaValidation: [
    "Valid user data passes CreateUserSchema validation",
    "Missing required field (email) fails schema validation",
    "Invalid email format fails schema validation",
    "Name too short fails schema validation"
  ],
  serviceIntegration: [
    "Valid parsedInput passed to ctx.svc.createUser",
    "Service called with exact parsedInput object",
    "Service response.data extracted as result",
    "Service response.message used or default applied",
    "Service response.success mapped to success field",
    "Service response.errors mapped to errors field"
  ],
  responseFormat: [
    "Response object has result field with user data",
    "Response object has success boolean field",
    "Response object has message string field",
    "Response object has errors field (array)",
    "Default message used when service.message is empty"
  ],
  contextSetup: [
    "Admin procedure creates correct server context",
    "UserService initialized with admin context",
    "Database context properly passed to service"
  ],
  endToEnd: [
    "Complete successful user creation flow",
    "Schema validation error stops before service call",
    "Service error properly wrapped in response format"
  ]
};
```

#### Template for UPDATE Actions (e.g., updateUserAction)

```typescript
const updateActionTests = {
  schemaValidation: [
    "Valid ID + update data passes merged schema validation",
    "Invalid ID format fails UserIdSchema validation",
    "Invalid update data fails UpdateUserSchema validation",
    "Missing ID fails validation (from UserIdSchema)"
  ],
  serviceIntegration: [
    "Parameter destructuring: { id, ...updateData } works",
    "Service called with updateUser(id, updateData) signature",
    "Separated parameters match service expectations"
  ],
  responseFormat: [
    "Updated user data returned in result field",
    "Success message indicates update operation",
    "Error scenarios return appropriate error format"
  ],
  contextSetup: [
    "Admin context allows user modification",
    "Service receives proper admin context"
  ],
  endToEnd: [
    "Successful user update with partial data",
    "Update with only optional fields",
    "Update failure due to non-existent user ID"
  ]
};
```

#### Template for DELETE Actions (e.g., deleteUserAction)

```typescript
const deleteActionTests = {
  schemaValidation: [
    "Valid user ID passes UserIdActionSchema validation",
    "Invalid ID format fails validation",
    "Missing ID fails validation"
  ],
  serviceIntegration: [
    "Field extraction: parsedInput.userId works correctly",
    "Service called with deleteUser(userId) signature",
    "Service result returned directly"
  ],
  responseFormat: [
    "Simple response format: { result, message }",
    "Static success message included",
    "Service result passed through unchanged"
  ],
  contextSetup: [
    "Admin context allows user deletion",
    "Service receives deletion permissions"
  ],
  endToEnd: [
    "Successful user deletion flow",
    "Non-existent user ID handling",
    "Cascade effects from service layer"
  ]
};
```

### Action File Test Count Guidelines

```typescript
// For Simple Actions (10 tests):
interface SimpleActionTests {
  schemaValidation: 3 tests;    // 30%
  serviceIntegration: 3 tests;  // 30%
  responseFormat: 2 tests;      // 20%
  contextSetup: 1 test;         // 10%
  endToEnd: 1 test;             // 10%
}

// For Complex Actions (15-20 tests):
interface ComplexActionTests {
  schemaValidation: 4-5 tests;    // 25-30%
  serviceIntegration: 4-5 tests;  // 25-30%
  responseFormat: 3-4 tests;      // 20%
  contextSetup: 2 tests;          // 10-15%
  endToEnd: 2-3 tests;            // 15-20%
}

// Complexity indicators for actions:
- Has schema merging (UpdateUserSchema.merge(...)) → +2 tests
- Has parameter destructuring → +1 test
- Has complex response wrapping → +1 test
- Service method has cascades → +2 tests
- Multiple response formats in file → +1 test per format type
```

---

## 💡 INTELLIGENT RECOMMENDATIONS

### Recommendation Engine

```typescript
function recommendTests(
  method: Method,
  context: AnalysisContext
): TestRecommendations {
  const recommendations = [];

  // Analyze operation type
  const operationType = detectOperationType(method); // CREATE, READ, UPDATE, DELETE

  // Analyze database impact
  const dbImpact = analyzeDBImpact(method, context.schema);

  // Analyze FK impact
  const fkImpact = analyzeFKImpact(method, context.fkRelationships);

  // Analyze validation rules
  const validations = extractValidations(method);

  // Analyze constraints
  const constraints = extractConstraints(context.schema);

  // Generate recommendations based on analysis
  if (operationType === "CREATE") {
    recommendations.push(
      ...generateCreateTests(method, validations, constraints)
    );
  }

  if (fkImpact.hasCascades) {
    recommendations.push(...generateCascadeTests(fkImpact));
  }

  if (constraints.hasUnique) {
    recommendations.push(...generateDuplicateTests(constraints.unique));
  }

  // Prioritize by risk
  return prioritizeByRisk(recommendations, fkImpact, dbImpact);
}
```

### Risk-Based Prioritization

```typescript
interface TestPriority {
  HIGH: [
    "Operations with FK cascades (data loss risk)",
    "Operations with unique constraints (duplicate risk)",
    "Operations modifying critical data",
    "Operations with complex validation"
  ];
  MEDIUM: [
    "Standard CRUD operations",
    "Operations with simple validation",
    "Read-only operations with filters"
  ];
  LOW: [
    "Simple read operations",
    "Operations with no side effects",
    "Idempotent operations"
  ];
}
```

---

## 📋 EXAMPLE: UserService Analysis

### Method: `createUser(input: CreateUserInput): Promise<User>`

**Analysis**:

```typescript
{
  operation: "CREATE",
  table: "users",
  constraints: {
    unique: ["email"],
    notNull: ["email", "name"],
    defaults: ["role", "isActive", "createdAt", "updatedAt"]
  },
  validations: {
    email: "format validation (regex)",
    name: "length validation (2-100 chars)"
  },
  fkImpact: {
    isParent: true,
    childTables: ["orders", "user_profiles"]
  },
  customLogic: {
    idGeneration: "usr_[timestamp]_[random]",
    passwordHashing: true
  }
}
```

**Recommendations**:

```typescript
{
  method: "createUser",
  totalTests: 10,
  priority: "HIGH",

  happyPath: [
    {
      id: 1,
      name: "Create user with minimal required data",
      description: "Provide only email, name, password. Verify defaults applied.",
      priority: "HIGH",
      expectedOutcome: "User created with role='user', isActive=true",
      verifications: ["User exists in DB", "ID matches pattern", "Timestamps set"]
    },
    {
      id: 2,
      name: "Create user with all optional fields",
      description: "Provide all fields including role, isActive",
      priority: "MEDIUM",
      expectedOutcome: "User created with provided values",
      verifications: ["All fields match input"]
    },
    {
      id: 3,
      name: "Create user and verify in database",
      description: "Create user, query DB directly to verify",
      priority: "HIGH",
      expectedOutcome: "User data persisted correctly",
      verifications: ["Direct DB query returns user"]
    },
    {
      id: 4,
      name: "Create user with special characters in name",
      description: "Test unicode, accents, emojis in name field",
      priority: "MEDIUM",
      expectedOutcome: "Special characters stored correctly",
      verifications: ["Name retrieved matches input"]
    },
    {
      id: 5,
      name: "Create user and verify ID generation",
      description: "Verify custom ID format: usr_[timestamp]_[random]",
      priority: "HIGH",
      expectedOutcome: "ID matches expected pattern",
      verifications: ["ID starts with 'usr_'", "ID is unique"]
    },
    {
      id: 6,
      name: "Create multiple users sequentially",
      description: "Create 3 users in sequence, verify no conflicts",
      priority: "MEDIUM",
      expectedOutcome: "All 3 users created with unique IDs",
      verifications: ["3 users exist", "All IDs unique"]
    }
  ],

  errorCases: [
    {
      id: 7,
      name: "Duplicate email constraint violation",
      description: "Create user, then try to create another with same email",
      priority: "HIGH",
      expectedOutcome: "Error thrown with 'already exists' message",
      verifications: ["Second user not created", "Error message contains 'email'"],
      errorType: "CONSTRAINT_VIOLATION",
      constraint: "email_unique"
    },
    {
      id: 8,
      name: "Invalid email format",
      description: "Try to create user with email='not-an-email'",
      priority: "HIGH",
      expectedOutcome: "Validation error thrown",
      verifications: ["User not created", "Error message contains 'email format'"],
      errorType: "VALIDATION_ERROR",
      validation: "email_format"
    },
    {
      id: 9,
      name: "Missing required field (name)",
      description: "Try to create user without name field",
      priority: "HIGH",
      expectedOutcome: "Validation error thrown",
      verifications: ["User not created", "Error mentions 'name'"],
      errorType: "VALIDATION_ERROR",
      constraint: "name_not_null"
    }
  ],

  edgeCases: [
    {
      id: 10,
      name: "Create user with maximum length name",
      description: "Name with exactly 100 characters",
      priority: "LOW",
      expectedOutcome: "User created successfully",
      verifications: ["Full name stored", "Name length = 100"],
      reason: "Boundary condition testing"
    }
  ],

  testDataRequirements: {
    uniqueData: ["email"],
    generatePerTest: ["email", "id"],
    reusableData: ["name", "role"]
  },

  setupRequirements: {
    createTable: true,
    cleanupAfter: true
  }
}
```

---

## 🎯 RECOMMENDATION RULES

### Rule 1: Test Count Based on Complexity

**Simple methods** (10 tests):

- 6 happy path (60%)
- 3 error cases (30%)
- 1 edge case (10%)

**Complex methods** (15-20 tests):

- 6-8 happy path (40%)
- 4-5 error cases (25%)
- 2-3 edge cases (15%)
- 2-3 performance tests (10%)
- 1-2 data integrity tests (5%)
- 1-2 additional (state/timing/boundary) (5%)

**Complexity indicators**:

- Has FK cascades → Add performance + cascade chain tests
- Modifies multiple tables → Add data integrity tests
- Has status/workflow → Add state transition tests
- Has locking/concurrency → Add timing/race condition tests
- Has numeric/string limits → Add boundary value tests

### Rule 2: Prioritize by Risk

**HIGH Priority** (test first):

- Operations with FK cascades
- Operations with unique constraints
- Operations modifying critical data
- Concurrent operations (race conditions)
- Multi-table transactions

**MEDIUM Priority**:

- Standard CRUD operations
- Simple validation tests
- Performance tests
- Data integrity tests

**LOW Priority**:

- Read-only operations
- Edge cases without data risk
- Boundary value tests

### Rule 3: Test Constraints Explicitly

For each constraint type:

- **Unique**: Test duplicate insertion + concurrent duplicates
- **NOT NULL**: Test missing field + null vs undefined
- **FK**: Test invalid reference + cascade behavior
- **CHECK**: Test boundary values + out-of-range
- **Composite Unique**: Test all combinations

### Rule 4: Test Cascades Thoroughly

For DELETE operations with FK cascades:

- Test single-level cascade ✅
- Test multi-level cascade (3+ levels) ✅
- Test CASCADE vs SET NULL vs RESTRICT ✅
- Test cascade with large datasets (performance) 🔸
- Test cascade rollback on error 🔸

### Rule 5: Test Validation Logic

For each validation rule:

- Test valid input ✅
- Test invalid input ❌
- Test boundary values 🔸
- Test edge cases (empty, special chars, unicode) 🔸

### Rule 6: Think Creatively About Edge Cases

Don't just test obvious scenarios. Think about:

- **Timing**: What if two operations happen simultaneously?
- **Scale**: What if there are 10,000 related records?
- **State**: What if the record is in an unexpected state?
- **Nullability**: What's the difference between null, undefined, and ""?
- **Transactions**: What if the transaction fails halfway?
- **Cascades**: What if there's a circular dependency?
- **Unicode**: What if the input contains emojis or special characters?
- **Boundaries**: What happens at exactly min/max values?

### Rule 7: Prevent Import Errors

For every test recommendation:

- Use only types that are EXPORTED from service
- Calculate correct relative import paths
- Don't assume @/ path aliases
- Separate infrastructure imports (testInfrastructure vs testHelpers)
- Use `import type { }` for type-only imports

---

## ✅ RECOMMENDATION CHECKLIST

When recommending tests, verify you've included:

**Coverage** (Base)

- [ ] 6+ happy path tests (40-60%)
- [ ] 3+ error case tests (25-30%)
- [ ] 1+ edge case tests (10-15%)
- [ ] Total = 10+ tests (10 for simple, 15-20 for complex)

**Coverage** (Enhanced - for complex methods)

- [ ] 2-3 performance/scale tests (if has cascades or bulk operations)
- [ ] 1-2 data integrity tests (if modifies multiple tables)
- [ ] 1-2 state transition tests (if has status/workflow)
- [ ] 1-2 timing/race condition tests (if concurrent operations)
- [ ] 2-3 boundary value tests (if has numeric/string limits)
- [ ] 1-2 null/optional field tests (if has nullable columns)
- [ ] 1-2 transaction/rollback tests (if uses transactions)
- [ ] 2-3 complex query tests (if has search/filter/aggregation)
- [ ] 1-2 cascade chain tests (if has multi-level cascades)

**Constraint Testing**

- [ ] Unique constraint tests (including concurrent duplicates)
- [ ] NOT NULL constraint tests (null vs undefined)
- [ ] FK constraint tests (if applicable)
- [ ] CHECK constraint tests (if applicable)
- [ ] Composite unique constraint tests (if applicable)

**Operation-Specific**

- [ ] CREATE: test defaults, ID generation, timestamps, special chars, bulk
- [ ] READ: test not found, filters, sorting, pagination, aggregation, empty results
- [ ] UPDATE: test non-existent, changed timestamps, partial updates, null vs undefined
- [ ] DELETE: test not found, cascades, performance with large related datasets

**FK-Specific** (if applicable)

- [ ] Test CASCADE behavior (single-level)
- [ ] Test CASCADE performance (with large datasets)
- [ ] Test SET NULL behavior
- [ ] Test RESTRICT behavior
- [ ] Test multi-level cascades (3+ levels)
- [ ] Test cascade rollback on error

**Validation-Specific**

- [ ] Test each validation rule
- [ ] Test valid inputs
- [ ] Test invalid inputs
- [ ] Test boundary conditions (min/max)
- [ ] Test special characters and Unicode
- [ ] Test empty string vs null

**Import Safety** (NEW)

- [ ] Verify all types are exported from service
- [ ] Calculate correct relative import paths (../../services/)
- [ ] Don't use @/ path aliases
- [ ] Separate testInfrastructure vs testHelpers imports
- [ ] Use `import type { }` for type-only imports
- [ ] Only import types that are USED in tests

---

## 🎯 SUCCESS CRITERIA

Recommendations are complete when:

1. **Every method has appropriate test count**

   - Simple methods: 10 tests
   - Complex methods: 15-20 tests
   - Decision based on complexity indicators

2. **All constraints are tested**

   - Unique, NOT NULL, FK, CHECK constraints
   - Composite constraints
   - Concurrent constraint violations

3. **All FK relationships are tested**

   - Single-level cascades
   - Multi-level cascades (3+ levels)
   - CASCADE, SET NULL, RESTRICT behaviors
   - Cascade performance with large datasets

4. **All validation rules are tested**

   - Valid inputs
   - Invalid inputs
   - Boundary values
   - Special characters and Unicode

5. **Tests are prioritized by risk**

   - HIGH: cascades, concurrency, multi-table
   - MEDIUM: standard CRUD, validations
   - LOW: read-only, simple edge cases

6. **Test data requirements are specified**

   - Unique fields identified
   - Generated vs reusable data
   - Setup/cleanup requirements

7. **Import safety verified** (NEW)

   - All types are exported
   - Correct relative paths calculated
   - No @/ aliases used
   - Type-only imports specified

8. **Creative edge cases included** (NEW)
   - Timing/race conditions considered
   - Scale/performance scenarios included
   - State transitions tested
   - Null vs undefined vs empty string tested

---

## 📚 NEXT STEPS

After completing test recommendations:

1. **Move to Skill 7**: Test Plan Generation
   - Compile all recommendations into structured plan
   - Add setup/teardown requirements
   - Create coverage matrix

---

**File**: test-scenario-recommendation.md  
**Skill**: 5  
**Status**: Production-Ready  
**Purpose**: Generate intelligent test recommendations based on deep analysis
