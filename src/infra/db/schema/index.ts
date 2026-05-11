import { userRoleEnum, users } from './users';

export * from './users';

export const enums = {
  userRoleEnum,
};

export const tables = {
  users,
};

export const schema = {
  ...enums,
  ...tables,
};
