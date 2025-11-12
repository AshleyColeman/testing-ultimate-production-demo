# Skill 9: TEST PLAN DOCUMENT STRUCTURE

## 📋 PURPOSE

Create structured, comprehensive test plan documents that the Integration Test Agent can easily consume and implement.

**Goal**: Format analysis output in a clear, actionable structure ready for test implementation.

---

## 🎯 WHEN TO USE

- After completing all analysis (service, schema, FK, methods)
- After generating test recommendations
- Before handing off to Integration Test Agent
- Final step of analysis workflow

---

## ⚡ QUICK START

```markdown
# Test Plan: [ServiceName]

## Service Overview

[What the service does]

## Database Schema

[Tables, relationships, constraints]

## Method Analysis

[For each method: analysis + test scenarios]

## Import Recommendations

[Exact import statements]

## Test Summary

[Total tests, priorities, coverage]
```

---

## 📐 STANDARD TEST PLAN TEMPLATE

### Section 1: Header & Metadata

```markdown
# 🧪 TEST PLAN: [ServiceName]

**Service File**: `src/services/[ServiceName].ts`
**Analysis Date**: [Date]
**Total Methods Analyzed**: [Number]
**Total Tests Recommended**: [Number]
**Estimated Complexity**: Simple | Medium | Complex
**Ready for Integration Agent**: ✅ Yes

---
```

### Section 2: Service Overview

```markdown
## 📊 SERVICE OVERVIEW

**Purpose**: [Brief description of what this service does]

**Database Pattern**: Prisma ORM | Raw SQL | Mixed | Other ORM

**Primary Tables**: [table1, table2, table3]

**Key Dependencies**:

- [dependency1] - [purpose]
- [dependency2] - [purpose]

**Business Logic Summary**:

- [Key operation 1]
- [Key operation 2]
- [Key operation 3]

---
```

### Section 3: Database Schema Analysis

```markdown
## 🗄️ DATABASE SCHEMA

### Tables Used

#### Table: `users`

| Column    | Type     | Constraints      | Default | Notes                  |
| --------- | -------- | ---------------- | ------- | ---------------------- |
| id        | String   | PK, NOT NULL     | cuid()  | Auto-generated         |
| email     | String   | UNIQUE, NOT NULL | -       | Must be valid email    |
| name      | String   | NOT NULL         | -       | 2-100 chars            |
| role      | String   | NOT NULL         | 'user'  | Enum: user, admin      |
| isActive  | Boolean  | NOT NULL         | true    | Account status         |
| createdAt | DateTime | NOT NULL         | now()   | Auto-set on create     |
| updatedAt | DateTime | NOT NULL         | now()   | Auto-updated on change |

**Indexes**:

- Primary: id
- Unique: email

**Validation Rules**:

- email: Must match email regex
- name: Length between 2 and 100 characters
- role: Must be 'user' or 'admin'

---
```

### Section 4: Foreign Key Relationships

```markdown
## 🔗 FOREIGN KEY RELATIONSHIPS

### FK Map
```

Company (1) ──→ (N) Department
└─ onDelete: CASCADE
└─ onUpdate: CASCADE

Department (1) ──→ (N) Employee
└─ onDelete: CASCADE
└─ onUpdate: CASCADE

Employee (1) ──→ (N) Task
└─ onDelete: SET NULL
└─ onUpdate: CASCADE

User (1) ──→ (N) Order
└─ onDelete: RESTRICT
└─ onUpdate: CASCADE

```

### Cascade Chains

**High Risk** (multi-level cascades):
- Delete Company → Cascades to Department → Cascades to Employee
- Delete User → Restricted by Order (cannot delete if orders exist)

**Medium Risk**:
- Delete Department → Cascades to Employee
- Delete Employee → Sets Task.employeeId to NULL

### Critical Test Scenarios

1. **Test CASCADE behavior**: Delete parent, verify children deleted
2. **Test RESTRICT behavior**: Delete parent with children, verify error
3. **Test SET NULL behavior**: Delete parent, verify child FK set to null
4. **Test multi-level cascades**: Delete Company, verify 3-level cascade

---
```

