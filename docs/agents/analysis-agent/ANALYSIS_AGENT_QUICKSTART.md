# 🎯 ANALYSIS AGENT — QUICK START GUIDE

**Deep Understanding → Smart Recommendations → Better Tests**

---

## 🚀 WHAT YOU NEED TO KNOW

### The Analysis Agent's Job

```
1. You give it: Service file (e.g., UserService.ts)
2. It analyzes: Code, database, FK relationships, risks
3. It outputs: Comprehensive test plan (40+ test scenarios)
4. You give plan to: Integration Test Agent
5. Tests are generated: Production-ready, complete coverage
```

---

## 📁 FILES YOU NEED

### For Users

```
1. READ FIRST: docs/agents/analysis-agent/README.md
   → Overview and quick start

2. THEN READ: docs/agents/analysis-agent/ANALYSIS_AGENT_MASTER.md
   → Complete instructions for the agent

3. OPTIONAL: docs/agents/analysis-agent/skills/*.md
   → Detailed skill documentation
```

### For AI Agents

```
1. READ: docs/agents/analysis-agent/ANALYSIS_AGENT_MASTER.md
   → Your complete instruction manual

2. REFERENCE: docs/agents/analysis-agent/skills/*.md
   → Detailed workflows for each skill
```

---

## 💬 HOW TO USE IT

### Basic Usage

```bash
# Give agent the master file
"Read docs/agents/analysis-agent/ANALYSIS_AGENT_MASTER.md"

# Ask for analysis
"Analyze src/services/UserService.ts and create a test plan"

# Agent will:
# 1. Read the service file completely
# 2. Extract database schema
# 3. Map FK relationships
# 4. Analyze each method
# 5. Recommend 40+ test scenarios
# 6. Create structured test plan document

# You get:
# - Comprehensive test plan (markdown)
# - Test scenarios for each method
# - Risk assessment
# - Coverage matrix
# - Setup requirements
```

### Advanced Usage

```bash
# Focus on specific areas
"Analyze UserService and focus on FK cascade behaviors"

# Analyze specific methods
"Analyze the deleteUser method and recommend cascade tests"

# Risk assessment
"What are the high-risk operations in UserService?"

# Compare with existing tests
"I have 10 tests for UserService. What am I missing?"
```

---

## 🎯 WHAT THE ANALYSIS AGENT ANALYZES

### 1. Service Structure

- All public methods
- All private helper methods
- Method parameters and return types
- Dependencies (imports)

### 2. Database Schema

- Tables used
- Columns (name, type, nullable)
- Primary keys
- Unique constraints
- Default values

### 3. Foreign Key Relationships

- Parent-child relationships
- CASCADE behaviors (DELETE, UPDATE)
- SET NULL behaviors
- RESTRICT constraints
- Multi-level dependencies

### 4. Validation Rules

- Email format validation
- Length constraints
- Required vs optional fields
- Custom validation logic

### 5. Risk Assessment

- High-risk operations (CASCADE deletes)
- Constraint violations (unique, FK)
- Data loss scenarios
- Performance implications

### 6. Test Recommendations

- Happy path scenarios (60%)
- Error case scenarios (30%)
- Edge case scenarios (10%)
- FK-specific tests
- Constraint tests

---

## 📊 EXAMPLE OUTPUT

