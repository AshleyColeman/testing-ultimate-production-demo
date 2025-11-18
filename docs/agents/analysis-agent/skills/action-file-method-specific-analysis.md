# Skill 12: ACTION FILE METHOD-SPECIFIC ANALYSIS

## 📋 PURPOSE

Deep analysis of individual action methods within Next.js server action files, with the ability to focus on specific methods as requested by the user.

**Goal**: Analyze action methods, their validation patterns, error handling, and database interactions at a granular level.

---

## 🎯 WHEN TO USE

- When user asks to "analyze this specific method: createUser"
- When user says "per method" analysis for action files
- When user wants focused analysis on particular action methods
- Before creating targeted test plans for specific actions
- When action file has too many methods for full analysis

---

## ⚡ QUICK START

```typescript
// Step 1: Ask user which method to analyze
const selectedMethod = await askUserForMethod(actionFile.methods);

// Step 2: Read entire action file for context
const actionCode = readFile("src/services/users/actions.ts");

// Step 3: Extract method-specific details
const methodAnalysis = extractActionMethod(actionCode, selectedMethod);

// Step 4: Analyze validation schema
const validationSchema = extractValidationSchema(actionCode, selectedMethod);

// Step 5: Map database operations
const dbOperations = analyzeDatabaseOperations(methodAnalysis);

// Step 6: Generate focused test recommendations
const testPlan = generateMethodSpecificTestPlan(methodAnalysis, validationSchema);
```

---

## 🔍 ACTION FILE PATTERNS

### Pattern 1: adminProcedure Wrapper

```typescript
// Most actions follow this pattern:
export const specificAction = adminProcedure
  .schema(ValidationSchema)
  .action(async ({ ctx, parsedInput }) => {
    // Method implementation here
    const result = await ctx.svc.someMethod(parsedInput);
    return { result };
  });
```

**Key components to analyze**:
1. **Validation schema** (`.schema()`) - What input validation occurs
2. **Context setup** (`{ ctx, parsedInput }`) - What context is available
3. **Service call** (`ctx.svc.someMethod()`) - Which service method is called
4. **Return format** - How the result is wrapped/returned

### Pattern 2: Input Parameter Extraction

```typescript
// Some actions destructure input
export const updateUserAction = adminProcedure
  .schema(UpdateUserSchema.merge(z.object({ id: UserIdSchema })))
  .action(async ({ ctx, parsedInput }) => {
    const { id, ...updateData } = parsedInput; // Parameter extraction
    const result = await ctx.svc.updateUser(id, updateData);
    return { result, message: "Successfully updated" };
  });
```

**Look for**:
- Parameter destructuring patterns
- ID extraction from input
- Data transformation before service call

### Pattern 3: Response Formatting

```typescript
// Actions often format responses consistently
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
```

**Response patterns to identify**:
- Success/error formatting
- Message extraction from service response
- Error handling and propagation

---

## 🔍 DETAILED WORKFLOW

### Step 1: Method Discovery and Selection

```typescript
interface ActionMethod {
  name: string;           // "createUserAction"
  exportName: string;     // "createUserAction"
  schemaName: string;     // "CreateUserSchema"
  serviceMethod: string;  // "createUser"
  lineNumber: number;     // Where method is defined
}

// Extract all action methods from file
const methods = extractActionMethods(fileContent);

// Present to user for selection (if not specified)
const selectedMethod = userSelection || methods[0];
```

**User Interaction Pattern**:
```
Agent: I found these action methods in the file:
1. getUserByIdAction (line 59)
2. getAllUsersAction (line 69)
3. createUserAction (line 79)
4. updateUserAction (line 94)
5. deleteUserAction (line 110)
6. searchUsersAction (line 123)

Which method would you like me to analyze specifically?
```

### Step 2: Extract Method Components

```typescript
interface MethodAnalysis {
  // Basic Info
  name: string;
  description: string;
  lineNumber: number;

  // Schema & Validation
  validationSchema: {
    schemaName: string;
    requiredFields: string[];
    optionalFields: string[];
    validationRules: ValidationRule[];
  };

  // Service Integration
  serviceCall: {
    serviceName: string;        // "userService"
    methodName: string;         // "createUser"
    parameterMapping: ParameterMapping[]; // How input maps to service params
  };

  // Response Format
  responseFormat: {
    returnsResult: boolean;
    returnsMessage: boolean;
    returnsSuccess: boolean;
    returnsErrors: boolean;
    customFields: string[];
  };

  // Error Handling
  errorHandling: {
    hasTryCatch: boolean;
    errorPropagation: 'direct' | 'wrapped' | 'transformed';
    customErrorHandling: boolean;
  };
}
```

