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
- For both traditional service files AND Next.js action files

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
  name: string; // e.g., "UserService" or "users actions"
  purpose: string; // e.g., "Manages user CRUD operations" or "User actions for Next.js"
  location: string; // e.g., "src/services/UserService.ts" or "src/services/users/actions.ts"
  type: "Service" | "Action File"; // NEW: Distinguish between services and action files
  pattern: "Prisma" | "Raw SQL" | "Mixed" | "ORM" | "Service Layer"; // NEW: Service layer for action files
}
```

**How to identify pattern**:

```typescript
// For Traditional Services:
if (code.includes('prisma.')) → 'Prisma'
if (code.includes('$queryRaw') || code.includes('$executeRaw')) → 'Raw SQL'
if (code.includes('prisma.') && code.includes('$queryRaw')) → 'Mixed'
if (code.includes('@Entity') || code.includes('TypeORM')) → 'ORM'

// For Action Files (NEW):
if (code.includes('adminProcedure')) → 'Service Layer' (action file)
if (code.includes('.action(')) → 'Service Layer' (action file)
if (code.includes('ctx.svc')) → 'Service Layer' (action file)

// File-based detection:
if (fileName.includes('actions.ts')) → 'Action File'
if (fileName.includes('/actions/')) → 'Action File'
```

### Step 3: Extract All Methods

```typescript
interface MethodSignature {
  name: string; // e.g., "createUser" or "createUserAction"
  visibility: "public" | "private" | "protected" | "exported"; // NEW: exported for action files
  isAsync: boolean;
  parameters: Parameter[];
  returnType: string;
  jsdocComment?: string;
  methodType: "service" | "action"; // NEW: distinguish method types
}

interface Parameter {
  name: string;
  type: string;
  optional: boolean;
  defaultValue?: any;
}

// NEW: For Action Files
interface ActionMethodSignature extends MethodSignature {
  validationSchema: string; // e.g., "CreateUserSchema"
  serviceCall: string;      // e.g., "ctx.svc.createUser"
  parameterMapping: string; // e.g., "direct" or "destructured"
}
```

**Example extraction**:

```typescript
// Traditional Service Method:
async createUser(input: CreateUserInput): Promise<User> {
  // ...
}
// Extract:
{
  name: 'createUser',
  methodType: 'service',
  visibility: 'public',
  isAsync: true,
  parameters: [
    { name: 'input', type: 'CreateUserInput', optional: false }
  ],
  returnType: 'Promise<User>'
}

// Action File Method (NEW):
export const createUserAction = adminProcedure
  .schema(CreateUserSchema)
  .action(async ({ ctx, parsedInput }) => {
    const serviceResponse = await ctx.svc.createUser(parsedInput);
    return { result: serviceResponse.data };
  });