```markdown
# 🔍 SERVICE ANALYSIS: UserService

## OVERVIEW

- Methods: 4 (create, read, update, delete)
- Pattern: Raw SQL
- Tables: users
- FK Relationships: 2 (CASCADE, SET NULL)
- Risk: HIGH (cascading deletes)

## METHOD ANALYSIS

### createUser(input: CreateUserInput): Promise<User>

**Database**: INSERT into users
**Validation**: email format, required fields
**FK Impact**: None (parent table)

**RECOMMENDED TESTS** (10 total):

1. ✅ Create with valid data
2. ✅ Create with optional fields
3. ✅ Verify ID generation (usr_timestamp_random)
4. ✅ Verify timestamps set automatically
5. ✅ Create with special characters
6. ✅ Create multiple users (no collisions)
7. ❌ Duplicate email (unique constraint)
8. ❌ Invalid email format (validation)
9. ❌ Missing required field
10. 🔸 Maximum length name (100 chars)

### deleteUser(id: string): Promise<void>

**⚠️ HIGH PRIORITY** - Cascading deletes
**Database**: DELETE from users
**FK Impact**:

- Cascades to orders (DELETE CASCADE)
- Cascades to order_items (via orders)
- Sets audit_logs.userId to NULL

**RECOMMENDED TESTS** (10 total):

1. ✅ Delete user successfully
2. ✅ Verify cascade to orders
3. ✅ Verify cascade to order_items
4. ✅ Verify audit_logs preserved (SET NULL)
5. ✅ Delete and cannot retrieve after
6. ✅ Delete with no related records
7. ❌ Delete non-existent user (P2025)
8. ❌ Delete with invalid ID
9. ❌ Verify related tables cleaned
10. 🔸 Delete with 1000+ orders (performance)

## COVERAGE MATRIX

| Method     | Happy  | Error  | Edge  | Total  | Priority |
| ---------- | ------ | ------ | ----- | ------ | -------- |
| createUser | 6      | 3      | 1     | 10     | HIGH     |
| deleteUser | 6      | 3      | 1     | 10     | HIGH     |
| **TOTAL**  | **24** | **12** | **4** | **40** | -        |

## NEXT STEPS

→ Give this plan to Integration Test Agent
→ Integration Test Agent will generate 40 production-ready tests
```

---

## 🔗 TWO-AGENT WORKFLOW

```
Step 1: ANALYSIS AGENT (This Agent)
  Input: src/services/UserService.ts
  Job: Analyze deeply, recommend tests
  Output: Test plan (40+ scenarios)

Step 2: INTEGRATION TEST AGENT
  Input: Test plan from Analysis Agent
  Job: Generate actual test code
  Output: src/__tests__/microservices/user-service.test.ts

Step 3: RUN TESTS
  Command: npx vitest run
  Result: ✅ All 40 tests pass
```

---

## ✅ WHAT MAKES A GOOD TEST PLAN

The Analysis Agent ensures:

- [x] **Every method has 10+ tests**
- [x] **All constraints tested** (unique, NOT NULL, FK)
- [x] **All FK relationships tested** (CASCADE, SET NULL, RESTRICT)
- [x] **All validation rules tested** (format, length, required)
- [x] **Risk assessment included** (HIGH/MEDIUM/LOW)
- [x] **Test data requirements specified** (unique emails, IDs)
- [x] **Setup/teardown documented** (table creation, cleanup)
- [x] **Coverage matrix provided** (what's tested vs what's not)
- [x] **Ready for implementation** (Integration Test Agent can use it immediately)

---

## 🎓 LEARN MORE

### Documentation

- **README**: `docs/agents/analysis-agent/README.md`
- **Master File**: `docs/agents/analysis-agent/ANALYSIS_AGENT_MASTER.md`
- **Skills**: `docs/agents/analysis-agent/skills/*.md`

### Integration Test Agent

- **Master File**: `docs/agents/integration-agent/INTEGRATION_AGENT_MASTER.md`
- **Purpose**: Implements test plans from Analysis Agent

---

## 💡 KEY BENEFITS

1. **Deep Understanding** - Analyzes code, database, FK relationships
2. **Intelligent Recommendations** - Knows what to test and why
3. **Risk Assessment** - Identifies high-risk operations
4. **Complete Coverage** - Every method, every constraint, every FK
5. **Ready for Implementation** - Test plans directly usable by Integration Test Agent
6. **Saves Time** - Minutes to analyze vs hours of manual analysis
7. **Catches Issues** - Identifies missing tests in existing suites

---

**File**: ANALYSIS_AGENT_QUICKSTART.md  
**Created**: December 2024  
**Purpose**: Fast onboarding for Analysis Agent usage

🎉 **Start analyzing services in minutes!**
