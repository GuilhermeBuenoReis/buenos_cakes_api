import { addresses } from './address';
import { categories } from './categories';
import { productFillings } from './product-fillings';
import { productSizes } from './product-sizes';
import { products } from './products';
import { userRoleEnum, users } from './users';

export * from './address';
export * from './categories';
export * from './product-fillings';
export * from './product-sizes';
export * from './products';
export * from './users';

export const enums = {
  userRoleEnum,
};

export const tables = {
  users,
  addresses,
  categories,
  products,
  productSizes,
  productFillings,
};

export const schema = {
  ...enums,
  ...tables,
};
