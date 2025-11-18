/**
 * 🔍 PRE-TEST VALIDATION SCRIPT
 *
 * Run this before executing tests to verify the infrastructure is properly configured.
 * This checks schema allocation requirements against available capacity.
 */

import { SCHEMAS_PER_CONTAINER } from "../src/__tests__/shared/testInfrastructure";

interface TestFileRequirements {
  file: string;
  service: string;
  readTests: number;
  writeTests: number;
  totalTests: number;
  requiredSchemas: number;
}

const testFiles: TestFileRequirements[] = [
  {
    file: "auth-login-new-pattern.test.ts",
    service: "auth",
    readTests: 3,
    writeTests: 3,
    totalTests: 6,
    requiredSchemas: 4, // 1 READ + 3 WRITE
  },
  {
    file: "user-actions.test.ts",
    service: "users",
    readTests: 3,
    writeTests: 7,
    totalTests: 10,
    requiredSchemas: 8, // 1 READ + 7 WRITE
  },
  {
    file: "schema-isolation-validation.test.ts",
    service: "audit",
    readTests: 5,
    writeTests: 4,
    totalTests: 10,
    requiredSchemas: 5, // 1 READ + 4 WRITE
  },
];

console.log("\n" + "=".repeat(70));
console.log("🔍 PRE-TEST INFRASTRUCTURE VALIDATION");
console.log("=".repeat(70));

console.log(`\n📊 Infrastructure Configuration:`);
console.log(`   Schemas per Container: ${SCHEMAS_PER_CONTAINER}`);
console.log(
  `   Available per Service: 1 READ + ${SCHEMAS_PER_CONTAINER - 1} WRITE\n`
);

let allValid = true;

console.log("📋 Test File Analysis:\n");

testFiles.forEach((testFile, index) => {
  const available = SCHEMAS_PER_CONTAINER;
  const isValid = testFile.requiredSchemas <= available;
  const status = isValid ? "✅ PASS" : "❌ FAIL";

  if (!isValid) allValid = false;

  console.log(`${index + 1}. ${testFile.file}`);
  console.log(`   Service:          ${testFile.service}`);
  console.log(`   Total Tests:      ${testFile.totalTests}`);
  console.log(`   READ Tests:       ${testFile.readTests} (share 1 schema)`);
  console.log(
    `   WRITE Tests:      ${testFile.writeTests} (each needs unique schema)`
  );
  console.log(`   Required Schemas: ${testFile.requiredSchemas}`);
  console.log(`   Available:        ${available}`);
  console.log(`   Status:           ${status}`);

  if (!isValid) {
    const deficit = testFile.requiredSchemas - available;
    console.log(`   ⚠️  DEFICIT: Need ${deficit} more schema(s)!`);
    console.log(
      `   🔧 FIX: Increase SCHEMAS_PER_CONTAINER to ${testFile.requiredSchemas} or reduce write tests`
    );
  }

  console.log("");
});

console.log("=".repeat(70));

if (allValid) {
  console.log("✅ VALIDATION PASSED - All test files have sufficient schemas");
  console.log("🚀 Ready to run tests!\n");
  process.exit(0);
} else {
  console.log("❌ VALIDATION FAILED - Schema capacity insufficient");
  console.log("⚠️  Tests may fail due to schema exhaustion\n");
  process.exit(1);
}
