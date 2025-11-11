---
name: analyze-service-pattern
description: >
  Automatically detect service implementation patterns (Prisma vs raw SQL vs ORM),
  extract table schemas, identify database requirements, and select appropriate test templates.
  Use when: Phase 0 of test generation to understand how the service works before creating tests.
---

# Analyze Service Pattern

**PURPOSE**: Automatically detect service implementation patterns and requirements to generate appropriate tests.

## When to use

- **Triggers**: "analyze service", "detect patterns", "understand implementation", "service discovery"
- **Input**: Service file path or service object
- **Output**: ServicePattern object with query method, tables, constraints, and template requirements
- **Not for**: Manual pattern specification (this is automatic)
- **Required**: **NEW - First step** before any test generation

## Quick start

1. Import: `import { analyzeServicePattern } from "../shared/testHelpers"`
2. Call: `const pattern = await analyzeServicePattern("./src/services/UserService.ts")`
3. Use: Select appropriate template and database operations based on pattern

## Workflow

- **Scan**: Read service file and detect database interaction patterns
- **Identify**: Determine query methods (Prisma, raw SQL, ORM, mixed)
- **Extract**: Parse table names, field types, and constraints
- **Map**: Select appropriate test template for detected pattern
- **Validate**: Ensure pattern is supported and has sufficient information

## File & tool use

- Read: Target service file to analyze implementation
- Run: Pattern detection algorithms and AST parsing
- Import: `import { analyzeServicePattern } from "../shared/testHelpers"`

## Guardrails

- Always analyze service before generating tests
- Handle mixed patterns (some Prisma, some raw SQL)
- Gracefully fallback to generic CRUD template if pattern unclear
- Never assume specific database without detection

## Examples

**Example A**: Detects UserService uses raw SQL

```typescript
const pattern = await analyzeServicePattern("./src/services/UserService.ts");

// Returns:
{
  queryMethod: 'raw-sql',
  tables: ['users'],
  operations: ['INSERT INTO users', 'SELECT FROM users', 'UPDATE users', 'DELETE FROM users'],
  constraints: ['email_unique', 'id_primary'],
  fields: {
    id: 'VARCHAR(255) PRIMARY KEY',
    email: 'VARCHAR(255) UNIQUE NOT NULL',
    name: 'VARCHAR(255)',
    isActive: 'BOOLEAN DEFAULT true',
    createdAt: 'TIMESTAMP DEFAULT NOW()',
    updatedAt: 'TIMESTAMP DEFAULT NOW()',
    role: 'VARCHAR(50) DEFAULT user',
    passwordHash: 'VARCHAR(255)'
  },
  template: 'crud-raw-sql'
}
```

**Example B**: Detects Prisma-based service

```typescript
const pattern = await analyzeServicePattern("./src/services/ProductService.ts");

// Returns:
{
  queryMethod: 'prisma',
  tables: ['Product', 'Category'],
  operations: ['prisma.product.create()', 'prisma.product.findMany()'],
  constraints: ['Product_id_unique', 'Category_name_unique'],
  fields: {
    // Detected from Prisma schema
  },
  template: 'crud-prisma'
}
```

**Example C**: Detects mixed pattern service

```typescript
const pattern = await analyzeServicePattern("./src/services/OrderService.ts");

// Returns:
{
  queryMethod: 'mixed',
  tables: ['orders', 'payments'],
  operations: ['prisma.order.create()', 'raw-sql payments query'],
  constraints: ['order_id_unique', 'payment_orderId_fk'],
  template: 'mixed-operations'
}
```

---

## Pattern Detection Algorithms

### Query Method Detection

```typescript
function detectQueryMethod(serviceContent: string): QueryMethod {
  // Check for Prisma patterns
  if (serviceContent.includes('prisma.') &&
      serviceContent.includes('.create(') ||
      serviceContent.includes('.find')) {
    return 'prisma';
  }

  // Check for raw SQL patterns
  if (serviceContent.includes('$queryRaw') ||
      serviceContent.includes('$executeRaw') ||
      serviceContent.includes('INSERT INTO') ||
      serviceContent.includes('SELECT FROM')) {
    return 'raw-sql';
  }

  // Check for other ORM patterns
  if (serviceContent.includes('getRepository') ||
      serviceContent.includes('EntityManager')) {
    return 'typeorm';
  }

  // Check for mixed patterns
  const hasPrisma = serviceContent.includes('prisma.');
  const hasRawSql = serviceContent.includes('$queryRaw');

  if (hasPrisma && hasRawSql) {
    return 'mixed';
  }

  return 'unknown';
}
```