### Section 5: Method-by-Method Analysis

```markdown
## 🎯 METHOD ANALYSIS

### Method 1: `createUser(input: CreateUserInput): Promise<User>`

**Operation Type**: CREATE
**Database Tables**: users
**Complexity**: MEDIUM

#### Method Details

- **Parameters**:
  - `input: CreateUserInput` - { email, name, password, role? }
- **Return Type**: `Promise<User>`
- **Database Operations**:
  1. Check if email exists (findUnique)
  2. Hash password with bcrypt
  3. Create user record (create)
  4. Return created user
- **Validation**:
  - Email format validation
  - Name length validation (2-100)
  - Password strength check
- **Error Scenarios**:
  - Duplicate email (unique constraint)
  - Invalid email format
  - Name too short/long
  - Weak password
- **Side Effects**:
  - Triggers createdAt/updatedAt auto-fields
  - Generates custom ID: usr*[timestamp]*[random]

#### Recommended Tests (18 total)

**Happy Path** (8 tests):

1. **[Test 1/18] Create user with minimal required data**

   - Input: `{ email: "test@example.com", name: "Test User", password: "SecurePass123!" }`
   - Expected: User created with default role='user', isActive=true
   - Verify: User exists in DB, ID matches pattern `usr_*`, timestamps set

2. **[Test 2/18] Create user with all optional fields**

   - Input: `{ email: "admin@example.com", name: "Admin", password: "Pass123!", role: "admin" }`
   - Expected: User created with specified role
   - Verify: All fields match input

3. **[Test 3/18] Create user and verify in database**

   - Input: Valid user data
   - Expected: User created successfully
   - Verify: Direct DB query returns user with correct data

4. **[Test 4/18] Create user with special characters in name**

   - Input: `{ name: "Test-User.Name'Apostrophe" }`
   - Expected: Special characters stored correctly
   - Verify: Name retrieved matches input exactly

5. **[Test 5/18] Create multiple users sequentially**

   - Input: 3 different users
   - Expected: All 3 created with unique IDs
   - Verify: 3 users exist, all IDs unique

6. **[Test 6/18] Create user and verify ID generation**

   - Input: Valid user data
   - Expected: Custom ID format: `usr_[timestamp]_[random]`
   - Verify: ID starts with 'usr\_', ID is unique

7. **[Test 7/18] Create user and verify timestamps**

   - Input: Valid user data
   - Expected: createdAt and updatedAt auto-set
   - Verify: Both timestamps are recent (within 1 second)

8. **[Test 8/18] Create user and verify password hashing**
   - Input: `{ password: "PlainTextPassword" }`
   - Expected: Password is hashed, not stored as plain text
   - Verify: Retrieved password is hashed (bcrypt format)

**Error Cases** (5 tests):

9. **[Test 9/18] Duplicate email constraint violation**

   - Input: Create user, then try same email again
   - Expected: Error thrown with message about duplicate email
   - Verify: Second user NOT created, error code P2002 or similar

10. **[Test 10/18] Invalid email format**

    - Input: `{ email: "not-an-email" }`
    - Expected: Validation error thrown
    - Verify: User NOT created, error message mentions email format

11. **[Test 11/18] Missing required field (name)**

    - Input: `{ email: "test@example.com", password: "Pass123!" }` (no name)
    - Expected: Validation error thrown
    - Verify: User NOT created, error mentions required field 'name'

12. **[Test 12/18] Name too short**

    - Input: `{ name: "A" }` (less than 2 chars)
    - Expected: Validation error
    - Verify: User NOT created, error mentions name length

13. **[Test 13/18] Name too long**
    - Input: `{ name: "A".repeat(101) }` (more than 100 chars)
    - Expected: Validation error
    - Verify: User NOT created, error mentions name length

**Edge Cases** (3 tests):

14. **[Test 14/18] Create user with exact name length boundaries**

    - Input: Name with exactly 2 chars, then exactly 100 chars
    - Expected: Both succeed
    - Verify: Both users created successfully

15. **[Test 15/18] Create user with emoji in name**

    - Input: `{ name: "Test User 🚀💻" }`
    - Expected: Emoji stored and retrieved correctly
    - Verify: Name with emoji matches exactly

16. **[Test 16/18] Create user with Unicode characters**
    - Input: `{ name: "测试用户" }` (Chinese), `{ name: "مستخدم اختبار" }` (Arabic)
    - Expected: Unicode stored correctly
    - Verify: Names retrieved match input

**Performance** (2 tests):

17. **[Test 17/18] Create 100 users in sequence**

    - Input: 100 different users
    - Expected: All created within reasonable time (< 10 seconds)
    - Verify: 100 users exist, measure total time

18. **[Test 18/18] Create users concurrently (10 simultaneous)**
    - Input: 10 users created in parallel
    - Expected: All 10 created, no conflicts
    - Verify: 10 users exist, all have unique IDs and emails

---

### Method 2: `updateUser(id: string, updates: UpdateUserInput): Promise<User>`

[Similar detailed structure for each method...]

---
```