**Example Analysis**:
```typescript
// For createUserAction:
{
  name: "createUserAction",
  description: "Creates a new user using the user service",
  lineNumber: 79,

  validationSchema: {
    schemaName: "CreateUserSchema",
    requiredFields: ["email", "name"], // extracted from schema
    optionalFields: ["role", "isActive"],
    validationRules: [
      { field: "email", rule: "email format" },
      { field: "email", rule: "unique constraint" },
      { field: "name", rule: "min length 2" }
    ]
  },

  serviceCall: {
    serviceName: "userService",
    methodName: "createUser",
    parameterMapping: [
      { source: "parsedInput", target: "service parameter", type: "direct" }
    ]
  },

  responseFormat: {
    returnsResult: true,      // result: serviceResponse.data
    returnsMessage: true,     // message: serviceResponse.message
    returnsSuccess: true,     // success: serviceResponse.success
    returnsErrors: true,      // errors: serviceResponse.errors
    customFields: []
  },

  errorHandling: {
    hasTryCatch: false,       // relies on service layer
    errorPropagation: "wrapped", // wraps service response
    customErrorHandling: false
  }
}
```

### Step 3: Schema Analysis

```typescript
interface SchemaAnalysis {
  schemaName: string;
  schemaType: "zod" | "custom" | "none";
  baseSchema?: string;        // If it extends/merges another schema
  fieldDetails: FieldDetail[];
}

interface FieldDetail {
  name: string;
  type: string;
  required: boolean;
  validation: ValidationRule[];
  defaultValue?: any;
}

// Extract schema details from imports and usage
const schemaAnalysis = analyzeValidationSchema(method);
```

**Schema Detection Patterns**:
```typescript
// Pattern 1: Direct schema import
.schema(CreateUserSchema) → look for CreateUserSchema import

// Pattern 2: Schema with modifications
.schema(UserFiltersSchema.omit({ search: true })) → analyze base schema + omissions

// Pattern 3: Schema merging
.schema(UpdateUserSchema.merge(z.object({ id: UserIdSchema }))) → analyze both schemas

// Pattern 4: Inline schema
.schema(z.object({ email: z.string().email() })) → extract inline definition
```

### Step 4: Service Method Mapping

```typescript
interface ServiceMapping {
  contextService: string;     // "userService" from ctx.svc
  serviceMethod: string;      // "createUser"
  parameterStyle: "direct" | "destructured" | "transformed";

  // How action input maps to service parameters
  parameterMap: ParameterMap[];
}

interface ParameterMap {
  source: string;             // "parsedInput", "parsedInput.id", "id"
  target: string;             // service parameter name
  transformation?: string;    // "const { id, ...rest } = parsedInput"
}

// Example mappings:
// Direct: ctx.svc.createUser(parsedInput)
// Destructured: const { id, ...data } = parsedInput; ctx.svc.updateUser(id, data)
// Transformed: ctx.svc.createUser({ ...parsedInput, isActive: true })
```

### Step 5: Database Operation Inference

```typescript
// Since actions call services, infer DB operations from service patterns
interface DatabaseInference {
  operationType: "CREATE" | "READ" | "UPDATE" | "DELETE" | "SEARCH";
  primaryTable: string;       // Inferred from service method name
  affectedTables: string[];   // Based on typical service patterns
  hasCascades: boolean;       // Based on operation type and table
}

// Inference rules:
const dbInference = {
  "createUser": { operation: "CREATE", table: "users", cascades: false },
  "deleteUser": { operation: "DELETE", table: "users", cascades: true },  // FK cascades
  "updateUser": { operation: "UPDATE", table: "users", cascades: false },
  "getUserById": { operation: "READ", table: "users", cascades: false },
  "searchUsers": { operation: "SEARCH", table: "users", cascades: false }
};
```

---

## 📊 OUTPUT FORMAT

### Method Analysis Report

