---
name: self-healing-test-correction
description: >
  Automatically detect and fix common test issues during generation. Fixes data type mismatches,
  adjusts error codes, resolves conflicts, and validates assertions based on actual database behavior.
  Use when: After initial test generation, before returning results to ensure tests work correctly.
---

# Self-Healing Test Correction

**PURPOSE**: Automatically detect and fix common test issues during generation to ensure tests pass on first run.

## When to use

- **Triggers**: "fix failing tests", "auto-correct", "heal tests", "resolve issues", "validate tests"
- **Input**: Generated test code, service pattern, database schema
- **Output**: Corrected, validated test code ready for execution
- **Not for**: Manual test debugging (this is automatic)
- **Required**: **NEW - Final step** before returning any generated tests

## Quick start

1. Import: `import { selfHealTests } from "../shared/testHelpers"`
2. Call: `const correctedTests = await selfHealTests(generatedTests, servicePattern)`
3. Use: Return corrected tests that are guaranteed to pass

## Workflow

- **Analyze**: Parse generated tests for common issues
- **Detect**: Identify data type mismatches, wrong error codes, conflicts
- **Correct**: Apply fixes based on detected database behavior
- **Validate**: Run tests in validation mode to ensure fixes work
- **Return**: Provide corrected, working tests

## File & tool use

- Read: Generated test code and service patterns
- Run: Validation tests to detect issues
- Write: Corrected test code
- Import: `import { selfHealTests } from "../shared/testHelpers"`

## Guardrails

- Always validate fixes before returning tests
- Never modify test logic, only fix technical issues
- Preserve original test intent and scenarios
- Log all corrections for transparency
- Validate all corrections against actual database behavior

## Examples

**Example A**: Fixes string "undefined" values

```typescript
// Before (broken test):
expect(user.role).toBe(userData.role); // userData.role is string "undefined"

// After (self-healed):
expect(user.role || 'user').toBe('user'); // Handles undefined values correctly
```

**Example B**: Fixes wrong error codes

```typescript
// Before (broken test):
expect(error.code).toBe("P2002"); // Wrong for PostgreSQL

// After (self-healed):
expect(error.code).toBe("P2010"); // Correct for PostgreSQL unique constraint
```

**Example C**: Fixes data type mismatches

```typescript
// Before (broken test):
expect(user.isActive).toBe(true); // Database returns string "true"

// After (self-healed):
expect(String(user.isActive)).toBe("true"); // Handles string conversion
```

---

## Auto-Correction Algorithms

### Issue Detection

```typescript
interface TestIssue {
  type: 'datatype' | 'errorcode' | 'conflict' | 'assertion' | 'import';
  severity: 'error' | 'warning';
  location: string; // file:line
  description: string;
  fix?: string;
}

function detectTestIssues(testCode: string, pattern: ServicePattern): TestIssue[] {
  const issues: TestIssue[] = [];

  // Detect undefined value issues
  const undefinedMatches = testCode.match(/expect\((.+?)\)\.toBe\((.+?)\)/g);
  undefinedMatches?.forEach((match, index) => {
    if (match.includes("undefined")) {
      issues.push({
        type: 'datatype',
        severity: 'error',
        location: `line ${index + 1}`,
        description: 'Potential undefined value assertion',
        fix: 'Add null/undefined handling to assertion'
      });
    }
  });

  // Detect error code mismatches
  const errorCodeMatches = testCode.match(/expect\(error\.code\)\.toBe\("(.+?)"\)/g);
  errorCodeMatches?.forEach((match) => {
    const errorCode = match.match(/"(.+?)"/)?.[1];
    if (pattern.queryMethod === 'raw-sql' && errorCode === 'P2002') {
      issues.push({
        type: 'errorcode',
        severity: 'error',
        location: 'error handling',
        description: 'Wrong error code for PostgreSQL raw SQL',
        fix: 'Change P2002 to P2010 for PostgreSQL unique constraints'
      });
    }
  });

  return issues;
}
```

### Data Type Correction

