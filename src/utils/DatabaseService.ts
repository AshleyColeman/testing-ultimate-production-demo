import { PrismaClient } from "@prisma/client";
import { Logger } from "./Logger";

/**
 * DatabaseService
 *
 * Singleton service that manages Prisma Client connection to PostgreSQL database.
 * Handles connection pooling, error handling, and provides a reusable instance
 * for all integration tests.
 *
 * Usage:
 *   const db = DatabaseService.getInstance();
 *   await db.connect();
 *   const result = await db.client.serviceLog.findMany();
 *   await db.disconnect();
 */
class DatabaseService {
  private static instance: DatabaseService;
  private prisma: PrismaClient;
  private logger: Logger;
  private isConnected: boolean = false;

  private constructor() {
    this.logger = new Logger("DatabaseService");

    // Initialize Prisma Client with connection pooling
    this.prisma = new PrismaClient();
  }

  /**
   * Get singleton instance of DatabaseService
   */
  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  /**
   * Get Prisma Client instance
   */
  public get client(): PrismaClient {
    if (!this.isConnected) {
      this.logger.warn(
        "Prisma client accessed but not connected. Call connect() first."
      );
    }
    return this.prisma;
  }

  /**
   * Connect to the database
   */
  public async connect(): Promise<void> {
    try {
      if (this.isConnected) {
        this.logger.debug("Already connected to database");
        return;
      }

      // Test connection
      await this.prisma.$queryRaw`SELECT 1`;

      this.isConnected = true;
      this.logger.info("✅ Connected to PostgreSQL database");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to connect to database: ${message}`);
      throw new Error(`Database connection failed: ${message}`);
    }
  }

  /**
   * Disconnect from the database
   */
  public async disconnect(): Promise<void> {
    try {
      if (!this.isConnected) {
        this.logger.debug("Not connected to database");
        return;
      }

      await this.prisma.$disconnect();
      this.isConnected = false;
      this.logger.info("✅ Disconnected from database");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to disconnect: ${message}`);
      throw new Error(`Database disconnection failed: ${message}`);
    }
  }

  /**
   * Check if connected to database
   */
  public isDatabaseConnected(): boolean {
    return this.isConnected;
  }

  /**
   * Get database health status
   */
  public async getHealth(): Promise<{
    status: string;
    connected: boolean;
    timestamp: Date;
  }> {
    try {
      const startTime = Date.now();
      await this.prisma.$queryRaw`SELECT 1`;
      const duration = Date.now() - startTime;

      return {
        status: `✅ Healthy (${duration}ms)`,
        connected: true,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        status: "❌ Unhealthy",
        connected: false,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Execute raw SQL query (for dynamic schema operations)
   */
  public async executeRaw(query: string, params?: any[]): Promise<any> {
    try {
      return await this.prisma.$queryRawUnsafe(query, ...(params || []));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Query execution failed: ${message}`);
      throw error;
    }
  }

  /**
   * Get connection URL (masked)
   */
  public getConnectionInfo(): {
    host: string;
    port: number;
    database: string;
    user: string;
  } {
    const dbUrl = process.env.DATABASE_URL || "";
    // postgresql://user:password@host:port/database
    const match = dbUrl.match(
      /postgresql:\/\/([^:]+):[^@]+@([^:]+):(\d+)\/(.+)$/
    );

    if (!match) {
      return {
        host: "unknown",
        port: 5432,
        database: "unknown",
        user: "unknown",
      };
    }

    return {
      user: match[1],
      host: match[2],
      port: parseInt(match[3], 10),
      database: match[4],
    };
  }
}

// Export singleton instance
export const databaseService = DatabaseService.getInstance();
export { DatabaseService };