```typescript
interface ActionMethodAnalysis {
  // Method Identification
  methodName: string;
  fileName: string;
  location: string;

  // Purpose & Behavior
  purpose: string;
  description: string;

  // Input Analysis
  inputSchema: {
    schemaName: string;
    requiredFields: string[];
    optionalFields: string[];
    validationRules: ValidationRule[];
  };

  // Service Integration
  serviceCall: {
    serviceContext: string;   // "ctx.svc"
    serviceName: string;      // "userService"
    methodCalled: string;     // "createUser"
    parameterMapping: string; // How input flows to service
  };

  // Response Format
  responseStructure: {
    success: boolean;
    message: boolean;
    data: boolean;
    errors: boolean;
    customFields?: string[];
  };

  // Database Impact (Inferred)
  databaseImpact: {
    operation: "CREATE" | "READ" | "UPDATE" | "DELETE";
    primaryTable: string;
    estimatedTables: string[];
    cascadeRisk: "NONE" | "LOW" | "MEDIUM" | "HIGH";
  };

  // Error Strategy
  errorHandling: {
    validationErrors: "throws" | "returns" | "depends on service";
    serviceErrors: "propagates" | "wraps" | "transforms";
    hasCustomHandling: boolean;
  };
}
```

---

## 💡 EXAMPLES

### Example 1: Analyzing createUserAction

**Action Method Code**:
```typescript
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
```

**Method-Specific Analysis**:
```typescript
{
  methodName: "createUserAction",
  fileName: "src/services/users/actions.ts",
  location: "line 79-89",

  purpose: "Creates a new user using the user service with proper response formatting",
  description: "Validates input using CreateUserSchema, calls userService.createUser, and formats the response with success/error information",

  inputSchema: {
    schemaName: "CreateUserSchema",
    requiredFields: ["email", "name"], // Would need to analyze schema file
    optionalFields: ["role", "isActive"],
    validationRules: [
      { field: "email", rule: "valid email format" },
      { field: "email", rule: "unique constraint" },
      { field: "name", rule: "required string" }
    ]
  },

  serviceCall: {
    serviceContext: "ctx.svc",
    serviceName: "userService",
    methodCalled: "createUser",
    parameterMapping: "direct pass-through of parsedInput"
  },

  responseStructure: {
    success: true,      // serviceResponse.success
    message: true,      // serviceResponse.message || default
    data: true,         // serviceResponse.data as "result"
    errors: true,       // serviceResponse.errors
    customFields: []
  },

  databaseImpact: {
    operation: "CREATE",
    primaryTable: "users",
    estimatedTables: ["users"],
    cascadeRisk: "LOW"  // Creation typically has low cascade risk
  },

  errorHandling: {
    validationErrors: "throws by adminProcedure wrapper",
    serviceErrors: "wraps in response format",
    hasCustomHandling: false
  }
}
```

### Example 2: Analyzing updateUserAction (with parameter destructuring)

**Action Method Code**:
```typescript
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

**Method-Specific Analysis**:
```typescript
{
  methodName: "updateUserAction",
  location: "line 94-105",

  purpose: "Updates an existing user with ID separation",
  description: "Merges UpdateUserSchema with ID, extracts ID from input, calls userService.updateUser with separate parameters",

  inputSchema: {
    schemaName: "UpdateUserSchema + UserIdSchema (merged)",
    requiredFields: ["id"], // from UserIdSchema
    optionalFields: ["email", "name", "role", "isActive"], // from UpdateUserSchema
    validationRules: [
      { field: "id", rule: "valid user ID format" },
      { field: "email", rule: "optional email format" },
      // ... other fields
    ]
  },

  serviceCall: {
    serviceContext: "ctx.svc",
    serviceName: "userService",
    methodCalled: "updateUser",
    parameterMapping: "destructured: const { id, ...updateData } = parsedInput → updateUser(id, updateData)"
  },

  responseStructure: {
    success: true,
    message: true,
    data: true,
    errors: true
  },

  databaseImpact: {
    operation: "UPDATE",
    primaryTable: "users",
    estimatedTables: ["users"],
    cascadeRisk: "MEDIUM"  // Updates could affect related records
  },

  errorHandling: {
    validationErrors: "throws by adminProcedure",
    serviceErrors: "wraps in response format",
    hasCustomHandling: false
  }
}
```

### Example 3: Analyzing deleteUserAction (high cascade risk)

**Action Method Code**:
```typescript
export const deleteUserAction = adminProcedure
  .schema(UserIdActionSchema)
  .action(async ({ ctx, parsedInput }) => {
    const result = await ctx.svc.deleteUser(parsedInput.userId);
    return {
      result,
      message: "Successfully deleted user",
    };
  });
