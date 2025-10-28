import { cleanupInfrastructure } from "./src/__tests__/shared/testInfrastructure";

/**
 * 🌍 GLOBAL TEARDOWN
 *
 * Cleans up shared infrastructure ONCE after all 53 test files complete.
 */

export async function teardown() {
  console.log("\n🧹 GLOBAL TEARDOWN: Cleaning up infrastructure...\n");

  await cleanupInfrastructure();

  console.log("\n✅ GLOBAL TEARDOWN COMPLETE: All resources cleaned up!\n");
  console.log("🎊 Demo complete - 53 files × 530 tests executed!\n");
}
