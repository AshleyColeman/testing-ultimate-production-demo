import { defineService, runService } from '../../lib/cli';
import { serviceFactory } from '../../lib/services/serviceFactory';
import { userService } from './_data/userService';
import { Logger } from '../../utils/Logger';

// Import CLI commands
import { createUserCommand } from './commands/createUser';
import { listUsersCommand } from './commands/listUsers';
import { deleteUserCommand } from './commands/deleteUser';
import { updateUserCommand } from './commands/updateUser';

/**
 * User Service CLI
 *
 * Command-line interface for user management operations.
 * Follows the Inter-Train service pattern with CLI framework integration.
 */

const commands = [
  {
    name: 'create',
    description: 'Create a new user',
    handler: createUserCommand,
  },
  {
    name: 'list',
    description: 'List all users',
    handler: listUsersCommand,
  },
  {
    name: 'delete',
    description: 'Delete a user by ID',
    handler: deleteUserCommand,
  },
  {
    name: 'update',
    description: 'Update user information',
    handler: updateUserCommand,
  },
];

const program = defineService('users', commands);
runService(program);