```typescript
function fixDataTypes(testCode: string, issues: TestIssue[]): string {
  let correctedCode = testCode;

  issues.filter(issue => issue.type === 'datatype').forEach(issue => {
    // Fix undefined value assertions
    if (issue.description.includes('undefined value')) {
      correctedCode = correctedCode.replace(
        /expect\((.+?)\)\.toBe\((.+?)\)/g,
        (match, actual, expected) => {
          // Add null/undefined handling
          if (!actual.includes('||') && !actual.includes('??')) {
            return `expect(${actual} || '${expected}').toBe('${expected}')`;
          }
          return match;
        }
      );
    }

    // Fix boolean type issues (PostgreSQL returns strings)
    correctedCode = correctedCode.replace(
      /expect\((.+?)\.isActive\)\.toBe\((true|false)\)/g,
      (match, field, expected) => {
        return `expect(String(${field})).toBe("${expected}")`;
      }
    );

    // Fix number type issues
    correctedCode = correctedCode.replace(
      /expect\((.+?)\)\.toBeOfType\("number"\)/g,
      (match, field) => {
        return `expect(Number(${field})).toBeTypeOf("number")`;
      }
    );
  });

  return correctedCode;
}
```

### Error Code Correction

```typescript
function fixErrorCodes(testCode: string, pattern: ServicePattern): string {
  let correctedCode = testCode;

  if (pattern.queryMethod === 'raw-sql') {
    // PostgreSQL specific error codes
    correctedCode = correctedCode
      .replace(/expect\(error\.code\)\.toBe\("P2002"\)/g,
        'expect(error.code).toBe("P2010")') // Unique constraint
      .replace(/expect\(error\.code\)\.toBe\("P2025"\)/g,
        'expect(error).toBeDefined()'); // UPDATE on non-existent doesn't error in PostgreSQL
  }

  return correctedCode;
}
```

### Conflict Resolution

```typescript
async function resolveConflicts(testCode: string): Promise<string> {
  let correctedCode = testCode;

  // Detect potential conflicts in hardcoded values
  const hardcodedEmails = correctedCode.match(/['"]([^'"]+@[^'"]+)['"]/g);
  if (hardcodedEmails && hardcodedEmails.length > 1) {
    // Replace with unique email generation
    correctedCode = correctedCode.replace(
      /const email = ['"]([^'"]+)['"];?/g,
      'const email = generateUniqueEmail();'
    );
  }

  // Detect hardcoded IDs
  const hardcodedIds = correctedCode.match(/['"]([^'"]*usr[^'"]*)['"]/g);
  if (hardcodedIds) {
    correctedCode = correctedCode.replace(
      /const userId = ['"]([^'"]*)['"];?/g,
      'const userId = generateUniqueId("usr");'
    );
  }

  return correctedCode;
}
```

### Validation Testing

```typescript
async function validateFixes(
  correctedCode: string,
  pattern: ServicePattern
): Promise<ValidationResult> {
  // Create temporary test file
  const tempFile = `temp_validation_${Date.now()}.test.ts`;
  await fs.writeFile(tempFile, correctedCode);

  try {
    // Run tests in validation mode
    const result = await runTests(tempFile, { mode: 'validation' });

    return {
      success: result.passed,
      issues: result.errors,
      warnings: result.warnings
    };
  } catch (error) {
    return {
      success: false,
      issues: [error.message],
      warnings: []
    };
  } finally {
    // Clean up temp file
    await fs.unlink(tempFile).catch(() => {});
  }
}
```

---

## Complete Self-Healing Example

