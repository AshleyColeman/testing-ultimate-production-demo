# 🚀 ANALYSIS AGENT — QUICK REFERENCE (Enhanced)

## 📊 SKILL OVERVIEW

| Skill # | Name                                 | Status      | Purpose                                                 |
| ------- | ------------------------------------ | ----------- | ------------------------------------------------------- |
| **1**   | Service Code Analysis                | ✅ Ready    | Analyze service structure, methods, dependencies        |
| **2**   | Prisma Schema Deep Analysis          | ✅ Ready    | Parse Prisma schema for models, relationships, cascades |
| **3**   | Foreign Key Analysis                 | ✅ Ready    | Map FK relationships, cascades, dependencies            |
| **5**   | Test Scenario Recommendation         | ✅ Enhanced | Generate 10-20 tests per method with 12 categories      |
| **8**   | Import & TypeScript Error Prevention | ✅ Ready    | Prevent import errors and type issues                   |
| **9**   | Creative Edge Case Detection         | ✅ Ready    | Think creatively about unusual scenarios                |

---

## 🎯 WHEN TO USE EACH SKILL

### Skill 1: Service Code Analysis

**Use when**: Starting any analysis  
**Triggers**: "analyze service", "understand methods"  
**Output**: Service structure, methods, parameters, dependencies

### Skill 2: Prisma Schema Deep Analysis ⭐ NEW

**Use when**: Service uses Prisma ORM  
**Triggers**: "understand Prisma", "analyze schema", "relationship mapping"  
**Output**: Complete model structure, relationships (1:1, 1:N, N:M), cascades, validations

### Skill 3: Foreign Key Analysis

**Use when**: Understanding table relationships  
**Triggers**: "FK relationships", "cascades", "dependencies"  
**Output**: FK map, dependency graph, cascade chains

### Skill 5: Test Scenario Recommendation ⭐ ENHANCED

**Use when**: Creating test recommendations  
**Triggers**: "recommend tests", "what to test"  
**Output**: 10-20 tests per method with happy path, errors, edge cases, performance, integrity

### Skill 8: Import & TypeScript Error Prevention ⭐ NEW

**Use when**: Before generating test recommendations  
**Triggers**: "prevent import errors", "verify types"  
**Output**: Correct import statements, exported types, relative paths

### Skill 9: Creative Edge Case Detection ⭐ NEW

**Use when**: Looking for hidden edge cases  
**Triggers**: "think creatively", "unusual scenarios"  
**Output**: Race conditions, timing issues, data corruption scenarios, unicode edge cases

---

## 📋 ANALYSIS WORKFLOW (6 PHASES)

```
Phase 1: Initial Service Scan
├─ Use Skill 1: Service Code Analysis
└─ Identify: service name, methods, database pattern

Phase 2: Database Schema Analysis
├─ Use Skill 2: Prisma Schema Deep Analysis (if Prisma)
└─ Extract: models, fields, relationships, constraints

Phase 3: Foreign Key Discovery
├─ Use Skill 3: Foreign Key Analysis
└─ Map: relationships, cascades, dependency graph

Phase 4: Method-by-Method Analysis
├─ Use Skill 1: Analyze each method
└─ Identify: parameters, operations, validations, errors

Phase 5: Test Scenario Recommendation
├─ Use Skill 5: Generate test recommendations (10-20 per method)
├─ Use Skill 8: Validate imports and types
└─ Use Skill 9: Add creative edge cases

Phase 6: Test Plan Generation
└─ Compile all analyses into actionable test plan
```

---

## 🔥 TEST CATEGORIES (12 TYPES)

### Standard Tests (Always Include)

1. **Happy Path** (6-8 tests) — Normal successful operations
2. **Error Cases** (4-5 tests) — Validation, constraints, not found
3. **Edge Cases** (2-3 tests) — Boundary conditions

### Enhanced Tests (For Complex Methods)

