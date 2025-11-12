# Skill 8: IMPORT & TYPESCRIPT ERROR PREVENTION

## 📋 PURPOSE

Analyze service imports and types to ensure test recommendations won't cause import errors or TypeScript compilation issues.

**Goal**: Generate error-free test plans that use correct imports and types.

---

## 🎯 WHEN TO USE

- **ALWAYS** before recommending tests
- After analyzing service structure
- Before creating test plan document
- When identifying required test imports

---

## ⚡ QUICK START

```typescript
// Step 1: Extract all imports from service
const imports = extractServiceImports(serviceFile);

// Step 2: Identify available types
const types = identifyAvailableTypes(imports, serviceFile);

// Step 3: Check export statements
const exports = extractExports(serviceFile);

// Step 4: Validate import paths
const validPaths = validateImportPaths(imports);

// Step 5: Generate correct test imports
const testImports = generateTestImports(types, exports);
```

---

## 🔍 DETAILED WORKFLOW

### Step 1: Extract Service Imports

**Read all import statements**:

```typescript
// Example service file
import { PrismaClient } from "@prisma/client";
import { hash, compare } from "bcrypt";
import type { User, CreateUserInput, UpdateUserInput } from "./types";
import { databaseService } from "../utils/DatabaseService";
import { logger } from "../utils/Logger";
```

**Categorize imports**:

```typescript
interface ImportAnalysis {
  external: {
    name: string;
    from: string;
    items: string[];
  }[];
  internal: {
    name: string;
    from: string;
    items: string[];
  }[];
  types: {
    name: string;
    from: string;
    items: string[];
  }[];
}

// Example:
{
  external: [
    { name: 'prisma', from: '@prisma/client', items: ['PrismaClient'] },
    { name: 'bcrypt', from: 'bcrypt', items: ['hash', 'compare'] }
  ],
  internal: [
    { name: 'databaseService', from: '../utils/DatabaseService', items: ['databaseService'] },
    { name: 'logger', from: '../utils/Logger', items: ['logger'] }
  ],
  types: [
    { name: 'types', from: './types', items: ['User', 'CreateUserInput', 'UpdateUserInput'] }
  ]
}
```

### Step 2: Identify Available Types

**Extract type definitions**:

```typescript
// From service file or type imports
interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface CreateUserInput {
  email: string;
  name: string;
  password: string;
  role?: string;
}

interface UpdateUserInput {
  email?: string;
  name?: string;
  role?: string;
}
```

**Map type usage**:

```typescript
interface TypeUsage {
  typeName: string;
  usedIn: string[];  // Which methods use this type
  requiredFor: string[];  // Which test scenarios need this type
  importPath: string;
}

// Example:
{
  typeName: "CreateUserInput",
  usedIn: ["createUser"],
  requiredFor: [
    "Test 1: Create user with valid data",
    "Test 2: Create user with optional fields",
    "Test 7: Duplicate email error"
  ],
  importPath: "../../services/UserService"
}
```

### Step 3: Detect Export Patterns

**Single export**:

```typescript
// Service file
class UserService {
  /* ... */
}
export const userService = UserService.getInstance();

// Test must import:
import { userService } from "../../services/UserService";
```

**Named exports**:

```typescript
// Service file
export class UserService {
  /* ... */
}
export function validateEmail(email: string): boolean {
  /* ... */
}

// Test can import:
import { UserService, validateEmail } from "../../services/UserService";
```

**Default export**:

```typescript
// Service file
export default class UserService {
  /* ... */
}

// Test must import:
import UserService from "../../services/UserService";
```

**Re-exports**:

```typescript
// Service file
export { User, CreateUserInput } from "./types";

// Test can import types directly from service:
import type { User, CreateUserInput } from "../../services/UserService";
```

### Step 4: Analyze Type Requirements Per Test

```typescript
interface TestTypeRequirements {
  testName: string;
  requiredTypes: string[];
  requiredImports: string[];
  potentialErrors: string[];
}

// Example:
{
  testName: "Create user with valid data",
  requiredTypes: ["CreateUserInput"],
  requiredImports: [
    "import { userService } from '../../services/UserService';",
    "import type { CreateUserInput } from '../../services/UserService';"
  ],
  potentialErrors: [
    "❌ Don't import { User } if only CreateUserInput is used",
    "❌ Don't use @/ alias if not configured",
    "✅ Use relative paths: ../../services/"
  ]
}
```

### Step 5: Validate Import Paths

**Check relative path depth**:

```typescript
// Test file: src/__tests__/microservices/user-service.test.ts
// Service file: src/services/UserService.ts

// ✅ CORRECT
import { userService } from "../../services/UserService";
// Goes up 2 levels (__tests__/microservices → src), then into services

// ❌ WRONG
import { userService } from "../services/UserService";
// Only goes up 1 level (would look in __tests__/services)

// ❌ WRONG
import { userService } from "@/services/UserService";
// Path alias might not be configured
```

**Infrastructure imports**:

```typescript
// Test file: src/__tests__/microservices/user-service.test.ts
// Infrastructure: src/__tests__/shared/testInfrastructure.ts

// ✅ CORRECT
import { getInfrastructure } from "../shared/testInfrastructure";
// Up 1 level (microservices → __tests__), then into shared

// ❌ WRONG
import { getInfrastructure } from "../../shared/testInfrastructure";
// Goes up too far
```

---

## 📊 IMPORT RECOMMENDATIONS

### For Service Imports

```typescript
// ✅ CORRECT Pattern
import { userService } from "../../services/UserService";
import type {
  CreateUserInput,
  UpdateUserInput,
  User,
} from "../../services/UserService";

// Rationale:
// - Relative path from test file location
// - Separate type imports with 'type' keyword
// - Only import types that are ACTUALLY used
// - No path aliases (@/)
```

### For Infrastructure Imports

```typescript
// ✅ CORRECT Pattern
import {
  getInfrastructure,
  getSchemasByService,
  recordTestExecution,
} from "../shared/testInfrastructure";

import {
  simulateProductionOperation,
  generateTestData,
} from "../shared/testHelpers";

// Rationale:
// - testInfrastructure and testHelpers are different files
// - Use relative paths from test location
// - Group related imports
```

### For Vitest Imports

```typescript
// ✅ CORRECT Pattern
import { describe, it, expect, beforeAll, afterAll } from "vitest";

// Rationale:
// - External package, no relative path
// - Import only what's used
// - Standard Vitest imports
```

---

## 🚨 COMMON IMPORT ERRORS & PREVENTION

### Error 1: Using Unavailable Types

**Problem**:

```typescript
// Test recommends using 'User' type
import type { User } from "../../services/UserService";

// But service only exports CreateUserInput and UpdateUserInput
// User type is internal to service
```

**Prevention**:

```typescript
// Check exports
const exports = extractExports(serviceFile);
if (!exports.types.includes("User")) {
  // Don't recommend importing User
  // Use CreateUserInput instead
}
```

**Solution**:

```typescript
// ✅ Use only exported types
import type { CreateUserInput } from "../../services/UserService";

// OR infer type from method return
const user = await userService.createUser(userData);
// TypeScript infers type from method signature
```

### Error 2: Wrong Import Path

**Problem**:

```typescript
// Test file: src/__tests__/microservices/user-service.test.ts
import { userService } from "../services/UserService";
// ❌ Looks in src/__tests__/services/ (doesn't exist)
```

**Prevention**:

```typescript
// Calculate correct path
const testFilePath = "src/__tests__/microservices/user-service.test.ts";
const serviceFilePath = "src/services/UserService.ts";

const relativePath = calculateRelativePath(testFilePath, serviceFilePath);
// Returns: "../../services/UserService"
```

### Error 3: Importing Unused Types

**Problem**:

```typescript
// Importing types that are never used
import type {
  User,
  CreateUserInput,
  UpdateUserInput,
  DeleteUserInput,
} from "../../services/UserService";

// But test only uses CreateUserInput
```

**Prevention**:

```typescript
// Analyze which types are actually needed
const usedTypes = analyzeTestTypeUsage(testScenarios);
// Returns: ["CreateUserInput"]

// Only recommend necessary imports
import type { CreateUserInput } from "../../services/UserService";
```

### Error 4: Using Path Aliases

**Problem**:

```typescript
// Using @/ alias without knowing if it's configured
import { userService } from "@/services/UserService";
```

**Prevention**:

```typescript
// ALWAYS use relative paths in test recommendations
// Don't assume tsconfig path aliases are configured

// ✅ ALWAYS RECOMMEND
import { userService } from "../../services/UserService";
```

### Error 5: Wrong Infrastructure File

**Problem**:

```typescript
// Importing recordTestExecution from wrong file
import { recordTestExecution } from "../shared/testHelpers";
// ❌ It's actually in testInfrastructure
```

**Prevention**:

```typescript
// Know the infrastructure split
const infrastructureFunctions = [
  "getInfrastructure",
  "getSchemasByService",
  "recordTestExecution", // ← In testInfrastructure
];

const helperFunctions = [
  "simulateProductionOperation",
  "generateTestData", // ← In testHelpers
];

// Recommend correct import based on function
```

---

## 📋 TYPE SAFETY CHECKLIST

When recommending tests, ensure:

**Type Imports**