### Section 6: Import Recommendations

```markdown
## 📦 IMPORT RECOMMENDATIONS

### For Test File: `src/__tests__/microservices/user-service.test.ts`

#### Required Imports

**Vitest Framework**:
\`\`\`typescript
import { describe, it, expect, beforeAll, afterAll } from "vitest";
\`\`\`

**Service Under Test**:
\`\`\`typescript
// Go UP 2 levels (**tests**/microservices → src), then into services
import { userService } from "../../services/UserService";
\`\`\`

**Type Imports** (Type-only):
\`\`\`typescript
import type { CreateUserInput, UpdateUserInput } from "../../services/UserService";
\`\`\`
**Note**: Only import types that are EXPORTED and USED in tests.

**Test Infrastructure**:
\`\`\`typescript
// Go UP 1 level (microservices → **tests**), then into shared
import {
getInfrastructure,
getSchemasByService,
recordTestExecution,
} from "../shared/testInfrastructure";
\`\`\`

**Test Helpers** (if needed):
\`\`\`typescript
import { simulateProductionOperation } from "../shared/testHelpers";
\`\`\`

#### Import Validation

✅ **All imports use RELATIVE PATHS** (no @/ aliases)
✅ **All types are EXPORTED** from service
✅ **Correct file sources** (testInfrastructure vs testHelpers)
✅ **Type-only imports** use `import type { }`

---
```

### Section 7: Test Summary

```markdown
## 📊 TEST SUMMARY

### Coverage Statistics

- **Total Methods**: 5
- **Total Tests**: 78
- **Average Tests Per Method**: 15.6

### Test Distribution

| Test Type   | Count | Percentage |
| ----------- | ----- | ---------- |
| Happy Path  | 40    | 51%        |
| Error Cases | 23    | 29%        |
| Edge Cases  | 10    | 13%        |
| Performance | 5     | 6%         |

### Priority Breakdown

| Priority | Count | Methods                                     |
| -------- | ----- | ------------------------------------------- |
| HIGH     | 3     | deleteUser (cascades), updateEmail (unique) |
| MEDIUM   | 2     | createUser, updateUser                      |
| LOW      | 0     | -                                           |

### Risk Assessment

**High Risk Operations**:

- `deleteUser()` - Has FK cascades to orders and profiles
- `updateEmail()` - Unique constraint, must check for duplicates

**Medium Risk Operations**:

- `createUser()` - Multiple validations, unique email
- `updateUser()` - Partial updates, validation

**Low Risk Operations**:

- `getUserById()` - Simple read operation

### Test Data Requirements

**Unique Data Per Test**:

- Email addresses (must be unique)
- User IDs (auto-generated)

**Reusable Data**:

- Names
- Roles
- Passwords

**Setup Requirements**:

- Clean database before tests
- Seed data for FK tests (if testing relationships)

### Coverage Matrix

| Method      | Happy Path | Errors | Edge Cases | Performance | Total  |
| ----------- | ---------- | ------ | ---------- | ----------- | ------ |
| createUser  | 8          | 5      | 3          | 2           | 18     |
| getUserById | 4          | 2      | 1          | 0           | 7      |
| updateUser  | 6          | 4      | 2          | 1           | 13     |
| deleteUser  | 7          | 3      | 3          | 2           | 15     |
| listUsers   | 10         | 3      | 2          | 0           | 15     |
| **TOTAL**   | **35**     | **17** | **11**     | **5**       | **68** |

---
```