```

**Method-Specific Analysis**:
```typescript
{
  methodName: "deleteUserAction",
  location: "line 110-118",

  purpose: "Deletes a user by ID with simple response format",
  description: "Validates userId using UserIdActionSchema, calls userService.deleteUser, returns simple success message",

  inputSchema: {
    schemaName: "UserIdActionSchema",
    requiredFields: ["userId"],
    optionalFields: [],
    validationRules: [
      { field: "userId", rule: "valid user ID format" }
    ]
  },

  serviceCall: {
    serviceContext: "ctx.svc",
    serviceName: "userService",
    methodCalled: "deleteUser",
    parameterMapping: "field extraction: parsedInput.userId → deleteUser(userId)"
  },

  responseStructure: {
    success: false,      // No explicit success field
    message: true,       // Static success message
    data: true,          // result from service
    errors: false        // No explicit error field
  },

  databaseImpact: {
    operation: "DELETE",
    primaryTable: "users",
    estimatedTables: ["users", "user_profiles", "sessions", "audit_logs"], // likely FK relationships
    cascadeRisk: "HIGH"  // DELETE operations often have FK cascades
  },

  errorHandling: {
    validationErrors: "throws by adminProcedure",
    serviceErrors: "direct propagation", // No wrapping
    hasCustomHandling: false
  }
}
```

---

## 🧪 METHOD-SPECIFIC TEST RECOMMENDATIONS

### Test Recommendation Framework per Method

```typescript
interface MethodTestPlan {
  methodName: string;
  totalTests: number;
  testCategories: {
    validation: number;      // Schema validation tests
    serviceIntegration: number; // Service call tests
    responseFormat: number;  // Response wrapping tests
    errorHandling: number;   // Error scenario tests
    database: number;        // Database impact tests (inferred)
  };
  testScenarios: TestScenario[];
}
```

### Recommendation Templates by Method Type

#### CREATE Methods (e.g., createUserAction)

```typescript
const createMethodTests = {
  validation: [
    "Valid input passes schema validation",
    "Missing required field fails validation",
    "Invalid email format fails validation",
    "Duplicate unique field fails validation"
  ],
  serviceIntegration: [
    "Valid input calls service.createUser correctly",
    "Service error is properly handled",
    "Service response data is returned correctly"
  ],
  responseFormat: [
    "Response contains result field",
    "Response contains success field",
    "Response contains message field",
    "Response contains errors field when applicable"
  ],
  database: [
    "Valid data creates record in database",
    "Validation error does not create database record",
    "Service error does not create database record"
  ]
};
```

#### READ Methods (e.g., getUserByIdAction)

```typescript
const readMethodTests = {
  validation: [
    "Valid ID format passes validation",
    "Invalid ID format fails validation",
    "Missing ID fails validation"
  ],
  serviceIntegration: [
    "Valid ID calls service.getUserById",
    "Service returns user data correctly",
    "Service returns null for non-existent user"
  ],
  responseFormat: [
    "User data wrapped in result field",
    "Null result handled correctly",
    "Response structure consistent"
  ],
  database: [
    "Existing user is found",
    "Non-existent user returns null",
    "No database modifications occur"
  ]
};
```

#### UPDATE Methods (e.g., updateUserAction)

```typescript
const updateMethodTests = {
  validation: [
    "Valid ID + update data passes validation",
    "Invalid ID fails validation",
    "Invalid update data fails validation",
    "Missing ID fails validation"
  ],
  serviceIntegration: [
    "Parameters correctly destructured to service",
    "Service update called with correct parameters",
    "Partial updates handled correctly"
  ],
  responseFormat: [
    "Updated user data returned",
    "Success message included",
    "Error responses formatted correctly"
  ],
  database: [
    "Existing record is updated",
    "Non-existent record handled correctly",
    "Only specified fields are updated"
  ]
};
```

#### DELETE Methods (e.g., deleteUserAction)

```typescript
const deleteMethodTests = {
  validation: [
    "Valid ID passes validation",
    "Invalid ID fails validation",
    "Missing ID fails validation"
  ],
  serviceIntegration: [
    "Service delete called with correct ID",
    "Service confirmation returned",
    "Service errors handled correctly"
  ],
  responseFormat: [
    "Success message returned",
    "Result field contains service response",
    "Error responses formatted"
  ],
  database: [
    "Record is deleted from database",
    "Cascade effects verified (if applicable)",
    "Non-existent record handled"
  ]
};
```

---

## 🔍 ANALYSIS CHECKLIST

When analyzing an action method, verify you've captured:

**Method Identification**
- [ ] Method name and export name
- [ ] Line number location
- [ ] Brief purpose/description
- [ ] Method signature pattern

**Input Validation Analysis**
- [ ] Schema name and type identified
- [ ] Required vs optional fields mapped
- [ ] Validation rules extracted
- [ ] Schema modifications noted (omit, merge, extend)

**Service Integration**
- [ ] Service context identified (ctx.svc)
- [ ] Service method name extracted
- [ ] Parameter mapping analyzed
- [ ] Data transformation noted

**Response Format Analysis**
- [ ] Return structure mapped
- [ ] Success/error handling identified
- [ ] Custom response fields noted
- [ ] Message formatting analyzed

**Error Handling Strategy**
- [ ] Validation error behavior identified
- [ ] Service error propagation noted
- [ ] Custom error handling detected
- [ ] Error response format analyzed

**Database Impact Assessment**
- [ ] Operation type inferred (CRUD)
- [ ] Primary table identified
- [ ] Cascade risk assessed
- [ ] Related tables estimated

**Test Recommendations**
- [ ] Validation tests specified
- [ ] Service integration tests planned
- [ ] Response format tests included
- [ ] Error scenario tests covered
- [ ] Database impact tests considered

---

## 🚨 COMMON PITFALLS

### Pitfall 1: Not Understanding Schema Composition

**Problem**: Missing the fact that schemas are merged or modified

**Solution**: Analyze schema chains completely

```typescript
// ❌ WRONG - Only looking at schema name
.schema(UpdateUserSchema.merge(z.object({ id: UserIdSchema })))
→ Schema: "UpdateUserSchema"  // INCOMPLETE

