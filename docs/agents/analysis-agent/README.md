# 🔍 ANALYSIS AGENT

**Deeply understand services → Intelligently recommend tests → Create actionable plans**

---

## 📖 WHAT IS THIS?

The **Analysis Agent** is an AI assistant that:

1. **Reads your service files** (e.g., `UserService.ts`)
2. **Analyzes deeply**:
   - What methods exist
   - What database tables are used
   - What foreign key relationships exist
   - What constraints and validation rules apply
3. **Thinks critically**: What could go wrong? What needs testing?
4. **Creates a comprehensive test plan** with specific test scenarios

**You don't write test code** - this agent creates the PLAN for another agent to implement.

---

## 🚀 QUICK START

### For Users

```bash
# Step 1: Give the Analysis Agent your service file
"Analyze src/services/UserService.ts and create a test plan"

# Step 2: Agent analyzes service deeply
# - Reads all methods
# - Extracts database schema
# - Maps FK relationships
# - Recommends 10+ test scenarios per method

# Step 3: Agent outputs a comprehensive test plan
# Test Plan: UserService
# - Method: createUser → 10 tests recommended
# - Method: getUserById → 10 tests recommended
# - Method: deleteUser → 10 tests recommended (HIGH PRIORITY due to cascades)

# Step 4: Give test plan to Integration Test Agent
"Use this test plan to generate tests for UserService"

# Step 5: Integration Test Agent implements all tests
# ✅ Production-ready tests generated
```

### For Agents

```
1. Read ANALYSIS_AGENT_MASTER.md (your instruction manual)
2. User gives you a service file path
3. You analyze:
   - Service structure (methods, parameters, returns)
   - Database schema (tables, columns, constraints)
   - FK relationships (cascades, dependencies)
   - Validation rules (what can go wrong)
4. You recommend:
   - 10+ test scenarios per method
   - Happy path tests (6-7)
   - Error case tests (3-4)
   - Edge case tests (1-2)
5. You create:
   - Comprehensive test plan document
   - Coverage matrix
   - Setup/teardown requirements
6. User takes your plan to Integration Test Agent
```

---

## 📁 PROJECT STRUCTURE

```
docs/agents/analysis-agent/
  ├── ANALYSIS_AGENT_MASTER.md       ← START HERE - Complete guide
  ├── README.md                       ← This file - Overview
  └── skills/
      ├── service-code-analysis.md         ← Skill 1: Analyze service structure
      ├── database-schema-detection.md     ← Skill 2: Extract DB schema (TODO)
      ├── foreign-key-analysis.md          ← Skill 3: Map FK relationships
      ├── method-operation-mapping.md      ← Skill 4: Analyze method operations (TODO)
      ├── test-scenario-recommendation.md  ← Skill 5: Recommend test scenarios
      ├── risk-assessment.md               ← Skill 6: Assess operation risks (TODO)
      └── test-plan-generation.md          ← Skill 7: Create test plans (TODO)
```

---

## 🎯 WHAT THE ANALYSIS AGENT DOES

### Input

```typescript
// User provides:
{
  serviceFile: "src/services/UserService.ts",
  analysisDepth: "comprehensive" | "basic",
  focusAreas: ["FK relationships", "cascade behaviors", "constraints"]
}
```

### Processing

```
Phase 1: Service Code Analysis
  → Read entire service file
  → Extract all methods (public + private)
  → Identify database pattern (Prisma/SQL/ORM)
  → List dependencies

Phase 2: Database Schema Detection
  → Extract table structures from code
  → Identify columns, types, constraints
  → Note primary keys, unique constraints
  → Find default values

Phase 3: Foreign Key Analysis
  → Map all FK relationships
  → Identify cascade behaviors (CASCADE/SET NULL/RESTRICT)
  → Create dependency graph
  → Assess multi-level cascade risks

Phase 4: Method Operation Mapping
  → Analyze each method's DB operations
  → Identify CRUD patterns
  → Extract validation rules
  → List error scenarios

Phase 5: Test Scenario Recommendation
  → Recommend happy path tests (6-7 per method)
  → Recommend error case tests (3-4 per method)
  → Recommend edge case tests (1-2 per method)
  → Prioritize by risk (HIGH/MEDIUM/LOW)

Phase 6: Risk Assessment
  → Identify high-risk operations
  → Assess cascade impacts
  → Evaluate data loss scenarios
  → Recommend test coverage levels

Phase 7: Test Plan Generation
  → Compile all analysis into structured document
  → Create test coverage matrix
  → Specify test data requirements
  → Document setup/teardown needs
```

### Output