### Table Schema Extraction

```typescript
function extractTableSchemas(serviceContent: string, queryMethod: QueryMethod): TableSchema[] {
  if (queryMethod === 'raw-sql') {
    // Parse raw SQL queries
    return extractFromRawSQL(serviceContent);
  } else if (queryMethod === 'prisma') {
    // Read Prisma schema file
    return extractFromPrismaSchema();
  }

  return [];
}

function extractFromRawSQL(content: string): TableSchema[] {
  const tables: TableSchema[] = [];

  // Find INSERT INTO statements
  const insertMatches = content.match(/INSERT INTO\s+(\w+)/gi);
  if (insertMatches) {
    const tableName = insertMatches[0].replace(/INSERT INTO\s+/i, '');
    // Extract field names from INSERT statement
    const fieldMatch = content.match(/INSERT INTO \w+\s*\(([^)]+)\)/i);
    if (fieldMatch) {
      const fields = fieldMatch[1].split(',').map(f => f.trim().replace(/"/g, ''));
      tables.push({ name: tableName, fields });
    }
  }

  // Find CREATE TABLE statements
  const createMatches = content.match(/CREATE TABLE.*?`([^`]+)`/gi);
  // Extract table structure...

  return tables;
}
```

### Template Selection

```typescript
function selectTemplate(pattern: ServicePattern): TestTemplate {
  switch (pattern.queryMethod) {
    case 'raw-sql':
      if (pattern.tables.includes('users')) {
        return CRUD_USER_RAW_SQL_TEMPLATE;
      } else if (pattern.tables.includes('products')) {
        return CRUD_PRODUCT_RAW_SQL_TEMPLATE;
      }
      return GENERIC_CRUD_RAW_SQL_TEMPLATE;

    case 'prisma':
      if (pattern.tables.includes('users')) {
        return CRUD_USER_PRISMA_TEMPLATE;
      }
      return GENERIC_CRUD_PRISMA_TEMPLATE;

    case 'mixed':
      return MIXED_OPERATIONS_TEMPLATE;

    default:
      return GENERIC_CRUD_TEMPLATE;
  }
}
```

---

## Complete Example: UserService Analysis

```typescript
import { analyzeServicePattern } from "../shared/testHelpers";

// Analyze UserService before generating tests
async function generateUserServiceTests() {
  // Step 0: Analyze service pattern
  const pattern = await analyzeServicePattern("./src/services/UserService.ts");

  console.log(`Detected pattern: ${pattern.queryMethod}`);
  console.log(`Tables needed: ${pattern.tables.join(', ')}`);
  console.log(`Template: ${pattern.template}`);

  // Step 1: Create dynamic schema based on analysis
  await createTablesForPattern(pattern);

  // Step 2: Select appropriate template
  const template = selectTemplate(pattern);

  // Step 3: Generate tests using template
  const tests = generateTestsFromTemplate(template, pattern);

  // Step 4: Self-heal and validate
  const correctedTests = await selfHealTests(tests, pattern);

  return correctedTests;
}

// Pattern detection results for UserService:
// {
//   queryMethod: 'raw-sql',
//   tables: ['users'],
//   constraints: ['email_unique'],
//   needsCustomTableSetup: true,
//   template: 'crud-user-raw-sql'
// }
```

---

## Troubleshooting

### ❌ "Unable to detect service pattern"

**Solutions**:
- Check if service file exists and is readable
- Ensure service contains database operations
- Verify service is not using unsupported database library
- Try analyzing a different service file

### ❌ "Mixed pattern detected but unclear"

**Solutions**:
- Service uses both Prisma and raw SQL
- Agent will use 'mixed' template
- May need manual template selection
- Consider refactoring service for consistency

### ❌ "Cannot extract table schema"

**Solutions**:
- Service may use dynamic table names
- Tables might be created elsewhere
- Check for table creation in migration files
- Manual schema definition may be required

---

## Key Points

1. **Always analyze first** - Never generate tests without understanding the service
2. **Detect query method** - Critical for selecting correct database operations
3. **Extract table schemas** - Required for dynamic schema creation
4. **Select appropriate template** - Ensures tests match service patterns
5. **Handle mixed patterns** - Services may use multiple approaches
6. **Fallback gracefully** - Use generic templates when pattern unclear

---

**Next**: Use `dynamic-schema-creation.md` to create required tables based on analysis results.