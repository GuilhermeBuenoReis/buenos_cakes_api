import { addresses } from './address';
import { userRoleEnum, users } from './users';

export * from './address';
export * from './users';

export const enums = {
  userRoleEnum,
};

export const tables = {
  users,
  addresses,
};

export const schema = {
  ...enums,
  ...tables,
};