- [ ] Only import types that are exported
- [ ] Only import types that are actually used
- [ ] Use `import type { }` for type-only imports
- [ ] Don't import implementation for types (e.g., full User object if only need CreateUserInput)

**Path Validation**

- [ ] Calculate correct relative path depth
- [ ] Verify service file location
- [ ] Verify test file location
- [ ] Use ../ correctly (not @/)

**Import Split**

- [ ] Service imports use ../../services/
- [ ] Infrastructure imports use ../shared/testInfrastructure
- [ ] Helper imports use ../shared/testHelpers
- [ ] External imports use package names (no paths)

**Usage Validation**

- [ ] Every imported type is used
- [ ] Every used type is imported
- [ ] No duplicate imports
- [ ] No unused imports

---

## 💡 EXAMPLES

### Example 1: Correct Test Imports for UserService

**Service File** (`src/services/UserService.ts`):

```typescript
import { databaseService } from "../utils/DatabaseService";

interface CreateUserInput {
  email: string;
  name: string;
  password: string;
}

interface UpdateUserInput {
  email?: string;
  name?: string;
}

class UserService {
  async createUser(input: CreateUserInput): Promise<User> {
    /* ... */
  }
  async updateUser(id: string, input: UpdateUserInput): Promise<User> {
    /* ... */
  }
}

export const userService = UserService.getInstance();
export type { CreateUserInput, UpdateUserInput };
```

**Test File** (`src/__tests__/microservices/user-service.test.ts`):

```typescript
// ✅ CORRECT IMPORTS
import { describe, it, expect, beforeAll, afterAll } from "vitest";

// Service imports
import { userService } from "../../services/UserService";
import type {
  CreateUserInput,
  UpdateUserInput,
} from "../../services/UserService";

// Infrastructure imports
import {
  getInfrastructure,
  getSchemasByService,
  recordTestExecution,
} from "../shared/testInfrastructure";

// Helper imports
import { simulateProductionOperation } from "../shared/testHelpers";

// ✅ All imports:
// - Use relative paths
// - Import only what's used
// - Correct file sources
// - Type-only imports where appropriate
```

### Example 2: Avoiding Import Errors

```typescript
// ❌ WRONG - Don't recommend this
import type { User } from "../../services/UserService";
// User type might not be exported

// ✅ CORRECT - Recommend this
import type { CreateUserInput } from "../../services/UserService";
// CreateUserInput is explicitly exported

// ❌ WRONG - Don't recommend this
import { userService } from "@/services/UserService";
// Path alias might not be configured

// ✅ CORRECT - Recommend this
import { userService } from "../../services/UserService";
// Relative path always works

// ❌ WRONG - Don't recommend this
import { recordTestExecution } from "../shared/testHelpers";
// Wrong file!

// ✅ CORRECT - Recommend this
import { recordTestExecution } from "../shared/testInfrastructure";
// Correct file
```

---

## 🎯 IMPORT RECOMMENDATION TEMPLATE

For each test file, provide:

```markdown
## Required Imports

### Vitest Framework

\`\`\`typescript
import { describe, it, expect, beforeAll, afterAll } from "vitest";
\`\`\`

### Service Under Test

\`\`\`typescript
import { userService } from "../../services/UserService";
\`\`\`

### Type Imports (if needed)

\`\`\`typescript
import type { CreateUserInput, UpdateUserInput } from "../../services/UserService";
\`\`\`
**Note**: Only import types that are USED in the tests. Remove unused imports.

### Test Infrastructure

\`\`\`typescript
import {
getInfrastructure,
getSchemasByService,
recordTestExecution,
} from "../shared/testInfrastructure";
\`\`\`

### Test Helpers

\`\`\`typescript
import { simulateProductionOperation } from "../shared/testHelpers";
\`\`\`
**Note**: Only import if actually using `simulateProductionOperation()` in tests.

## Import Notes

- ✅ All paths are relative (no @/ aliases)
- ✅ Service imports go up 2 levels: `../../services/`
- ✅ Shared imports go up 1 level: `../shared/`
- ✅ Type-only imports use `import type { }`
- ✅ Only imports what's actually used in tests
```

---

## ✅ SUCCESS CRITERIA

Import analysis is complete when:

1. **All service exports identified** (functions, types, classes)
2. **All type dependencies mapped** (which tests need which types)
3. **All import paths calculated** (correct relative depths)
4. **All potential errors prevented** (no @/ aliases, correct files, exported types only)
5. **Import recommendations generated** (exact import statements for test file)

---

**File**: import-typescript-error-prevention.md  
**Skill**: 8  
**Status**: Production-Ready  
**Purpose**: Prevent import and TypeScript errors in test recommendations
