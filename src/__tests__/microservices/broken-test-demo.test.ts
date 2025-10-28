/**
 * 🔴 BROKEN TEST FILE - DEMO PURPOSE
 *
 * This file intentionally has errors to demonstrate:
 * 1. System continues running even when a test file fails to load
 * 2. Detailed error reporting to logs/error.log
 * 3. Graceful error handling without breaking the entire suite
 */

import { describe, it, expect } from "vitest";
import { getInfrastructure } from "../shared/testInfrastructure";

// This will cause a runtime error when the module is imported
throw new Error(
  "INTENTIONAL FAILURE: This test file is designed to fail on import to demonstrate error handling"
);

describe("Broken Test Demo - This File Has Import Errors", () => {
  it("should never run because the import fails [Test 1/10]", async () => {
    const infra = await getInfrastructure();
    expect(infra).toBeDefined();
  });

  it("should never run [Test 2/10]", async () => {
    expect(true).toBe(true);
  });

  it("should never run [Test 3/10]", async () => {
    expect(true).toBe(true);
  });

  it("should never run [Test 4/10]", async () => {
    expect(true).toBe(true);
  });

  it("should never run [Test 5/10]", async () => {
    expect(true).toBe(true);
  });

  it("should never run [Test 6/10]", async () => {
    expect(true).toBe(true);
  });

  it("should never run [Test 7/10]", async () => {
    expect(true).toBe(true);
  });

  it("should never run [Test 8/10]", async () => {
    expect(true).toBe(true);
  });

  it("should never run [Test 9/10]", async () => {
    expect(true).toBe(true);
  });

  it("should never run [Test 10/10]", async () => {
    expect(true).toBe(true);
  });
});
