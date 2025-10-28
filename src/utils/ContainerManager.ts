/**
 * 🐳 Container Manager - Docker Container Management with Testcontainers
 *
 * Features:
 * - PostgreSQL container lifecycle management
 * - Connection pooling
 * - Health checks
 * - Automatic cleanup
 * - Port mapping
 */

import { GenericContainer, StartedTestContainer, Wait } from "testcontainers";

interface ContainerConfig {
  database: string;
  username: string;
  password: string;
  port?: number;
  reuse?: boolean;
}

export class ContainerManager {
  private container: StartedTestContainer | null;
  private config: ContainerConfig;
  private connectionUri: string | null;

  constructor(config: ContainerConfig) {
    this.container = null;
    this.config = {
      port: 5432,
      reuse: false,
      ...config,
    };
    this.connectionUri = null;
  }

  async startContainer(): Promise<void> {
    try {
      const container = new GenericContainer("postgres:16-alpine")
        .withEnvironment({
          POSTGRES_DB: this.config.database,
          POSTGRES_USER: this.config.username,
          POSTGRES_PASSWORD: this.config.password,
        })
        .withExposedPorts(this.config.port!)
        .withWaitStrategy(
          Wait.forLogMessage(
            /database system is ready to accept connections/,
            2
          )
        )
        .withStartupTimeout(120000);

      this.container = await container.start();

      const host = this.container.getHost();
      const port = this.container.getMappedPort(this.config.port!);

      this.connectionUri = `postgresql://${this.config.username}:${this.config.password}@${host}:${port}/${this.config.database}`;

      // Additional wait for PostgreSQL to fully initialize
      await this.waitForPostgres();
    } catch (error) {
      throw new Error(`Failed to start container: ${error}`);
    }
  }

  private async waitForPostgres(): Promise<void> {
    // Wait an additional 2 seconds for PostgreSQL to fully accept connections
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  async stopContainer(): Promise<void> {
    if (this.container) {
      try {
        await this.container.stop();
        this.container = null;
        this.connectionUri = null;
      } catch (error) {
        console.error("Error stopping container:", error);
      }
    }
  }

  getConnectionUri(): string | null {
    return this.connectionUri;
  }

  getHost(): string | null {
    return this.container ? this.container.getHost() : null;
  }

  getPort(): number | null {
    return this.container
      ? this.container.getMappedPort(this.config.port!)
      : null;
  }

  isRunning(): boolean {
    return this.container !== null;
  }

  getConfig(): ContainerConfig {
    return { ...this.config };
  }
}