4. **Performance** (2-3 tests) — Large datasets (10,000+ records), concurrency
5. **Data Integrity** (1-2 tests) — Multi-table consistency, calculated fields
6. **State Transition** (1-2 tests) — Status workflows, invalid transitions
7. **Timing/Race Conditions** (1-2 tests) — Concurrent operations, timing boundaries
8. **Boundary Values** (2-3 tests) — Min/max, zero, negative, extremely long
9. **Null/Optional** (1-2 tests) — Null vs undefined vs empty string
10. **Transaction/Rollback** (1-2 tests) — Transaction failure, rollback verification
11. **Complex Queries** (2-3 tests) — Filtering, sorting, pagination, aggregation
12. **Cascade Chains** (1-2 tests) — Multi-level cascades (3-5 levels), circular refs

---

## 💡 COMPLEXITY DECISION TREE

### Simple Method (10 tests)

```
✓ Single table operation
✓ No cascades
✓ Simple validation
✓ No concurrency concerns

→ 6 happy path
→ 3 errors
→ 1 edge case
```

### Complex Method (15-20 tests)

```
✓ Multiple tables
✓ FK cascades
✓ Status/workflow
✓ Concurrency concerns
✓ Large datasets

→ 6-8 happy path
→ 4-5 errors
→ 2-3 edge cases
→ 2-3 performance
→ 1-2 data integrity
→ 1-2 creative
```

---

## 🎨 CREATIVE THINKING FRAMEWORK

Ask these 8 questions for EVERY method:

1. **What if TWO things happen at the SAME TIME?**

   - Race conditions
   - Concurrent operations
   - Resource conflicts

2. **What if data is in an UNEXPECTED STATE?**

   - Null status
   - Orphaned records
   - Corrupted data
   - Circular dependencies

3. **What if there's TOO MUCH data?**

   - 10,000+ related records
   - Deep cascade chains (5+ levels)
   - Transaction timeouts
   - Performance degradation

4. **What if the input is WEIRD?**

   - Emoji-only names 🚀💻
   - SQL injection attempts
   - XSS attempts
   - 10,000 character strings
   - Unicode (中文, العربية)

5. **What if there's a CIRCULAR DEPENDENCY?**

   - Self-referencing FKs
   - A → B → A relationships
   - Infinite cascade loops

6. **What if TIMING matters?**

   - Expiration at exact boundary
   - Daylight saving transitions
   - Leap seconds
   - Clock skew

7. **What if TRANSACTION fails HALFWAY?**

   - Rollback verification
   - Partial commits
   - Deadlocks
   - Network errors

8. **What if NULL, UNDEFINED, and EMPTY STRING are different?**
   - `{ name: null }` vs `{ name: undefined }` vs `{ name: "" }`
   - Different behaviors for each

---

## 🚨 IMPORT ERROR PREVENTION CHECKLIST

Before recommending tests, verify:

- [ ] Only import types that are EXPORTED from service
- [ ] Calculate correct relative paths (no @/ aliases)
- [ ] Use `../../services/` for service imports (from test file)
- [ ] Use `../shared/` for infrastructure imports
- [ ] Separate testInfrastructure vs testHelpers
- [ ] Use `import type { }` for type-only imports
- [ ] Verify export pattern (named, default, re-export)

**Common Mistakes to Avoid**:

```typescript
// ❌ WRONG
import { User } from "../../services/UserService"; // Not exported!
import { userService } from "@/services/UserService"; // Path alias!
import { recordTestExecution } from "../shared/testHelpers"; // Wrong file!

// ✅ CORRECT
import { userService } from "../../services/UserService"; // Relative path
import type { CreateUserInput } from "../../services/UserService"; // Exported type
import { recordTestExecution } from "../shared/testInfrastructure"; // Correct file
```

---

## 📊 PRISMA ANALYSIS CHECKLIST

When analyzing Prisma schema:

- [ ] Extract all models with fields
- [ ] Identify field types (String, Int, DateTime, etc.)
- [ ] Map required vs optional fields
- [ ] Find unique constraints (@unique, @@unique)
- [ ] Find default values (@default)
- [ ] Map 1:1 relationships
- [ ] Map 1:N relationships
- [ ] Map N:M relationships (implicit and explicit)
- [ ] Extract cascade behaviors (onDelete, onUpdate)
- [ ] Identify enums and their values
- [ ] Find indexes (@@index)
- [ ] Extract @updatedAt auto-update fields
- [ ] Note composite IDs (@@id)

---

## 🎯 OUTPUT FORMAT

### For Each Method Analyzed