// Extract:
{
  name: 'createUserAction',
  methodType: 'action',
  visibility: 'exported',
  isAsync: true,
  parameters: [
    { name: 'parsedInput', type: 'z.infer<typeof CreateUserSchema>', optional: false }
  ],
  returnType: 'Promise<{ result: any }>',
  validationSchema: 'CreateUserSchema',
  serviceCall: 'ctx.svc.createUser',
  parameterMapping: 'direct'
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

### Step 5: Analyze Class Structure OR Action File Structure

```typescript
interface ClassStructure {
  hasConstructor: boolean;
  hasSingleton: boolean;
  hasPrivateMembers: boolean;
  hasStaticMethods: boolean;
  hasLifecycleMethods: boolean; // init(), close(), etc.
}

// NEW: For Action Files
interface ActionFileStructure {
  hasAdminProcedure: boolean;      // Uses adminProcedure wrapper
  hasSchemaValidation: boolean;    // All actions have schema validation
  hasServiceContext: boolean;      // Uses ctx.svc pattern
  hasResponseWrapping: boolean;    // Wraps service responses
  parameterPattern: "direct" | "destructured" | "transformed";
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

### Example 2: Analyzing User Action File (NEW)

**Action File Code**:

```typescript
"use server";

import { z } from "zod";
import { CreateUserSchema, UpdateUserSchema, UserIdSchema } from "./_data/userSchema";
import { userService } from "./_data/userService";
import type { ServerCtxType } from "../../lib/utils/types";

const adminProcedure = {
  schema: <T extends z.ZodSchema>(schema: T) => ({
    action: (
      handler: (args: {
        ctx: { svc: ReturnType<typeof userService> };
        parsedInput: z.infer<T>;
      }) => Promise<any>
    ) => {
      return async (input: z.infer<T>) => {
        const parsedInput = schema.parse(input);
        const database = (input as any)?.database || undefined;
        const serverCtx: ServerCtxType = {
          accountUserId: 1,
          userRole: "admin",
          database,
        };
        const svc = userService(serverCtx);
        return handler({
          ctx: { svc },
          parsedInput,
        });
      };
    },
  }),
};

export const createUserAction = adminProcedure
  .schema(CreateUserSchema)
  .action(async ({ ctx, parsedInput }) => {
    const serviceResponse = await ctx.svc.createUser(parsedInput);
    return {
      result: serviceResponse.data,
      message: serviceResponse.message || "Successfully created user",
      success: serviceResponse.success,
      errors: serviceResponse.errors,
    };
  });

export const updateUserAction = adminProcedure
  .schema(UpdateUserSchema.merge(z.object({ id: UserIdSchema })))
  .action(async ({ ctx, parsedInput }) => {
    const { id, ...updateData } = parsedInput;
    const serviceResponse = await ctx.svc.updateUser(id, updateData);
    return {
      result: serviceResponse.data,
      message: serviceResponse.message || "Successfully updated user",
      success: serviceResponse.success,
      errors: serviceResponse.errors,
    };
  });
```

**Action File Analysis Output**:

```typescript
{
  serviceName: "User Actions",
  purpose: "Next.js server actions for user management with validation and service layer integration",
  location: "src/services/users/actions.ts",
  type: "Action File",
  pattern: "Service Layer",

  exportedMethods: [
    {
      name: "createUserAction",
      methodType: "action",
      validationSchema: "CreateUserSchema",
      serviceCall: "ctx.svc.createUser",
      parameterMapping: "direct",
      purpose: "Creates user via service with full response wrapping",
      complexity: "Low-Medium",
      responseFormat: "full" // result, message, success, errors
    },
    {
      name: "updateUserAction",
      methodType: "action",
      validationSchema: "UpdateUserSchema + UserIdSchema",
      serviceCall: "ctx.svc.updateUser",
      parameterMapping: "destructured",
      purpose: "Updates user with ID extraction and response wrapping",
      complexity: "Medium",
      responseFormat: "full" // result, message, success, errors
    }
  ],

  dependencies: {
    schemas: ["CreateUserSchema", "UpdateUserSchema", "UserIdSchema"],
    services: ["userService"],
    validation: ["zod"],
    internal: ["adminProcedure"],
    types: ["ServerCtxType"]
  },

  structure: {
    hasAdminProcedure: true,
    hasSchemaValidation: true,
    hasServiceContext: true,
    hasResponseWrapping: true,
    parameterPattern: "mixed"
  },

  responsePatterns: {
    fullWrapper: ["createUserAction", "updateUserAction"],
    simpleWrapper: [],
    direct: []
  },

  patterns: {
    hasValidation: true,        // Schema validation via zod
    hasErrorHandling: true,     // Service layer handles errors
    hasTransactions: false,     // Delegated to service layer
    hasLogging: false,          // Delegated to service layer
    hasAuthorization: true,     // adminProcedure provides auth context
    hasCaching: false
  }
}
```

---

## 🔍 ANALYSIS CHECKLIST

When analyzing a service OR action file, verify you've captured:

**File Identity (Service or Action File)**

- [ ] File name extracted
- [ ] Purpose inferred from code
- [ ] File location noted
- [ ] File type identified (Service vs Action File)
- [ ] Database/pattern detected (Prisma/SQL/ORM/Service Layer)

**Methods Analysis**

- [ ] All public/exported methods listed
- [ ] All private methods listed (for services)
- [ ] Method signatures documented
- [ ] Parameters and types captured
- [ ] Return types noted
- [ ] Async/sync identified
- [ ] For actions: Schema validation identified
- [ ] For actions: Service calls mapped
- [ ] For actions: Parameter mapping analyzed

**Dependencies**

- [ ] Internal service dependencies
- [ ] External library dependencies
- [ ] Database service imports
- [ ] Utility imports
- [ ] For actions: Schema dependencies identified
- [ ] For actions: Service layer imports mapped
- [ ] For actions: Validation library imports noted

**Patterns**

- [ ] Validation patterns detected
- [ ] Error handling patterns noted
- [ ] Transaction usage identified
- [ ] Logging usage noted
- [ ] Authorization patterns found
- [ ] Caching patterns discovered

**Structure**

- [ ] Constructor analyzed (services)
- [ ] Singleton pattern detected (services)
- [ ] Private members identified (services)
- [ ] Static methods found (services)
- [ ] Lifecycle methods noted (services)
- [ ] For actions: adminProcedure pattern identified
- [ ] For actions: Response wrapping patterns analyzed
- [ ] For actions: Parameter processing patterns noted

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
