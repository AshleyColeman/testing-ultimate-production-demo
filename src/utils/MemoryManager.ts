/**
 * 🧠 Memory Manager - Enterprise Memory Management
 *
 * Features:
 * - Component-based memory tracking
 * - Automatic cleanup on pressure
 * - Priority-based resource management
 * - Real-time statistics
 * - Singleton pattern for global access
 */

interface MemoryComponent {
  name: string;
  getMemoryUsage: () => number;
  cleanup?: () => Promise<void>;
  getStats?: () => any;
  getPriority?: () => number; // 1-5, higher = more important
}

interface MemoryStats {
  totalMemoryUsage: number;
  componentCount: number;
  componentUsage: Record<string, number>;
  systemHealth: "excellent" | "good" | "warning" | "critical";
  timestamp: number;
}

export class MemoryManager {
  private static instance: MemoryManager;
  private components: Map<string, MemoryComponent>;
  private cleanupThreshold: number;
  private isCleaningUp: boolean;

  private constructor() {
    this.components = new Map();
    this.cleanupThreshold = 0.85; // 85% memory usage triggers cleanup
    this.isCleaningUp = false;
  }

  static getInstance(): MemoryManager {
    if (!MemoryManager.instance) {
      MemoryManager.instance = new MemoryManager();
    }
    return MemoryManager.instance;
  }

  registerComponent(component: MemoryComponent): void {
    this.components.set(component.name, component);
  }

  unregisterComponent(name: string): void {
    this.components.delete(name);
  }

  getMemoryStats(): MemoryStats {
    const componentUsage: Record<string, number> = {};
    let totalMemoryUsage = 0;

    for (const [name, component] of this.components) {
      const usage = component.getMemoryUsage();
      componentUsage[name] = usage;
      totalMemoryUsage += usage;
    }

    const memInfo = process.memoryUsage();
    const heapUsed = memInfo.heapUsed;
    const heapTotal = memInfo.heapTotal;
    const usageRatio = heapUsed / heapTotal;

    let systemHealth: "excellent" | "good" | "warning" | "critical";
    if (usageRatio < 0.75) {
      systemHealth = "excellent";
    } else if (usageRatio < 0.85) {
      systemHealth = "good";
    } else if (usageRatio < 0.95) {
      systemHealth = "warning";
    } else {
      systemHealth = "critical";
    }

    return {
      totalMemoryUsage,
      componentCount: this.components.size,
      componentUsage,
      systemHealth,
      timestamp: Date.now(),
    };
  }

  async checkAndCleanup(): Promise<void> {
    if (this.isCleaningUp) return;

    const memInfo = process.memoryUsage();
    const usageRatio = memInfo.heapUsed / memInfo.heapTotal;

    if (usageRatio > this.cleanupThreshold) {
      await this.performCleanup();
    }
  }

  async performCleanup(): Promise<void> {
    if (this.isCleaningUp) return;

    this.isCleaningUp = true;

    try {
      // Sort components by priority (low priority cleaned first)
      const componentsArray = Array.from(this.components.values());
      componentsArray.sort((a, b) => {
        const priorityA = a.getPriority?.() ?? 3;
        const priorityB = b.getPriority?.() ?? 3;
        return priorityA - priorityB;
      });

      for (const component of componentsArray) {
        if (component.cleanup) {
          await component.cleanup();
        }
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
    } finally {
      this.isCleaningUp = false;
    }
  }

  async cleanupAll(): Promise<void> {
    const cleanupPromises = Array.from(this.components.values())
      .filter((c) => c.cleanup)
      .map((c) => c.cleanup!());

    await Promise.all(cleanupPromises);
    this.components.clear();
  }

  getComponentStats(name: string): any {
    const component = this.components.get(name);
    if (!component || !component.getStats) {
      return null;
    }
    return component.getStats();
  }

  getAllComponentStats(): Record<string, any> {
    const stats: Record<string, any> = {};
    for (const [name, component] of this.components) {
      if (component.getStats) {
        stats[name] = component.getStats();
      }
    }
    return stats;
  }
}