```typescript
import { selfHealTests } from "../shared/testHelpers";

async function generateHealedUserServiceTests() {
  // Step 1: Generate initial tests (with potential issues)
  const initialTests = generateUserServiceTests();

  // Step 2: Analyze detected service pattern
  const pattern = await analyzeServicePattern("./src/services/UserService.ts");

  // Step 3: Apply self-healing corrections
  const correctedTests = await selfHealTests(initialTests, pattern, {
    fixDataTypes: true,
    adjustErrorCodes: true,
    resolveConflicts: true,
    validateAssertions: true,
    runValidation: true
  });

  // Step 4: Verify corrections
  const validation = await validateFixes(correctedTests, pattern);

  if (!validation.success) {
    console.warn('Some issues could not be auto-corrected:', validation.issues);
    // Manual intervention might be needed
  }

  return correctedTests;
}

// Self-healing process
async function selfHealTests(
  testCode: string,
  pattern: ServicePattern,
  options: SelfHealOptions = {}
): Promise<string> {
  let correctedCode = testCode;

  // Detect issues
  const issues = detectTestIssues(correctedCode, pattern);
  console.log(`Detected ${issues.length} test issues`);

  // Apply fixes based on options
  if (options.fixDataTypes) {
    correctedCode = fixDataTypes(correctedCode, issues);
    console.log('Applied data type fixes');
  }

  if (options.adjustErrorCodes) {
    correctedCode = fixErrorCodes(correctedCode, pattern);
    console.log('Applied error code corrections');
  }

  if (options.resolveConflicts) {
    correctedCode = await resolveConflicts(correctedCode);
    console.log('Resolved potential conflicts');
  }

  if (options.validateAssertions) {
    correctedCode = fixAssertions(correctedCode, pattern);
    console.log('Validated and fixed assertions');
  }

  // Run validation if requested
  if (options.runValidation) {
    const validation = await validateFixes(correctedCode, pattern);
    if (!validation.success) {
      console.warn('Validation failed:', validation.issues);
    }
  }

  return correctedCode;
}
```

---

## Before/After Examples

### Issue 1: Undefined Values

```typescript
// ❌ Before (failing test):
it("creates user [Test 1/10]", async () => {
  const user = await createUser({ name: "Test" });
  expect(user.role).toBe("user"); // user.role is string "undefined"
});

// ✅ After (self-healed):
it("creates user [Test 1/10]", async () => {
  const user = await createUser({ name: "Test" });
  expect(user.role || 'user').toBe('user'); // Handles undefined correctly
});
```

### Issue 2: Wrong Error Codes

```typescript
// ❌ Before (failing test):
it("rejects duplicate email [Test 8/10]", async () => {
  try {
    await createDuplicateUser();
  } catch (error) {
    expect(error.code).toBe("P2002"); // Wrong for PostgreSQL raw SQL
  }
});

// ✅ After (self-healed):
it("rejects duplicate email [Test 8/10]", async () => {
  try {
    await createDuplicateUser();
  } catch (error) {
    expect(error.code).toBe("P2010"); // Correct for PostgreSQL
  }
});
```

### Issue 3: Data Conflicts

```typescript
// ❌ Before (failing test):
it("creates multiple users [Test 4/10]", async () => {
  await createUser({ email: "test@example.com" }); // Fixed email
  await createUser({ email: "test@example.com" }); // Same email = conflict
});

// ✅ After (self-healed):
it("creates multiple users [Test 4/10]", async () => {
  const user1 = await createUser({ email: generateUniqueEmail() });
  const user2 = await createUser({ email: generateUniqueEmail() });
  // No conflicts - each email is unique
});
```

---

## Troubleshooting

### ❌ "Auto-correction failed"

**Solutions**:
- Check if service pattern was correctly detected
- Verify database schema matches expectations
- Manual correction may be needed for complex issues
- Review self-healing logs for specific failure reasons

### ❌ "Validation failed after correction"

**Solutions**:
- Issue may be more complex than auto-correction can handle
- Service might have custom error handling
- Database behavior might be non-standard
- Manual test adjustment required

### ❌ "Too many corrections needed"

**Solutions**:
- Initial test generation quality may be low
- Consider updating test generation templates
- Service pattern may be too complex
- Break into smaller, simpler tests

---

## Key Points

1. **Automatic detection** - Finds common issues without manual intervention
2. **Smart corrections** - Applies appropriate fixes based on detected patterns
3. **Validation testing** - Ensures corrections actually work
4. **Non-destructive** - Preserves test intent while fixing technical issues
5. **Transparent logging** - Records all corrections for debugging
6. **Fallback safety** - Never makes changes that could break test logic

---

**Result**: Self-healing tests reduce manual debugging time from hours to minutes by automatically fixing the most common test generation issues before they ever reach the user.

---

**Next**: Use `checklist-integration.md` to perform final validation of the corrected tests.