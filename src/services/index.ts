// Legacy UserService (keeping for backward compatibility)
export {
  UserService,
  userService as legacyUserService,
  type User as LegacyUser,
  type CreateUserInput as LegacyCreateUserInput,
  type UpdateUserInput as LegacyUpdateUserInput,
} from "./UserService";

// New Inter-Train pattern services
export * from "./users/actions";
export { userService } from "./users/_data/userService";
export { userProvider } from "./users/_data/userProvider";
export {
  type User,
  type CreateUserInput,
  type UpdateUserInput,
} from "./users/_data/userService";
export {
  CreateUserSchema,
  UpdateUserSchema,
  UserIdSchema,
  UserFiltersSchema,
  type UserIdInput,
  type UserFiltersInput,
} from "./users/_data/userSchema";

// Service factory and utilities
export { serviceFactory, ServiceFactory } from "../lib/services/serviceFactory";
export * from "../lib/utils/types";
export * from "../lib/utils/validation";
export * from "../lib/utils/mappers";
