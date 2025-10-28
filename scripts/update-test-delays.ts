/**
 * Script to update all test files with realistic production delays
 *
 * This script:
 * 1. Finds all test files in microservices/
 * 2. Updates imports to use simulateProductionOperation
 * 3. Replaces simulateOperation() calls with simulateProductionOperation()
 * 4. Updates test timeout expectations
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { glob } from "glob";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function updateTestFiles() {
  console.log("🔄 Starting test file updates...\n");

  const testFilesPattern = path.join(
    __dirname,
    "../src/__tests__/microservices/*.test.ts"
  );
  const testFiles = await glob(testFilesPattern.replace(/\\/g, "/"));

  console.log(`📋 Found ${testFiles.length} test files to update\n`);

  let updatedCount = 0;
  let skippedCount = 0;

  for (const filePath of testFiles) {
    const fileName = path.basename(filePath);

    // Skip demo failure files
    if (
      fileName.includes("broken-test-demo") ||
      fileName.includes("validation-errors") ||
      fileName.includes("auth-errors")
    ) {
      console.log(`⏭️  Skipping: ${fileName} (demo failure file)`);
      skippedCount++;
      continue;
    }

    let content = fs.readFileSync(filePath, "utf-8");
    let modified = false;

    // Update import statement
    if (
      content.includes("simulateOperation,") &&
      !content.includes("simulateProductionOperation")
    ) {
      content = content.replace(
        "simulateOperation,",
        "simulateProductionOperation,"
      );
      modified = true;
    }

    // Update function calls
    const operationCallRegex = /await simulateOperation\(\d+,\s*\d+\)/g;
    if (operationCallRegex.test(content)) {
      content = content.replace(
        operationCallRegex,
        "await simulateProductionOperation()"
      );
      modified = true;
    }

    // Update comments about delays
    if (content.includes("50-file, 500-test")) {
      content = content.replace(/50-file, 500-test/g, "53-file, 530-test");
      modified = true;
    }

    // Add realistic delay documentation if not present
    if (!content.includes("realistic production delays")) {
      const describeMatch = content.match(/describe\("[^"]+", \(\) => {/);
      if (describeMatch) {
        const insertPos = content.indexOf(describeMatch[0]);
        const beforeDescribe = content.substring(0, insertPos);
        const afterDescribe = content.substring(insertPos);

        // Find the end of the comment block before describe
        const commentEndIndex = beforeDescribe.lastIndexOf("*/");
        if (commentEndIndex > -1) {
          const beforeComment = content.substring(0, commentEndIndex);
          const commentToDescribe = content.substring(commentEndIndex);

          const newComment = `
 * 
 * Uses realistic production delays (50ms - 10s) to simulate real-world operations:
 * - 70% fast operations: 50-500ms (cache hits, simple queries)
 * - 20% medium operations: 500-2000ms (database queries, API calls)
 * - 10% slow operations: 2000-10000ms (complex queries, external services)`;

          content = beforeComment + newComment + "\n *" + commentToDescribe;
          modified = true;
        }
      }
    }

    // Update assertion timeouts
    if (content.includes("assertExecutionTime")) {
      content = content.replace(
        /assertExecutionTime\([^)]+\)/g,
        "expect(result.executionTime).toBeLessThan(12000) // Max 12s with buffer"
      );
      // Also remove the import if it's no longer needed
      content = content.replace(", assertExecutionTime", "");
      modified = true;
    }

    if (modified) {
      fs.writeFileSync(filePath, content, "utf-8");
      console.log(`✅ Updated: ${fileName}`);
      updatedCount++;
    } else {
      console.log(`⏭️  No changes: ${fileName}`);
      skippedCount++;
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log(`✅ Updated: ${updatedCount} files`);
  console.log(`⏭️  Skipped: ${skippedCount} files`);
  console.log(`📊 Total: ${testFiles.length} files processed`);
  console.log("=".repeat(60));
  console.log("\n🎉 All test files updated with realistic production delays!");
  console.log("\n💡 Tests now simulate real-world operations:");
  console.log("   • 70% fast: 50-500ms");
  console.log("   • 20% medium: 500-2000ms");
  console.log("   • 10% slow: 2000-10000ms");
}

updateTestFiles().catch(console.error);
