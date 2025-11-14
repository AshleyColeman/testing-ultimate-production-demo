import { Command } from 'commander';
import { Logger } from '../../utils/Logger';
import { DatabaseService } from '../../utils/DatabaseService';

export interface ServiceCommand {
  name: string;
  description: string;
  handler: () => Promise<void>;
}

/**
 * Define a service with automated background tasks
 *
 * @param serviceName Name of the service
 * @param commands Array of service commands
 * @returns Commander program instance
 */
export function defineService(serviceName: string, commands: ServiceCommand[]) {
  const program = new Command();
  const logger = new Logger(serviceName);

  program.name(serviceName).description(`${serviceName} service - automated background tasks`).version('1.0.0');

  commands.forEach(({ name, description, handler }) => {
    program
      .command(name)
      .description(description)
      .action(async () => {
        const startTime = Date.now();

        try {
          logger.info(`Starting ${serviceName}:${name}`);

          await handler();

          const duration = Date.now() - startTime;
          logger.info(`Completed ${serviceName}:${name} (${duration}ms)`);
        } catch (error) {
          const duration = Date.now() - startTime;
          logger.error(`Failed ${serviceName}:${name} (${duration}ms)`, error);
        } finally {
          try {
            await DatabaseService.getInstance().disconnect();
          } catch (dbError) {
            logger.error('Database disconnect error', dbError);
          }
        }
      });
  });

  if (process.argv.length === 2) {
    program.help();
  }

  return program;
}

/**
 * Run a service program
 *
 * @param program Commander program instance
 */
export async function runService(program: Command) {
  const logger = new Logger('ServiceRunner');

  try {
    // Ensure database connection
    await DatabaseService.getInstance().connect();

    await program.parseAsync();
  } catch (error) {
    logger.error('Service execution error:', error);
    process.exit(1);
  } finally {
    await DatabaseService.getInstance().disconnect().catch(() => { });
  }
}