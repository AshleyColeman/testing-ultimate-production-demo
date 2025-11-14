---
name: Action Pattern Analysis Skill
title: ACTION PATTERN ANALYSIS - Detect Validation, Authorization & Orchestration
description: >
  Analyze action files to detect validation schemas, authorization procedures,
  service orchestration patterns, and determine the correct test approach for actions.
---

# 🔍 ACTION PATTERN ANALYSIS

**Purpose**: Automatically detect and analyze Action layer patterns to determine the correct testing approach.

**When to Use**: **ALWAYS FIRST** when testing actions (services use a different analysis skill).

**Triggers**: "analyze action", "detect validation", "authorization patterns", "action discovery", "read action file"

---

## 🎯 WHAT THIS SKILL DOES

### Core Capabilities

- ✅ **Detect Action Layer Patterns** - Identify validation, authorization, orchestration
- ✅ **Analyze Validation Schemas** - Extract Zod schema definitions and validation rules
- ✅ **Identify Authorization Levels** - Detect adminProcedure, userProcedure, publicProcedure
- ✅ **Map Service Dependencies** - Find which services the action orchestrates
- ✅ **Detect Cache Invalidation** - Identify revalidatePath calls
- ✅ **Extract Error Handling** - Analyze response formatting and error patterns

### Detection Patterns

```typescript
// 1. Action Structure Detection
export const createUserAction = async (input: any) => {
  const { parsedInput, ctx } = await adminProcedure
    .schema(CreateUserSchema)
    .action(input);

  const result = await ctx.svc.get('userService').create(parsedInput);

  if (result.success) {
    revalidatePath('/users', 'layout');
  }

  return result;
}
```

---

## 🔧 ANALYSIS WORKFLOW

### Step 1: Read Action File Completely

```typescript
// ALWAYS read the entire action file first
const actionFileContent = await fs.readFileSync('./src/services/users/actions.ts', 'utf8');

// Look for these patterns:
const patterns = {
  procedures: ['adminProcedure', 'userProcedure', 'publicProcedure'],
  schemas: ['Schema', 'Validation'], // Zod schemas
  serviceCalls: ['ctx.svc.get', 'serviceFactory'],
  cacheInvalidation: ['revalidatePath'],
  errorHandling: ['try/catch', 'result.success', 'errors']
};
```

### Step 2: Identify Authorization Procedures

```typescript
// Detect authorization level
const detectAuthorization = (actionCode) => {
  if (actionCode.includes('adminProcedure')) {
    return { level: 'admin', requiresAuth: true };
  }
  if (actionCode.includes('userProcedure')) {
    return { level: 'user', requiresAuth: true };
  }
  if (actionCode.includes('publicProcedure')) {
    return { level: 'public', requiresAuth: false };
  }
  return { level: 'unknown', requiresAuth: false };
};
```

### Step 3: Extract Validation Schemas

```typescript
// Find Zod schema definitions
const extractSchemas = (actionCode) => {
  const schemas = [];

  // Look for z.object patterns
  const schemaMatches = actionCode.match(/const \w+Schema = z\.object\([^}]+\}/g);

  schemaMatches?.forEach(match => {
    const schemaName = match.match(/const (\w+)Schema/)[1];
    schemas.push({
      name: schemaName,
      definition: match,
      validations: parseValidations(match)
    });
  });

  return schemas;
};

const parseValidations = (schemaDefinition) => {
  const validations = [];

  if (schemaDefinition.includes('.email()')) validations.push('email');
  if (schemaDefinition.includes('.min(')) validations.push('minLength');
  if (schemaDefinition.includes('.max(')) validations.push('maxLength');
  if (schemaDefinition.includes('.optional()')) validations.push('optional');

  return validations;
};
```

### Step 4: Map Service Dependencies

```typescript
// Find which services the action calls
const extractServiceDependencies = (actionCode) => {
  const services = [];
  const serviceMatches = actionCode.match(/ctx\.svc\.get\(['"]([^'"]+)['"]\)/g);

  serviceMatches?.forEach(match => {
    const serviceName = match.match(/ctx\.svc\.get\(['"]([^'"]+)['"]\)/)[1];
    services.push(serviceName);
  });

  return services;
};
```

### Step 5: Detect Cache Invalidation

