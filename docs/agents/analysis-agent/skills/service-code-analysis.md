# Skill 1: SERVICE CODE ANALYSIS

## 📋 PURPOSE

Deep analysis of service class structure, methods, business logic, and code patterns.

**Goal**: Understand what the service does, how it's structured, and what methods it exposes.

---

## 🎯 WHEN TO USE

- **ALWAYS FIRST** - This is the foundation of all analysis
- Before any database schema detection
- Before any method-specific analysis
- Anytime you need to understand service purpose

---

## ⚡ QUICK START

```typescript
// Step 1: Read entire service file
const serviceCode = readFile("src/services/UserService.ts");

// Step 2: Identify key components
const analysis = {
  serviceName: extractServiceName(serviceCode),
  purpose: inferServicePurpose(serviceCode),
  methods: extractAllMethods(serviceCode),
  dependencies: extractDependencies(serviceCode),
};

// Step 3: Document findings
return createServiceAnalysisReport(analysis);
```

---

## 🔍 DETAILED WORKFLOW

### Step 1: Read Complete File

```typescript
// Read from import statements to end of file
// Include: imports, class definition, all methods, helper functions
```

**What to look for**:

- Import statements (dependencies)
- Class name and exports
- Constructor and initialization
- Public methods
- Private methods
- Helper functions

### Step 2: Extract Service Metadata

```typescript
interface ServiceMetadata {
  name: string; // e.g., "UserService"
  purpose: string; // e.g., "Manages user CRUD operations"
  location: string; // e.g., "src/services/UserService.ts"
  pattern: "Prisma" | "Raw SQL" | "Mixed" | "ORM";
}
```

**How to identify pattern**:

```typescript
// Look for:
if (code.includes('prisma.')) → 'Prisma'
if (code.includes('$queryRaw') || code.includes('$executeRaw')) → 'Raw SQL'
if (code.includes('prisma.') && code.includes('$queryRaw')) → 'Mixed'
if (code.includes('@Entity') || code.includes('TypeORM')) → 'ORM'
```

### Step 3: Extract All Methods

```typescript
interface MethodSignature {
  name: string; // e.g., "createUser"
  visibility: "public" | "private" | "protected";
  isAsync: boolean;
  parameters: Parameter[];
  returnType: string;
  jsdocComment?: string;
}

interface Parameter {
  name: string;
  type: string;
  optional: boolean;
  defaultValue?: any;
}
```

**Example extraction**:

```typescript
// From code:
async createUser(input: CreateUserInput): Promise<User> {
  // ...
}

// Extract:
{
  name: 'createUser',
  visibility: 'public',
  isAsync: true,
  parameters: [
    { name: 'input', type: 'CreateUserInput', optional: false }
  ],
  returnType: 'Promise<User>'
}
```

### Step 4: Identify Dependencies

```typescript
interface ServiceDependencies {
  internal: string[]; // Other services: ['AuthService', 'EmailService']
  external: string[]; // External libs: ['bcrypt', 'jsonwebtoken']
  database: string[]; // DB services: ['DatabaseService', 'prisma']
  utilities: string[]; // Helpers: ['Logger', 'Validator']
}
```

**How to extract**:

```typescript
// From imports:
import { AuthService } from './AuthService';           → internal
import bcrypt from 'bcrypt';                          → external
import { databaseService } from '../utils/Database';  → database
import { logger } from '../utils/Logger';             → utilities
```

### Step 5: Analyze Class Structure

```typescript
interface ClassStructure {
  hasConstructor: boolean;
  hasSingleton: boolean;
  hasPrivateMembers: boolean;
  hasStaticMethods: boolean;
  hasLifecycleMethods: boolean; // init(), close(), etc.
}
```

### Step 6: Identify Business Logic Patterns

```typescript
interface BusinessLogicPatterns {
  hasValidation: boolean; // Input validation methods
  hasErrorHandling: boolean; // Try-catch blocks, error throwing
  hasTransactions: boolean; // Database transactions
  hasLogging: boolean; // Logger usage
  hasAuthorization: boolean; // Permission checks
  hasCaching: boolean; // Cache usage
}
```

