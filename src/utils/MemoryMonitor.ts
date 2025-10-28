/**
 * 📊 Memory Monitor - Real-time Memory Monitoring
 *
 * Features:
 * - Periodic memory snapshots
 * - Trend analysis
 * - Leak detection
 * - Performance profiling
 * - Singleton pattern
 */

interface MemorySnapshot {
  timestamp: number;
  heapUsed: number;
  heapTotal: number;
  rss: number;
  external: number;
  arrayBuffers: number;
}

interface MemoryTrend {
  averageHeapUsed: number;
  peakHeapUsed: number;
  averageRss: number;
  peakRss: number;
  snapshotCount: number;
  timeSpan: number;
}

export class MemoryMonitor {
  private static instance: MemoryMonitor;
  private snapshots: MemorySnapshot[];
  private monitoringInterval: NodeJS.Timeout | null;
  private intervalMs: number;
  private maxSnapshots: number;

  private constructor() {
    this.snapshots = [];
    this.monitoringInterval = null;
    this.intervalMs = 5000; // 5 seconds
    this.maxSnapshots = 100; // Keep last 100 snapshots
  }

  static getInstance(): MemoryMonitor {
    if (!MemoryMonitor.instance) {
      MemoryMonitor.instance = new MemoryMonitor();
    }
    return MemoryMonitor.instance;
  }

  startMonitoring(intervalMs: number = 5000): void {
    if (this.monitoringInterval) {
      return; // Already monitoring
    }

    this.intervalMs = intervalMs;
    this.monitoringInterval = setInterval(() => {
      this.takeSnapshot();
    }, intervalMs);

    // Take initial snapshot
    this.takeSnapshot();
  }

  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  takeSnapshot(): MemorySnapshot {
    const memUsage = process.memoryUsage();
    const snapshot: MemorySnapshot = {
      timestamp: Date.now(),
      heapUsed: memUsage.heapUsed,
      heapTotal: memUsage.heapTotal,
      rss: memUsage.rss,
      external: memUsage.external,
      arrayBuffers: memUsage.arrayBuffers,
    };

    this.snapshots.push(snapshot);

    // Keep only the latest snapshots
    if (this.snapshots.length > this.maxSnapshots) {
      this.snapshots.shift();
    }

    return snapshot;
  }

  getLatestSnapshot(): MemorySnapshot | null {
    return this.snapshots.length > 0
      ? this.snapshots[this.snapshots.length - 1]
      : null;
  }

  getAllSnapshots(): MemorySnapshot[] {
    return [...this.snapshots];
  }

  getTrend(): MemoryTrend | null {
    if (this.snapshots.length === 0) {
      return null;
    }

    const firstSnapshot = this.snapshots[0];
    const lastSnapshot = this.snapshots[this.snapshots.length - 1];

    let totalHeapUsed = 0;
    let totalRss = 0;
    let peakHeapUsed = 0;
    let peakRss = 0;

    for (const snapshot of this.snapshots) {
      totalHeapUsed += snapshot.heapUsed;
      totalRss += snapshot.rss;
      peakHeapUsed = Math.max(peakHeapUsed, snapshot.heapUsed);
      peakRss = Math.max(peakRss, snapshot.rss);
    }

    return {
      averageHeapUsed: totalHeapUsed / this.snapshots.length,
      peakHeapUsed,
      averageRss: totalRss / this.snapshots.length,
      peakRss,
      snapshotCount: this.snapshots.length,
      timeSpan: lastSnapshot.timestamp - firstSnapshot.timestamp,
    };
  }

  detectLeak(thresholdMb: number = 50): boolean {
    if (this.snapshots.length < 10) {
      return false; // Not enough data
    }

    const firstSnapshot = this.snapshots[0];
    const lastSnapshot = this.snapshots[this.snapshots.length - 1];

    const heapGrowthBytes = lastSnapshot.heapUsed - firstSnapshot.heapUsed;
    const heapGrowthMb = heapGrowthBytes / (1024 * 1024);

    return heapGrowthMb > thresholdMb;
  }

  clearSnapshots(): void {
    this.snapshots = [];
  }

  getMemoryUsageFormatted(): string {
    const latest = this.getLatestSnapshot();
    if (!latest) {
      return "No data available";
    }

    const formatMb = (bytes: number) =>
      `${(bytes / 1024 / 1024).toFixed(2)} MB`;

    return `
Heap Used: ${formatMb(latest.heapUsed)}
Heap Total: ${formatMb(latest.heapTotal)}
RSS: ${formatMb(latest.rss)}
External: ${formatMb(latest.external)}
Array Buffers: ${formatMb(latest.arrayBuffers)}
    `.trim();
  }
}