```typescript
// Find cache invalidation patterns
const extractCacheInvalidation = (actionCode) => {
  const cacheMatches = actionCode.match(/revalidatePath\(['"]([^'"]+)['"]/g);

  return cacheMatches?.map(match => {
    const path = match.match(/revalidatePath\(['"]([^'"]+)['"]/)[1];
    return { path, type: 'path' };
  }) || [];
};
```

---

## 📊 ANALYSIS RESULTS

### Output Structure

```typescript
interface ActionAnalysisResult {
  // Basic Info
  fileName: string;
  actionName: string;

  // Authorization
  authorization: {
    level: 'admin' | 'user' | 'public' | 'unknown';
    requiresAuth: boolean;
    procedure: string;
  };

  // Validation
  validation: {
    hasSchemas: boolean;
    schemas: Array<{
      name: string;
      type: 'zod';
      validations: string[];
    }>;
  };

  // Service Dependencies
  services: Array<{
    name: string;
    method: string;
  }>;

  // Cache Behavior
  cacheInvalidation: Array<{
    path: string;
    type: string;
  }>;

  // Error Handling
  errorHandling: {
    hasTryCatch: boolean;
    returnsStandardFormat: boolean;
    errorPaths: string[];
  };

  // Test Strategy
  testStrategy: {
    type: 'action';
    focusAreas: string[];
    errorScenarios: string[];
    happyPaths: string[];
  };
}
```

### Example Analysis Result

```typescript
// For createUserAction analysis:
const analysisResult = {
  fileName: 'actions.ts',
  actionName: 'createUserAction',

  authorization: {
    level: 'admin',
    requiresAuth: true,
    procedure: 'adminProcedure'
  },

  validation: {
    hasSchemas: true,
    schemas: [{
      name: 'CreateUser',
      type: 'zod',
      validations: ['email', 'minLength', 'required']
    }]
  },

  services: [{
    name: 'userService',
    method: 'create'
  }],

  cacheInvalidation: [{
    path: '/users',
    type: 'path'
  }],

  errorHandling: {
    hasTryCatch: false,
    returnsStandardFormat: true,
    errorPaths: ['result.success', 'result.errors']
  },

  testStrategy: {
    type: 'action',
    focusAreas: [
      'validation.schema.email',
      'authorization.admin',
      'service.orchestration.userService',
      'cache.invalidation'
    ],
    errorScenarios: [
      'invalid.email.format',
      'missing.required.fields',
      'insufficient.permissions',
      'service.failure.propagation'
    ],
    happyPaths: [
      'valid.input.admin.auth',
      'service.call.success',
      'cache.invalidation.executed',
      'response.format.correct'
    ]
  }
};
```

---

## 🧪 TEST PLANNING BASED ON ANALYSIS

### Validation Test Cases

```typescript
// Based on extracted validations
const generateValidationTests = (schemas) => {
  const tests = [];

  schemas.forEach(schema => {
    schema.validations.forEach(validation => {
      switch (validation) {
        case 'email':
          tests.push({
            name: `Invalid email format for ${schema.name}Schema`,
            input: { email: 'invalid-email' },
            expectedError: 'Invalid email format'
          });
          break;
        case 'minLength':
          tests.push({
            name: `Minimum length violation for ${schema.name}Schema`,
            input: { name: '' },
            expectedError: 'Name is required'
          });
          break;
      }
    });
  });

  return tests;
};
```

### Authorization Test Cases

```typescript
// Based on detected authorization level
const generateAuthTests = (authorization) => {
  const tests = [];

  if (authorization.level === 'admin') {
    tests.push({
      name: 'Authorization fails with non-admin user',
      context: { user: { role: 'user' } },
      expectedError: 'Insufficient permissions'
    });

    tests.push({
      name: 'Authorization fails with no authentication',
      context: {},
      expectedError: 'Authentication required'
    });
  }

  return tests;
};
```

### Service Orchestration Test Cases

```typescript
// Based on detected service dependencies
const generateServiceTests = (services) => {
  const tests = [];

  services.forEach(service => {
    tests.push({
      name: `Service ${service.name}.${service.method} called correctly`,
      verify: 'service.mock.calledWith',
      mockData: generateValidInputForService()
    });

    tests.push({
      name: `Service ${service.name} failure propagates correctly`,
      mockService: {
        [service.name]: {
          [service.method]: vi.fn().mockRejectedValue(new Error('Service error'))
        }
      },
      expectedError: 'Service error'
    });
  });

  return tests;
};
```

