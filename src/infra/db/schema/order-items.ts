import { createId } from '@paralleldrive/cuid2';
import { relations } from 'drizzle-orm';
import { integer, numeric, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { orders } from './orders';
import { productFillings } from './product-fillings';
import { productSizes } from './product-sizes';
import { products } from './products';

export const orderItems = pgTable('order_items', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),

  orderId: text('order_id')
    .notNull()
    .references(() => orders.id, {
      onDelete: 'cascade',
    }),

  productId: text('product_id')
    .notNull()
    .references(() => products.id, {
      onDelete: 'restrict',
    }),

  productSizeId: text('product_size_id').references(() => productSizes.id, {
    onDelete: 'set null',
  }),

  productFillingId: text('product_filling_id').references(
    () => productFillings.id,
    {
      onDelete: 'set null',
    }
  ),

  quantity: integer('quantity').notNull(),

  unitPrice: numeric('unit_price', {
    precision: 10,
    scale: 2,
    mode: 'number',
  }).notNull(),

  total: numeric('total', {
    precision: 10,
    scale: 2,
    mode: 'number',
  }).notNull(),

  note: text('note'),

  createdAt: timestamp('created_at', {
    withTimezone: true,
  })
    .notNull()
    .defaultNow(),

  updatedAt: timestamp('updated_at', {
    withTimezone: true,
  }),
});

export const orderItemsRelations = relations(orderItems, ({ one }) => {
  return {
    order: one(orders, {
      fields: [orderItems.orderId],
      references: [orders.id],
    }),
    product: one(products, {
      fields: [orderItems.productId],
      references: [products.id],
    }),
    productSize: one(productSizes, {
      fields: [orderItems.productSizeId],
      references: [productSizes.id],
    }),
    productFilling: one(productFillings, {
      fields: [orderItems.productFillingId],
      references: [productFillings.id],
    }),
  };
});

export type OrderItemSelect = typeof orderItems.$inferSelect;
export type OrderItemInsert = typeof orderItems.$inferInsert;