```markdown
## Method: createUser(input: CreateUserInput): Promise<User>

**Operation Type**: CREATE
**Database Table**: users
**Complexity**: COMPLEX (has FK relationships, validation)

### Database Analysis

- Table: users
- Constraints: email UNIQUE, name NOT NULL
- FK Relationships: 1:N with orders (CASCADE), 1:1 with profile (SET NULL)
- Validation: email format, name length 2-100

### Recommended Tests (18 total)

#### Happy Path (8 tests)

1. Create user with minimal required data
2. Create user with all optional fields
3. Create user and verify in database
4. Create user with special characters in name
5. Create multiple users sequentially
6. Create user and verify ID generation
7. Create user and verify timestamps
8. Create user with nested profile creation

#### Error Cases (5 tests)

9. Duplicate email (unique constraint)
10. Invalid email format (validation)
11. Missing required field (NOT NULL)
12. Name too short (validation)
13. Name too long (validation)

#### Edge Cases (3 tests)

14. Create user with maximum length name
15. Create user with emoji in name 🚀
16. Create user with Unicode characters 中文

#### Performance (2 tests)

17. Create 1,000 users in single transaction
18. Create users concurrently (100 simultaneous)

### Import Recommendations

\`\`\`typescript
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { userService } from "../../services/UserService";
import type { CreateUserInput } from "../../services/UserService";
import { getInfrastructure, recordTestExecution } from "../shared/testInfrastructure";
\`\`\`

### Creative Edge Cases

- What if two users try to register with same email simultaneously?
- What if user is created while another request deletes the email domain?
- What if name contains SQL injection attempt?
```

---

## ✅ SUCCESS CRITERIA

Analysis is complete when:

1. **Service fully understood**

   - All methods analyzed
   - All dependencies mapped
   - All database operations identified

2. **Database schema complete**

   - All tables extracted
   - All relationships mapped (1:1, 1:N, N:M)
   - All constraints identified
   - All cascades understood

3. **Test recommendations thorough**

   - 10-20 tests per method
   - All 12 test categories considered
   - Creative edge cases included
   - Import safety verified

4. **Output actionable**
   - Test plan ready for Integration Agent
   - No ambiguity in recommendations
   - Exact import statements provided
   - Priority levels assigned

---

## 🚀 QUICK START EXAMPLES

### Example 1: Analyze Simple Service

```
User: "Analyze UserService and recommend tests"

Agent:
1. Use Skill 1: Read service file
2. Use Skill 2: Parse Prisma schema
3. Use Skill 3: Map FK relationships
4. Use Skill 5: Generate 10 tests per method
5. Use Skill 8: Validate imports
6. Output: Test plan with correct imports
```

### Example 2: Analyze Complex Service with Cascades

```
User: "Analyze OrderService - it has lots of relationships"

Agent:
1. Use Skill 1: Read service file
2. Use Skill 2: Parse Prisma schema (Order, OrderItem, Payment, etc.)
3. Use Skill 3: Map FK cascades (Order → OrderItem → Inventory)
4. Use Skill 5: Generate 18 tests per method (complex)
5. Use Skill 9: Add creative edge cases (race conditions, large orders)
6. Use Skill 8: Validate imports
7. Output: Comprehensive test plan with performance tests
```

### Example 3: Focus on Creative Testing

```
User: "Think creatively about deleteUser() - what could go wrong?"

Agent:
1. Use Skill 9: Creative Edge Case Detection
2. Ask: What if user has 50,000 orders? (performance)
3. Ask: What if user is being deleted while order is being created? (race condition)
4. Ask: What if user is their own referrer? (circular dependency)
5. Ask: What if transaction fails after deleting user? (rollback)
6. Output: 12 creative edge cases beyond obvious tests
```

---

## 📚 RELATED DOCUMENTATION

- **Master File**: `ANALYSIS_AGENT_MASTER.md` — Complete instructions
- **Enhancement Summary**: `ENHANCEMENT_SUMMARY.md` — What's new in Phase 2
- **Skill Files**: `skills/` directory — Detailed skill documentation
- **Review**: `REVIEW_AND_IMPROVEMENTS.md` — Quality assessment (9.6/10)

---

**Version**: Enhanced (Phase 2)  
**Status**: Production-Ready 🎯  
**Last Updated**: Enhancement Phase 2  
**Skill Count**: 6 core skills ✅
