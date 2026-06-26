import { addresses } from './address';
import { categories } from './categories';
import {
  orderAdjustmentStatusEnum,
  orderAdjustmentTypeEnum,
  orderAdjustments,
} from './order-adjustments';
import { orderItems } from './order-items';
import {
  orderFulfillmentMethodEnum,
  orderStatusEnum,
  orders,
} from './orders';
import {
  paymentMethodEnum,
  paymentProviderEnum,
  paymentStatusEnum,
  payments,
} from './payments';
import { productFillings } from './product-fillings';
import { productSizes } from './product-sizes';
import { products } from './products';
import { userRoleEnum, users } from './users';

export * from './address';
export * from './categories';
export * from './order-adjustments';
export * from './order-items';
export * from './orders';
export * from './payments';
export * from './product-fillings';
export * from './product-sizes';
export * from './products';
export * from './users';

export const enums = {
  userRoleEnum,
  orderStatusEnum,
  orderFulfillmentMethodEnum,
  paymentMethodEnum,
  paymentProviderEnum,
  paymentStatusEnum,
  orderAdjustmentTypeEnum,
  orderAdjustmentStatusEnum,
};

export const tables = {
  users,
  addresses,
  categories,
  products,
  productSizes,
  productFillings,
  orders,
  orderItems,
  payments,
  orderAdjustments,
};

export const schema = {
  ...enums,
  ...tables,
};
