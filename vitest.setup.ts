import {
  initializeInfrastructure,
  cleanupInfrastructure,
} from "./src/__tests__/shared/testInfrastructure";

/**
 * 🌍 GLOBAL SETUP & TEARDOWN
 *
 * Initializes shared infrastructure ONCE before all 53 test files run.
 * Cleans up ONCE after all 53 test files complete.
 */

export async function setup() {
  console.log(
    "\n🚀 GLOBAL SETUP: Initializing infrastructure for 53 files with 530 tests...\n"
  );

  const startTime = Date.now();

  await initializeInfrastructure();

  const duration = Date.now() - startTime;
  console.log(
    `\n✅ GLOBAL SETUP COMPLETE: Infrastructure ready in ${(
      duration / 1000
    ).toFixed(1)}s\n`
  );
  console.log(
    "🎯 All 53 test files can now execute their 530 tests in parallel!\n"
  );

  // Return teardown function
  return async () => {
    console.log("\n🧹 GLOBAL TEARDOWN: Cleaning up infrastructure...\n");

    await cleanupInfrastructure();

    console.log("\n✅ GLOBAL TEARDOWN COMPLETE: All resources cleaned up!\n");
    console.log("🎊 Demo complete - 53 files × 530 tests executed!\n");
  };
}