---

## 📊 OUTPUT FORMAT

```typescript
{
  // Service Identity
  serviceName: "UserService",
  purpose: "Manages user lifecycle including creation, authentication, and profile management",
  location: "src/services/UserService.ts",
  pattern: "Raw SQL",

  // Methods Summary
  publicMethods: [
    {
      name: "createUser",
      signature: "createUser(input: CreateUserInput): Promise<User>",
      purpose: "Creates a new user with validation"
    },
    {
      name: "getUserById",
      signature: "getUserById(id: string): Promise<User | null>",
      purpose: "Retrieves user by unique ID"
    },
    // ... etc
  ],

  privateMethods: [
    {
      name: "_generateId",
      signature: "_generateId(): string",
      purpose: "Generates custom user ID format"
    },
    {
      name: "_validateEmail",
      signature: "_validateEmail(email: string): boolean",
      purpose: "Validates email format"
    }
  ],

  // Dependencies
  dependencies: {
    internal: [],
    external: [],
    database: ["DatabaseService"],
    utilities: ["Logger"]
  },

  // Patterns Detected
  patterns: {
    hasValidation: true,
    hasErrorHandling: true,
    hasTransactions: false,
    hasLogging: true,
    hasAuthorization: false,
    hasCaching: false
  },

  // Class Structure
  structure: {
    hasConstructor: true,
    hasSingleton: true,
    hasPrivateMembers: true,
    hasStaticMethods: false,
    hasLifecycleMethods: false
  }
}
```

---

## 💡 EXAMPLES

### Example 1: Analyzing UserService

**Service Code**:

```typescript
import { databaseService } from "../utils/DatabaseService";
import { logger } from "../utils/Logger";

class UserService {
  private static instance: UserService;

  private constructor() {}

  static getInstance(): UserService {
    if (!UserService.instance) {
      UserService.instance = new UserService();
    }
    return UserService.instance;
  }

  async createUser(input: CreateUserInput): Promise<User> {
    // Validation
    if (!this._isValidEmail(input.email)) {
      throw new Error("Invalid email format");
    }

    // Database operation
    const id = this._generateId();
    const result = await databaseService.client.$queryRaw<User[]>`
      INSERT INTO users (id, email, name, "isActive", "createdAt", "updatedAt")
      VALUES (${id}, ${input.email}, ${input.name}, true, NOW(), NOW())
      RETURNING *
    `;

    logger.log(`Created user: ${result[0].id}`);
    return result[0];
  }

  private _generateId(): string {
    return `usr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private _isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
}

