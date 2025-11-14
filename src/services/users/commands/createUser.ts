import { Logger } from '../../../utils/Logger';
import { DatabaseService } from '../../../utils/DatabaseService';
import { userService } from '../_data/userService';
import type { ServerCtxType } from '../../../lib/utils/types';

/**
 * CLI Command: Create User
 *
 * Usage: npm run users create -- --email=user@example.com --name="John Doe"
 */
export async function createUserCommand() {
  const logger = new Logger('CreateUserCommand');

  try {
    // Ensure database connection
    await DatabaseService.getInstance().connect();

    // Parse command line arguments
    const args = process.argv.slice(2);
    const emailArg = args.find(arg => arg.startsWith('--email='))?.split('=')[1];
    const nameArg = args.find(arg => arg.startsWith('--name='))?.split('=')[1];

    if (!emailArg || !nameArg) {
      logger.error('Missing required arguments. Usage: --email=user@example.com --name="John Doe"');
      process.exit(1);
    }

    // Set up service context
    const serverCtx: ServerCtxType = {
      accountUserId: 1,
      userRole: 'admin',
    };

    const _userService = userService(serverCtx);

    // Create user
    const result = await _userService.createUser({
      email: emailArg,
      name: nameArg,
    });

    if (result.success) {
      logger.info(`✅ User created successfully: ${result.data?.email}`);
      logger.info(`User ID: ${result.data?.id}`);
    } else {
      logger.error('❌ Failed to create user:');
      result.errors?.forEach((error: any) => logger.error(`  - ${error}`));
      process.exit(1);
    }
  } catch (error: any) {
    logger.error('Failed to create user:', error);
    process.exit(1);
  } finally {
    await DatabaseService.getInstance().disconnect();
  }
}