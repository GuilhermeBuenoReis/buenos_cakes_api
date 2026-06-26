import { createId } from '@paralleldrive/cuid2';
import { relations } from 'drizzle-orm';
import { jsonb, numeric, pgEnum, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { orders } from './orders';
import { payments } from './payments';
import { users } from './users';

export const orderAdjustmentTypeEnum = pgEnum('order_adjustment_type', [
  'additional_payment',
  'refund',
]);

export const orderAdjustmentStatusEnum = pgEnum('order_adjustment_status', [
  'pending',
  'confirmed',
  'canceled',
]);

export const orderAdjustments = pgTable('order_adjustments', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),

  orderId: text('order_id')
    .notNull()
    .references(() => orders.id, {
      onDelete: 'cascade',
    }),

  requestedByUserId: text('requested_by_user_id')
    .notNull()
    .references(() => users.id, {
      onDelete: 'restrict',
    }),

  type: orderAdjustmentTypeEnum('type').notNull(),
  status: orderAdjustmentStatusEnum('status').notNull().default('pending'),

  previousTotal: numeric('previous_total', {
    precision: 10,
    scale: 2,
    mode: 'number',
  }).notNull(),

  newTotal: numeric('new_total', {
    precision: 10,
    scale: 2,
    mode: 'number',
  }).notNull(),

  difference: numeric('difference', {
    precision: 10,
    scale: 2,
    mode: 'number',
  }).notNull(),

  paymentId: text('payment_id').references(() => payments.id, {
    onDelete: 'set null',
  }),

  operation: jsonb('operation').notNull(),

  reason: text('reason'),

  createdAt: timestamp('created_at', {
    withTimezone: true,
  })
    .notNull()
    .defaultNow(),

  confirmedAt: timestamp('confirmed_at', {
    withTimezone: true,
  }),

  updatedAt: timestamp('updated_at', {
    withTimezone: true,
  }),
});

export const orderAdjustmentsRelations = relations(
  orderAdjustments,
  ({ one }) => {
    return {
      order: one(orders, {
        fields: [orderAdjustments.orderId],
        references: [orders.id],
      }),
      requestedByUser: one(users, {
        fields: [orderAdjustments.requestedByUserId],
        references: [users.id],
      }),
      payment: one(payments, {
        fields: [orderAdjustments.paymentId],
        references: [payments.id],
      }),
    };
  }
);

export type OrderAdjustmentSelect = typeof orderAdjustments.$inferSelect;
export type OrderAdjustmentInsert = typeof orderAdjustments.$inferInsert;
