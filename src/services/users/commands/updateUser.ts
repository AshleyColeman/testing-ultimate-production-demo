import { Logger } from '../../../utils/Logger';
import { DatabaseService } from '../../../utils/DatabaseService';
import { userService } from '../_data/userService';
import type { ServerCtxType } from '../../../lib/utils/types';

/**
 * CLI Command: Update User
 *
 * Usage: npm run users update -- --id=user_id --name="New Name" [--active=true|false]
 */
export async function updateUserCommand() {
  const logger = new Logger('UpdateUserCommand');

  try {
    // Ensure database connection
    await DatabaseService.getInstance().connect();

    // Parse command line arguments
    const args = process.argv.slice(2);
    const idArg = args.find(arg => arg.startsWith('--id='))?.split('=')[1];
    const nameArg = args.find(arg => arg.startsWith('--name='))?.split('=')[1];
    const activeArg = args.find(arg => arg.startsWith('--active='))?.split('=')[1];

    if (!idArg || !nameArg) {
      logger.error('Missing required arguments. Usage: --id=user_id --name="New Name" [--active=true|false]');
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

    // Prepare update data
    const updateData: any = {
      name: nameArg,
    };

    if (activeArg !== undefined) {
      updateData.isActive = activeArg.toLowerCase() === 'true';
    }

    // Update user
    const result = await _userService.updateUser(idArg, updateData);

    if (result.success) {
      logger.info(`✅ User updated successfully:`);
      logger.info(`  Name: ${result.data?.name}`);
      logger.info(`  Email: ${result.data?.email}`);
      logger.info(`  Active: ${result.data?.isActive ? 'Yes' : 'No'}`);
      logger.info(`  Updated: ${result.data?.updatedAt}`);
    } else {
      logger.error('❌ Failed to update user:');
      result.errors?.forEach((error: any) => logger.error(`  - ${error}`));
      process.exit(1);
    }
  } catch (error: any) {
    logger.error('Failed to update user:', error);
    process.exit(1);
  } finally {
    await DatabaseService.getInstance().disconnect();
  }
}