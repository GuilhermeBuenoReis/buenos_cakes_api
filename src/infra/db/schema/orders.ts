import { createId } from '@paralleldrive/cuid2';
import { relations } from 'drizzle-orm';
import { numeric, pgEnum, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { addresses } from './address';
import { users } from './users';

export const orderStatusEnum = pgEnum('order_status', [
  'pending',
  'confirmed',
  'preparing',
  'ready',
  'completed',
  'canceled',
]);

export const orderFulfillmentMethodEnum = pgEnum('order_fulfillment_method', [
  'pickup',
  'delivery',
]);

export const orders = pgTable('orders', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),

  userId: text('user_id')
    .notNull()
    .references(() => users.id, {
      onDelete: 'restrict',
    }),

  status: orderStatusEnum('status').notNull().default('pending'),
  fulfillmentMethod: orderFulfillmentMethodEnum('fulfillment_method').notNull(),

  deliveryAddressId: text('delivery_address_id').references(() => addresses.id, {
    onDelete: 'set null',
  }),

  pickupScheduledAt: timestamp('pickup_scheduled_at', {
    withTimezone: true,
  }),

  customerNote: text('customer_note'),

  subtotal: numeric('subtotal', {
    precision: 10,
    scale: 2,
    mode: 'number',
  }).notNull(),

  deliveryFee: numeric('delivery_fee', {
    precision: 10,
    scale: 2,
    mode: 'number',
  })
    .notNull()
    .default(0),

  total: numeric('total', {
    precision: 10,
    scale: 2,
    mode: 'number',
  }).notNull(),

  createdAt: timestamp('created_at', {
    withTimezone: true,
  })
    .notNull()
    .defaultNow(),

  updatedAt: timestamp('updated_at', {
    withTimezone: true,
  }),
});

export const ordersRelations = relations(orders, ({ one }) => {
  return {
    user: one(users, {
      fields: [orders.userId],
      references: [users.id],
    }),
    deliveryAddress: one(addresses, {
      fields: [orders.deliveryAddressId],
      references: [addresses.id],
    }),
  };
});

export type OrderSelect = typeof orders.$inferSelect;
export type OrderInsert = typeof orders.$inferInsert;