export const userService = UserService.getInstance();
```

**Analysis Output**:

```typescript
{
  serviceName: "UserService",
  purpose: "Manages user CRUD operations with validation and custom ID generation",
  location: "src/services/UserService.ts",
  pattern: "Raw SQL",

  publicMethods: [
    {
      name: "createUser",
      signature: "createUser(input: CreateUserInput): Promise<User>",
      purpose: "Creates new user with email validation and custom ID",
      complexity: "Medium",
      databaseOperations: ["INSERT INTO users"],
      validations: ["email format"],
      errorHandling: true
    }
  ],

  privateMethods: [
    {
      name: "_generateId",
      signature: "_generateId(): string",
      purpose: "Generates custom ID: usr_[timestamp]_[random]"
    },
    {
      name: "_isValidEmail",
      signature: "_isValidEmail(email: string): boolean",
      purpose: "Validates email format using regex"
    }
  ],

  dependencies: {
    internal: [],
    external: [],
    database: ["DatabaseService"],
    utilities: ["Logger"]
  },

  patterns: {
    hasValidation: true,      // _isValidEmail
    hasErrorHandling: true,   // throw new Error
    hasTransactions: false,
    hasLogging: true,         // logger.log
    hasAuthorization: false,
    hasCaching: false
  },

  structure: {
    hasConstructor: true,
    hasSingleton: true,       // getInstance pattern
    hasPrivateMembers: true,  // private methods
    hasStaticMethods: true,   // getInstance
    hasLifecycleMethods: false
  }
}
```

---

## 🔍 ANALYSIS CHECKLIST

When analyzing a service, verify you've captured:

**Service Identity**

- [ ] Service name extracted
- [ ] Purpose inferred from code
- [ ] File location noted
- [ ] Database pattern detected (Prisma/SQL/ORM)

**Methods Analysis**

- [ ] All public methods listed
- [ ] All private methods listed
- [ ] Method signatures documented
- [ ] Parameters and types captured
- [ ] Return types noted
- [ ] Async/sync identified

**Dependencies**

- [ ] Internal service dependencies
- [ ] External library dependencies
- [ ] Database service imports
- [ ] Utility imports

**Patterns**

- [ ] Validation patterns detected
- [ ] Error handling patterns noted
- [ ] Transaction usage identified
- [ ] Logging usage noted
- [ ] Authorization patterns found
- [ ] Caching patterns discovered

**Structure**

- [ ] Constructor analyzed
- [ ] Singleton pattern detected
- [ ] Private members identified
- [ ] Static methods found
- [ ] Lifecycle methods noted

---

## 🚨 COMMON PITFALLS

### Pitfall 1: Not Reading Complete File

**Problem**: Skipping private methods or helper functions

**Solution**: Read entire file from top to bottom

```typescript
// ❌ WRONG - Only reading public methods
const publicMethods = extractPublicMethods(code);

// ✅ CORRECT - Reading everything
const allMethods = extractAllMethods(code); // public + private
const helpers = extractHelperFunctions(code);
```

### Pitfall 2: Missing Custom ID Generation

**Problem**: Not noticing custom ID patterns

**Solution**: Look for ID generation logic

```typescript
// Look for:
- _generateId(), generateUserId(), createId()
- Custom ID patterns: usr_123_abc, user-timestamp-random
- ID prefixes: usr_, user_, id_
```

### Pitfall 3: Ignoring Validation Logic

**Problem**: Missing validation methods that affect error tests

**Solution**: Find all validation patterns

```typescript
// Look for:
- _isValid*() methods
- if (!input.x) throw new Error(...)
- Validation libraries: joi, yup, zod
```

### Pitfall 4: Wrong Pattern Detection

**Problem**: Classifying as Prisma when it's raw SQL

**Solution**: Check actual database calls

```typescript
// ❌ WRONG - Assuming Prisma from import
import { PrismaClient } from "@prisma/client";
// Could still use raw SQL!

// ✅ CORRECT - Check actual usage
const code = readMethodBodies();
if (code.includes(".$queryRaw") || code.includes(".$executeRaw")) {
  pattern = "Raw SQL";
} else if (code.includes(".prisma.model.create")) {
  pattern = "Prisma ORM";
}
```

---

## 🎯 SUCCESS CRITERIA

Analysis is complete when you can answer:

1. **What does this service do?** (Purpose in one sentence)
2. **How many methods does it have?** (Count public + private)
3. **What database pattern does it use?** (Prisma/SQL/Mixed/ORM)
4. **What are the dependencies?** (List all imports)
5. **What validation rules exist?** (List validation methods)
6. **What error handling exists?** (Try-catch, throws)
7. **Is it a singleton?** (getInstance pattern)
8. **Does it use custom IDs?** (ID generation methods)

If you can answer all 8 questions, your analysis is complete ✅

---

## 📚 NEXT STEPS

After completing service code analysis:

1. **Move to Skill 2**: Database Schema Detection
   - Use detected pattern to extract schema
   - Use method analysis to find tables
2. **Move to Skill 3**: Foreign Key Analysis
   - Use database operations to find FK usage
3. **Move to Skill 4**: Method Operation Mapping
   - Deep dive into each method's database operations

---

**File**: service-code-analysis.md  
**Skill**: 1  
**Status**: Production-Ready  
**Purpose**: Foundation analysis for all subsequent skills