```markdown
# 🔍 SERVICE ANALYSIS REPORT: UserService

## SERVICE OVERVIEW

- Purpose: Manages user CRUD operations
- Methods: 4 (createUser, getUserById, updateUser, deleteUser)
- Pattern: Raw SQL
- Risk Level: HIGH (cascading deletes)

## DATABASE SCHEMA

### Table: users

- id VARCHAR(255) PRIMARY KEY
- email VARCHAR(255) UNIQUE NOT NULL
- name VARCHAR(255) NOT NULL
- ...

## FOREIGN KEY RELATIONSHIPS

users (1) ──── (N) orders
└─ ON DELETE CASCADE (HIGH RISK)

users (1) ──── (N) audit_logs
└─ ON DELETE SET NULL (MEDIUM RISK)

## METHOD ANALYSIS

### createUser(input: CreateUserInput): Promise<User>

**Recommended Tests** (10 total):

1. ✅ Create with valid data
2. ✅ Create with optional fields
3. ✅ Verify ID generation
   ...
4. ❌ Duplicate email (unique constraint)
5. ❌ Invalid email format
6. ❌ Missing required field
7. 🔸 Maximum length name

### deleteUser(id: string): Promise<void>

**⚠️ HIGH PRIORITY** (CASCADE deletes)
**Recommended Tests** (10 total):

1. ✅ Delete and verify cascades to orders
2. ✅ Delete and verify cascades to order_items
3. ✅ Delete and verify audit_logs preserved (SET NULL)
   ...

## TEST COVERAGE MATRIX

| Method     | Happy Path | Errors | Edge Cases | Total  | Priority |
| ---------- | ---------- | ------ | ---------- | ------ | -------- |
| createUser | 6          | 3      | 1          | 10     | HIGH     |
| deleteUser | 6          | 3      | 1          | 10     | HIGH     |
| **TOTAL**  | **24**     | **12** | **4**      | **40** | -        |

## RISK ASSESSMENT

**High-Risk Operations**:

1. deleteUser - Cascades to 3+ tables (test thoroughly)

## TEST DATA REQUIREMENTS

- Unique emails: Use timestamp + random
- Custom IDs: usr*[timestamp]*[random]

## NEXT STEPS

→ Give this plan to Integration Test Agent for implementation
```

---

## 🔗 HOW IT WORKS WITH INTEGRATION TEST AGENT

### Two-Agent Workflow

```
┌─────────────────────┐
│  Analysis Agent     │
│  (This agent)       │
│                     │
│  Input: Service     │
│  Output: Test Plan  │
└──────────┬──────────┘
           │
           │ Test Plan Document
           │ (What to test)
           ▼
┌─────────────────────┐
│ Integration Test    │
│ Agent               │
│                     │
│ Input: Test Plan    │
│ Output: Test Code   │
└─────────────────────┘
```

### Why Two Agents?

**Analysis Agent** (Thinking):

- ✅ Deep code understanding
- ✅ Risk assessment
- ✅ Strategic planning
- ✅ Domain expertise
- ❌ No code generation

**Integration Test Agent** (Doing):

- ✅ Test code generation
- ✅ Infrastructure setup
- ✅ Database operations
- ✅ Vitest implementation
- ❌ No strategic thinking

**Together**: Better tests, faster development, fewer bugs

---

## 📚 SKILLS OVERVIEW

### Skill 1: Service Code Analysis

**Purpose**: Understand service structure, methods, dependencies  
**Output**: Method signatures, parameters, return types, patterns  
**File**: `skills/service-code-analysis.md`

### Skill 2: Database Schema Detection

**Purpose**: Extract table structures from code  
**Output**: Tables, columns, types, constraints  
**File**: `skills/database-schema-detection.md` (TODO)

### Skill 3: Foreign Key Analysis

**Purpose**: Map FK relationships and cascade behaviors  
**Output**: Relationship graph, cascade chains, dependencies  
**File**: `skills/foreign-key-analysis.md`

### Skill 4: Method Operation Mapping

**Purpose**: Analyze what each method does with database  
**Output**: CRUD operations per method, validation rules  
**File**: `skills/method-operation-mapping.md` (TODO)

### Skill 5: Test Scenario Recommendation

**Purpose**: Recommend specific test scenarios  
**Output**: 10+ test scenarios per method with priorities  
**File**: `skills/test-scenario-recommendation.md`

### Skill 6: Risk Assessment

**Purpose**: Identify high-risk operations  
**Output**: Risk levels, critical scenarios, coverage recommendations  
**File**: `skills/risk-assessment.md` (TODO)

### Skill 7: Test Plan Generation

**Purpose**: Compile analysis into structured test plan  
**Output**: Complete test plan document ready for implementation  
**File**: `skills/test-plan-generation.md` (TODO)

---

## 🎓 LEARNING PATH

### For New Users

```
1. Read this README (you're here!) ✅
2. Read ANALYSIS_AGENT_MASTER.md (complete guide)
3. Try analyzing a simple service (e.g., UserService)
4. Review the generated test plan
5. Give test plan to Integration Test Agent
6. See the tests generated
7. Iterate and improve
```

### For Agents

```
1. Read ANALYSIS_AGENT_MASTER.md (your instructions) ✅
2. Understand the 8 core rules
3. Learn the 7 skills (read skill files)
4. Practice on example services
5. Generate comprehensive test plans
6. Collaborate with Integration Test Agent
```

---

## 💡 EXAMPLE USAGE

### Example 1: Basic Service Analysis