### Section 8: Integration Agent Handoff

```markdown
## 🤝 INTEGRATION AGENT HANDOFF

### What Integration Agent Needs

This test plan provides:

✅ **Complete method analysis** for each method to test
✅ **Exact test scenarios** with inputs and expected outputs
✅ **Import statements** verified for correctness
✅ **Test data requirements** specified
✅ **Database schema** with all constraints
✅ **FK relationships** mapped with cascade behavior

### Integration Agent Should:

1. Read this test plan document
2. For each method:
   - Implement the recommended test scenarios
   - Use the provided import statements
   - Follow the test structure (Happy Path → Errors → Edge Cases)
   - Generate conflict-free test data
3. Create test file at: `src/__tests__/microservices/user-service.test.ts`
4. Follow 10-tests-per-file structure (or more if complex)
5. Use infrastructure: `getInfrastructure()`, `getSchemasByService()`
6. Record test execution: `recordTestExecution()`

### Compatibility Notes

- All imports verified to work with Integration Agent's structure
- Test file location follows Integration Agent's pattern
- Infrastructure usage matches Integration Agent's expectations
- No TypeScript or import errors expected

---
```

### Section 9: Additional Notes

```markdown
## 📝 ADDITIONAL NOTES & RECOMMENDATIONS

### Critical Considerations

1. **Email Uniqueness**: Always generate unique emails per test to avoid conflicts
2. **Password Hashing**: Service hashes passwords, don't test plain text storage
3. **Cascade Testing**: deleteUser() has cascades - test with related data
4. **Custom ID Format**: Verify ID pattern `usr_[timestamp]_[random]`

### Performance Considerations

- User creation with password hashing takes ~50-200ms (bcrypt)
- Bulk operations (100+ users) should complete in < 10 seconds
- Concurrent operations need unique data to avoid conflicts

### Future Enhancements

- Add tests for user authentication flow
- Add tests for role-based permissions
- Add tests for account activation/deactivation
- Add tests for user search and filtering

---
```

---

## ✅ SUCCESS CRITERIA

Test plan document is complete when it includes:

1. **Header with metadata** (service name, date, complexity)
2. **Service overview** (purpose, pattern, dependencies)
3. **Database schema** (tables, columns, constraints, indexes)
4. **FK relationships** (map, cascade chains, critical scenarios)
5. **Method-by-method analysis** (for each method: details + 10-20 tests)
6. **Import recommendations** (exact import statements, validated)
7. **Test summary** (statistics, distribution, priorities, coverage matrix)
8. **Integration Agent handoff** (what's provided, what to do, compatibility)
9. **Additional notes** (critical considerations, performance, future work)

---

## 💡 TEMPLATE USAGE

```markdown
1. Copy template structure above
2. Fill in [bracketed placeholders] with actual data
3. For each method, create detailed test scenarios
4. Verify all imports are correct
5. Ensure Integration Agent can consume document easily
6. Review for completeness against success criteria
```

---

**File**: test-plan-document-structure.md  
**Skill**: 9  
**Status**: Production-Ready  
**Purpose**: Structure analysis output for Integration Agent consumption
