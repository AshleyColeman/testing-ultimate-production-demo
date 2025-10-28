import { expect } from "vitest";

/**
 * 🛠️ SHARED TEST HELPERS
 *
 * Common utilities, assertions, and data generators used across all test files.
 */

/**
 * Simulate realistic production operation with varied delay patterns
 *
 * This creates realistic delays that mirror real-world scenarios:
 * - Fast operations: 50-500ms (70% of operations - cache hits, simple queries)
 * - Medium operations: 500-2000ms (20% of operations - database queries, API calls)
 * - Slow operations: 2000-10000ms (10% of operations - complex queries, external services)
 */
export async function simulateProductionOperation(): Promise<number> {
  const random = Math.random();

  let minMs: number;
  let maxMs: number;
  let operationType: string;

  if (random < 0.7) {
    // 70% - Fast operations (cache hits, simple queries)
    minMs = 50;
    maxMs = 500;
    operationType = "fast";
  } else if (random < 0.9) {
    // 20% - Medium operations (database queries)
    minMs = 500;
    maxMs = 2000;
    operationType = "medium";
  } else {
    // 10% - Slow operations (complex queries, external APIs)
    minMs = 2000;
    maxMs = 10000;
    operationType = "slow";
  }

  const delay = minMs + Math.random() * (maxMs - minMs);
  await new Promise((resolve) => setTimeout(resolve, delay));

  return Math.round(delay);
}

/**
 * Simulate async operation with random delay (legacy - for backward compatibility)
 */
export async function simulateOperation(
  minMs: number = 50,
  maxMs: number = 200
): Promise<number> {
  const delay = minMs + Math.random() * (maxMs - minMs);
  await new Promise((resolve) => setTimeout(resolve, delay));
  return Math.round(delay);
}

/**
 * Generate random test data
 */
export function generateTestData(type: string): any {
  const generators: Record<string, () => any> = {
    user: () => ({
      id: Math.floor(Math.random() * 10000),
      username: `user_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      email: `test${Date.now()}@example.com`,
      createdAt: new Date().toISOString(),
    }),

    transaction: () => ({
      id: `txn_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
      amount: Math.round((Math.random() * 10000 + 100) * 100) / 100,
      currency: ["USD", "EUR", "GBP"][Math.floor(Math.random() * 3)],
      status: ["completed", "pending", "processing"][
        Math.floor(Math.random() * 3)
      ],
      timestamp: new Date().toISOString(),
    }),

    product: () => ({
      id: Math.floor(Math.random() * 1000),
      sku: `SKU-${Math.random().toString(36).slice(2, 10).toUpperCase()}`,
      name: `Product ${Math.floor(Math.random() * 1000)}`,
      price: Math.round((Math.random() * 500 + 10) * 100) / 100,
      stock: Math.floor(Math.random() * 1000),
    }),

    order: () => ({
      id: `ord_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
      customerId: Math.floor(Math.random() * 10000),
      total: Math.round((Math.random() * 5000 + 50) * 100) / 100,
      items: Math.floor(Math.random() * 10) + 1,
      status: ["placed", "processing", "shipped", "delivered"][
        Math.floor(Math.random() * 4)
      ],
    }),

    session: () => ({
      id: `sess_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`,
      userId: Math.floor(Math.random() * 10000),
      token:
        Math.random().toString(36).slice(2) +
        Math.random().toString(36).slice(2),
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
      ipAddress: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(
        Math.random() * 255
      )}`,
    }),
  };

  return generators[type] ? generators[type]() : { type, value: Math.random() };
}

/**
 * Assert execution time is within range
 */
export function assertExecutionTime(
  actualMs: number,
  expectedMinMs: number,
  expectedMaxMs: number
): void {
  expect(actualMs).toBeGreaterThanOrEqual(expectedMinMs);
  expect(actualMs).toBeLessThanOrEqual(expectedMaxMs * 1.5); // Allow 50% buffer
}

/**
 * Assert test result format
 */
export function assertTestResult(result: any): void {
  expect(result).toBeDefined();
  expect(result).toHaveProperty("success");
  expect(result).toHaveProperty("executionTime");
  expect(result).toHaveProperty("timestamp");
}

/**
 * Generate random metric value
 */
export function generateMetric(
  name: string,
  min: number = 0,
  max: number = 100
): number {
  return Math.round((min + Math.random() * (max - min)) * 100) / 100;
}

/**
 * Create test tags for categorization
 */
export function createTestTags(
  service: string,
  category: string,
  ...additionalTags: string[]
): string[] {
  return [service, category, ...additionalTags];
}

/**
 * Format test name with context
 */
export function formatTestName(
  operation: string,
  scenario: string,
  iteration?: number
): string {
  if (iteration !== undefined) {
    return `${operation} - ${scenario} (iteration ${iteration})`;
  }
  return `${operation} - ${scenario}`;
}

/**
 * Wait for condition with timeout
 */
export async function waitForCondition(
  condition: () => boolean | Promise<boolean>,
  timeoutMs: number = 5000,
  intervalMs: number = 100
): Promise<boolean> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    const result = await condition();
    if (result) {
      return true;
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  return false;
}

/**
 * Retry operation with exponential backoff
 */
export async function retryOperation<T>(
  operation: () => Promise<T>,
  maxAttempts: number = 3,
  baseDelayMs: number = 100
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;

      if (attempt < maxAttempts) {
        const delay = baseDelayMs * Math.pow(2, attempt - 1);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error("Operation failed after retries");
}

/**
 * Calculate test statistics
 */
export function calculateStats(values: number[]): {
  min: number;
  max: number;
  avg: number;
  median: number;
  p95: number;
  p99: number;
} {
  if (values.length === 0) {
    return { min: 0, max: 0, avg: 0, median: 0, p95: 0, p99: 0 };
  }

  const sorted = [...values].sort((a, b) => a - b);
  const sum = sorted.reduce((acc, val) => acc + val, 0);

  return {
    min: sorted[0],
    max: sorted[sorted.length - 1],
    avg: Math.round((sum / sorted.length) * 100) / 100,
    median: sorted[Math.floor(sorted.length / 2)],
    p95: sorted[Math.floor(sorted.length * 0.95)],
    p99: sorted[Math.floor(sorted.length * 0.99)],
  };
}

/**
 * Generate batch of test items
 */
export function generateBatch<T>(
  count: number,
  generator: (index: number) => T
): T[] {
  return Array.from({ length: count }, (_, i) => generator(i));
}

/**
 * Mock external API response
 */
export function mockApiResponse<T>(
  data: T,
  delayMs: number = 100
): Promise<{ data: T; status: number; timestamp: string }> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        data,
        status: 200,
        timestamp: new Date().toISOString(),
      });
    }, delayMs);
  });
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Validate UUID format
 */
export function isValidUUID(uuid: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    uuid
  );
}

/**
 * Generate random delay within range
 */
export function randomDelay(minMs: number, maxMs: number): Promise<number> {
  const delay = minMs + Math.random() * (maxMs - minMs);
  return new Promise((resolve) => {
    setTimeout(() => resolve(Math.round(delay)), delay);
  });
}
