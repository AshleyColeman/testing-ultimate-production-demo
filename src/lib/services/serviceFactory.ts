import type { ServerCtxType } from '../utils/types';

/**
 * Service Factory
 *
 * Provides dependency injection for services with proper context mapping.
 * Follows the Inter-Train pattern for service management.
 */

class ServiceFactory {
  private services = new Map<string, any>();
  private context: ServerCtxType = {};

  /**
   * Set the current server context
   */
  setContext(context: ServerCtxType): void {
    this.context = context;
  }

  /**
   * Get the current context
   */
  getContext(): ServerCtxType {
    return this.context;
  }

  /**
   * Register a service with the factory
   */
  register<T>(name: string, serviceFactory: (ctx: ServerCtxType) => T): void {
    this.services.set(name, serviceFactory(this.context));
  }

  /**
   * Get a service instance
   */
  get<T>(name: string): T {
    const service = this.services.get(name);
    if (!service) {
      throw new Error(`Service '${name}' not found. Make sure it's registered.`);
    }
    return service;
  }

  /**
   * Register multiple services at once
   */
  registerServices(services: Record<string, (ctx: ServerCtxType) => any>): void {
    Object.entries(services).forEach(([name, factory]) => {
      this.register(name, factory);
    });
  }

  /**
   * Clear all services (useful for testing)
   */
  clear(): void {
    this.services.clear();
    this.context = {};
  }

  /**
   * Get all registered service names
   */
  getServiceNames(): string[] {
    return Array.from(this.services.keys());
  }
}

// Export singleton instance
export const serviceFactory = new ServiceFactory();
export { ServiceFactory };

/**
 * Helper function to create a service with context
 */
export function createService<T>(
  name: string,
  factory: (ctx: ServerCtxType) => T
): T {
  if (!serviceFactory.getServiceNames().includes(name)) {
    serviceFactory.register(name, factory);
  }
  return serviceFactory.get<T>(name);
}