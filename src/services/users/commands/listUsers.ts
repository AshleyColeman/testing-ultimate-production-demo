import { Logger } from '../../../utils/Logger';
import { DatabaseService } from '../../../utils/DatabaseService';
import { userService } from '../_data/userService';
import type { ServerCtxType } from '../../../lib/utils/types';

/**
 * CLI Command: List Users
 *
 * Usage: npm run users list [--page=1] [--limit=20]
 */
export async function listUsersCommand() {
  const logger = new Logger('ListUsersCommand');

  try {
    // Ensure database connection
    await DatabaseService.getInstance().connect();

    // Parse command line arguments
    const args = process.argv.slice(2);
    const pageArg = args.find(arg => arg.startsWith('--page='))?.split('=')[1];
    const limitArg = args.find(arg => arg.startsWith('--limit='))?.split('=')[1];

    const page = pageArg ? parseInt(pageArg, 10) : 1;
    const limit = limitArg ? parseInt(limitArg, 10) : 20;

    // Set up service context
    const serverCtx: ServerCtxType = {
      accountUserId: 1,
      userRole: 'admin',
    };

    const _userService = userService(serverCtx);

    // Get users
    const result = await _userService.getAllUsers({ page, limit });

    if (result.success && result.data) {
      logger.info(`📋 Users (Page ${result.pagination.page} of ${result.pagination.totalPages}):`);
      logger.info(`Total: ${result.pagination.total} users`);

      result.data.forEach((user: any, index: number) => {
        logger.info(`${index + 1}. ${user.name} (${user.email}) - ${user.isActive ? 'Active' : 'Inactive'}`);
        logger.info(`   ID: ${user.id} | Created: ${user.createdAt}`);
      });

      if (result.pagination.hasNext) {
        logger.info(`\nNext page: ${result.pagination.page + 1}`);
      }
      if (result.pagination.hasPrev) {
        logger.info(`Previous page: ${result.pagination.page - 1}`);
      }
    } else {
      logger.error('❌ Failed to list users');
      result.errors?.forEach((error: any) => logger.error(`  - ${error}`));
      process.exit(1);
    }
  } catch (error: any) {
    logger.error('Failed to list users:', error);
    process.exit(1);
  } finally {
    await DatabaseService.getInstance().disconnect();
  }
}