```
User: "Analyze src/services/UserService.ts"

Analysis Agent:
1. Reads UserService.ts
2. Detects: Raw SQL pattern, 4 methods
3. Extracts: users table with 7 columns
4. Maps: 2 FK relationships (orders, audit_logs)
5. Recommends: 40 test scenarios (10 per method)
6. Outputs: Comprehensive test plan

User: "Great! Now generate the tests"
→ Hands off to Integration Test Agent
```

### Example 2: Focus on FK Relationships

```
User: "Analyze UserService and focus on cascade behaviors"

Analysis Agent:
1. Reads service
2. Maps FK relationships
3. Identifies CASCADE vs SET NULL
4. Assesses multi-level cascades (users → orders → order_items)
5. Recommends extensive cascade testing
6. Marks deleteUser as HIGH PRIORITY
7. Outputs plan with 15 cascade-specific tests

User: "Implement these cascade tests"
→ Integration Test Agent generates cascade tests
```

### Example 3: Validate Existing Service

```
User: "I have a UserService. What tests am I missing?"

Analysis Agent:
1. Analyzes UserService
2. Recommends 40 test scenarios
3. User sees they only have 10 tests currently
4. Agent highlights missing coverage:
   - ❌ No cascade tests for deleteUser
   - ❌ No unique constraint tests
   - ❌ No validation error tests
5. User: "Generate the missing tests"
→ Integration Test Agent fills gaps
```

---

## 🚨 COMMON USE CASES

### Use Case 1: New Service → Full Test Suite

```
Scenario: Just wrote a new service, need tests
Solution:
1. Analysis Agent: Analyze service → Generate test plan
2. Integration Test Agent: Implement all 40+ tests
3. Result: Complete test coverage from day one
```

### Use Case 2: Legacy Service → Add Tests

```
Scenario: Old service with no tests
Solution:
1. Analysis Agent: Analyze service → Identify all scenarios
2. Integration Test Agent: Generate comprehensive test suite
3. Result: Legacy code now has full coverage
```

### Use Case 3: Refactoring → Validate Tests

```
Scenario: Refactoring service, want to ensure tests still valid
Solution:
1. Analysis Agent: Re-analyze service → Compare with old plan
2. Identify: Changed methods, new FK relationships
3. Update: Test plan with new recommendations
4. Integration Test Agent: Regenerate affected tests
```

### Use Case 4: High-Risk Operation → Extra Coverage

```
Scenario: deleteUser has cascading deletes, want thorough testing
Solution:
1. Analysis Agent: Deep FK analysis → Risk assessment
2. Recommend: 15+ tests for deleteUser (vs 10 standard)
3. Integration Test Agent: Generate all cascade tests
4. Result: High-risk operation has extensive coverage
```

---

## ✅ SUCCESS CRITERIA

A good test plan includes:

**Service Analysis**

- [x] All methods identified
- [x] All parameters and return types documented
- [x] Database pattern detected

**Database Analysis**

- [x] All tables extracted
- [x] All columns and types documented
- [x] All constraints identified

**FK Analysis**

- [x] All relationships mapped
- [x] All cascade behaviors documented
- [x] Dependency graph created

**Test Recommendations**

- [x] 10+ scenarios per method
- [x] Happy path, errors, edge cases
- [x] FK-specific tests
- [x] Prioritized by risk

**Test Plan**

- [x] Structured markdown document
- [x] Coverage matrix
- [x] Test data requirements
- [x] Setup/teardown needs
- [x] Ready for implementation

---

## 🎯 KEY TAKEAWAYS

1. **Analysis Agent = Strategic Thinker**

   - Understands code deeply
   - Identifies risks
   - Recommends comprehensive testing

2. **Integration Test Agent = Tactical Executor**

   - Generates test code
   - Implements infrastructure
   - Executes test plans

3. **Together = Complete Testing Solution**

   - Analysis Agent: What to test
   - Integration Test Agent: How to test
   - Result: Production-ready tests

4. **You Don't Write Tests Manually**
   - Analysis Agent plans
   - Integration Test Agent implements
   - You review and approve

---

## 📖 DOCUMENTATION

- **Master File**: `ANALYSIS_AGENT_MASTER.md` - Complete guide
- **This README**: Overview and quick start
- **Skill Files**: `skills/*.md` - Detailed skill documentation

---

## 🚀 GET STARTED

```bash
# Step 1: Read the master file
Open: docs/agents/analysis-agent/ANALYSIS_AGENT_MASTER.md

# Step 2: Prepare your service file
Example: src/services/UserService.ts

# Step 3: Ask Analysis Agent
"Analyze src/services/UserService.ts and create a test plan"

# Step 4: Review test plan
Analysis Agent outputs comprehensive plan

# Step 5: Generate tests
Give plan to Integration Test Agent

# Step 6: Run tests
npx vitest run

# Done! ✅
```

---

**Created**: December 2024  
**Status**: Production-Ready  
**Purpose**: Analyze services → Recommend tests → Enable better testing

🎉 **Smart analysis leads to better tests!**
