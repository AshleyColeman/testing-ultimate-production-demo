import { Logger } from '../../../utils/Logger';
import { DatabaseService } from '../../../utils/DatabaseService';
import { userService } from '../_data/userService';
import type { ServerCtxType } from '../../../lib/utils/types';

/**
 * CLI Command: Delete User
 *
 * Usage: npm run users delete -- --id=user_id
 */
export async function deleteUserCommand() {
  const logger = new Logger('DeleteUserCommand');

  try {
    // Ensure database connection
    await DatabaseService.getInstance().connect();

    // Parse command line arguments
    const args = process.argv.slice(2);
    const idArg = args.find(arg => arg.startsWith('--id='))?.split('=')[1];

    if (!idArg) {
      logger.error('Missing required argument. Usage: --id=user_id');
      process.exit(1);
    }

    // Set up service context
    const serverCtx: ServerCtxType = {
      accountUserId: 1,
      userRole: 'admin',
    };

    const _userService = userService(serverCtx);

    // Check if user exists first
    const existingUser = await _userService.getUserById(idArg);
    if (!existingUser) {
      logger.error(`❌ User with ID ${idArg} not found`);
      process.exit(1);
    }

    logger.info(`Found user: ${existingUser.name} (${existingUser.email})`);

    // Delete user
    const result = await _userService.deleteUser(idArg);

    if (result.success) {
      logger.info(`✅ User deleted successfully: ${existingUser.email}`);
    } else {
      logger.error('❌ Failed to delete user:');
      result.errors?.forEach((error: any) => logger.error(`  - ${error}`));
      process.exit(1);
    }
  } catch (error: any) {
    logger.error('Failed to delete user:', error);
    process.exit(1);
  } finally {
    await DatabaseService.getInstance().disconnect();
  }
}