---

## 🔍 COMMON ACTION PATTERNS

### CRUD Action Pattern

```typescript
// Create Action
export const createEntityAction = async (input: any) => {
  const { parsedInput, ctx } = await adminProcedure
    .schema(CreateEntitySchema)
    .action(input);

  const result = await ctx.svc.get('entityService').create(parsedInput);

  if (result.success) {
    revalidatePath('/entities', 'layout');
  }

  return result;
}

// Analysis Result:
// - Authorization: admin
// - Validation: CreateEntitySchema
// - Service: entityService.create
// - Cache: /entities path invalidation
```

### Query Action Pattern

```typescript
// Get by ID Action
export const getEntityByIdAction = async (input: any) => {
  const { parsedInput, ctx } = await userProcedure
    .schema(IdSchema)
    .action(input);

  const entity = await ctx.svc.get('entityService').getById(parsedInput);

  return {
    data: entity,
    success: !!entity,
    message: entity ? 'Entity found' : 'Entity not found'
  };
}

// Analysis Result:
// - Authorization: user
// - Validation: IdSchema
// - Service: entityService.getById
// - Response: Custom format with data/success/message
```

### List Action Pattern

```typescript
// List with Pagination Action
export const listEntitiesAction = async (input: any) => {
  const { parsedInput, ctx } = await publicProcedure
    .schema(ListSchema)
    .action(input);

  const result = await ctx.svc.get('entityService').getAll(parsedInput);
  return result;
}

// Analysis Result:
// - Authorization: public
// - Validation: ListSchema (pagination)
// - Service: entityService.getAll
// - Response: Direct service result
```

---

## 📋 ANALYSIS CHECKLIST

Before proceeding to test generation, verify:

### Structural Analysis
- [x] Action file completely read and parsed
- [x] All export functions identified
- [x] Action patterns detected (procedure + schema + service)

### Authorization Analysis
- [x] Procedure type identified (admin/user/public)
- [x] Authentication requirements determined
- [x] Context structure understood

### Validation Analysis
- [x] All Zod schemas extracted
- [x] Validation rules identified for each schema
- [x] Required vs optional fields mapped
- [x] Validation error patterns understood

### Service Analysis
- [x] All service dependencies identified
- [x] Service method calls mapped
- [x] Service error handling patterns detected

### Behavioral Analysis
- [x] Cache invalidation patterns identified
- [x] Response formatting understood
- [x] Error handling approach analyzed

### Test Strategy
- [x] Happy path test scenarios planned
- [x] Validation error test scenarios planned
- [x] Authorization error test scenarios planned
- [x] Service failure test scenarios planned

---

## 🚨 TROUBLESHOOTING

### Common Analysis Issues

**Issue**: Cannot determine authorization level
```typescript
// Action has no explicit procedure
export const someAction = async (input: any) => {
  // No adminProcedure, userProcedure, or publicProcedure
}

// Solution: Default to 'unknown' and test both auth and non-auth scenarios
```

**Issue**: Schema definition not found
```typescript
// Schema imported from another file
import { CreateUserSchema } from './_data/schema';

// Solution: Parse import statements and read schema files
```

**Issue**: Complex service orchestration
```typescript
// Action calls multiple services
const user = await ctx.svc.get('userService').create(userData);
const notification = await ctx.svc.get('notificationService').send(user);

// Solution: Track all service calls and test orchestration flow
```

**Issue**: Dynamic authorization logic
```typescript
// Authorization depends on input data
const procedure = input.isAdmin ? adminProcedure : userProcedure;

// Solution: Identify conditional patterns and test both paths
```

---

## 📚 RELATED SKILLS

- **Skill 13**: Test Actions - Uses this analysis to generate actual tests
- **Skill 4**: Create Dynamic Schema - Sets up database based on service dependencies
- **Skill 9**: Test Error Scenarios - Enhanced for action validation/auth errors
- **Skill 11**: Self-Healing Tests - Fixes action-specific test issues

---

**File**: action-pattern-analysis.md
**Date**: November 14, 2025
**Status**: Complete and Production-Ready
**For**: Integration test agents that need to understand and test Action layer patterns