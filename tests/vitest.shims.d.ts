/**
 * TypeScript type augmentation for Vitest's ProvidedContext
 *
 * This allows inject('dbInfra') to be properly typed throughout the test suite.
 */

import type { SerializableInfra } from "./globalSetup";

declare module "vitest" {
  export interface ProvidedContext {
    dbInfra: SerializableInfra;
  }
}