// ✅ CORRECT - Analyze the composition
.schema(UpdateUserSchema.merge(z.object({ id: UserIdSchema })))
→ Schema: "UpdateUserSchema + UserIdSchema (merged)"
→ Required: ["id"] + UpdateUserSchema.required
→ Optional: UpdateUserSchema.optional
→ Validation: UpdateUserSchema.rules + UserIdSchema.rules
```

### Pitfall 2: Missing Parameter Transformations

**Problem**: Not noticing how input parameters are transformed before service call

**Solution**: Map parameter flow completely

```typescript
// ❌ WRONG - Assuming direct parameter pass
.action(async ({ ctx, parsedInput }) => {
  const { id, ...updateData } = parsedInput; // MISSED THIS
  await ctx.svc.updateUser(parsedInput);     // WRONG ASSUMPTION
})

// ✅ CORRECT - Track parameter transformation
.action(async ({ ctx, parsedInput }) => {
  const { id, ...updateData } = parsedInput; // Parameter extraction
  await ctx.svc.updateUser(id, updateData);  // Correct mapping
})
→ Parameter mapping: parsedInput → { id, updateData } → updateUser(id, updateData)
```

### Pitfall 3: Ignoring Response Format Differences

**Problem**: Assuming all actions have the same response format

**Solution**: Analyze each action's response pattern

```typescript
// Action 1 - Full response wrapper
return {
  result: serviceResponse.data,
  message: serviceResponse.message,
  success: serviceResponse.success,
  errors: serviceResponse.errors,
};

// Action 2 - Simple response
return {
  result,
  message: "Successfully deleted user",
};

// These need different test approaches!
```

### Pitfall 4: Missing Database Cascade Implications

**Problem**: Not considering that actions calling delete services might have FK cascades

**Solution**: Infer database impact from service method patterns

```typescript
// ❌ WRONG - Only looking at action code
export const deleteUserAction = adminProcedure...
→ Database impact: UNKNOWN

// ✅ CORRECT - Infer from service method name and type
await ctx.svc.deleteUser(parsedInput.userId);
→ Database impact: DELETE from users table
→ Cascade risk: HIGH (delete operations often have FK cascades)
→ Related tables: user_profiles, sessions, orders, etc.
```

---

## 🎯 SUCCESS CRITERIA

Method-specific analysis is complete when you can answer:

1. **Method Purpose**: What does this specific action method do? (One sentence)
2. **Input Validation**: What schema validates the input and what are its rules?
3. **Service Integration**: Which service method is called and with what parameters?
4. **Response Format**: How is the service response wrapped or transformed?
5. **Error Handling**: How are validation and service errors handled?
6. **Database Impact**: What database operations occur (inferred from service call)?
7. **Test Requirements**: What specific test scenarios does this method need?

If you can answer all 7 questions with detailed, method-specific information, your analysis is complete ✅

---

## 📚 NEXT STEPS

After completing method-specific analysis:

1. **Generate Targeted Test Plan**: Create test scenarios specific to this method
2. **Document Schema Requirements**: Specify exact validation rules to test
3. **Map Service Dependencies**: Identify which service methods need mocking
4. **Define Test Data Requirements**: Specify what test data this method needs
5. **Ready for Integration**: Provide focused analysis to Integration Test Agent

---

**File**: action-file-method-specific-analysis.md
**Skill**: 12
**Status**: Production-Ready
**Purpose**: Enable focused, method-specific analysis of Next.js server action files