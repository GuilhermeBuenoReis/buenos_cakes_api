import { createId } from '@paralleldrive/cuid2';
import { relations } from 'drizzle-orm';
import { numeric, pgEnum, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { orders } from './orders';

export const paymentMethodEnum = pgEnum('payment_method', [
  'pix',
  'credit_card',
  'debit_card',
  'cash',
]);

export const paymentProviderEnum = pgEnum('payment_provider', [
  'external',
  'manual',
]);

export const paymentStatusEnum = pgEnum('payment_status', [
  'pending',
  'processing',
  'paid',
  'failed',
  'canceled',
  'refunded',
]);

export const payments = pgTable('payments', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),

  orderId: text('order_id')
    .notNull()
    .references(() => orders.id, {
      onDelete: 'cascade',
    }),

  method: paymentMethodEnum('method').notNull(),
  provider: paymentProviderEnum('provider').notNull().default('external'),
  status: paymentStatusEnum('status').notNull().default('pending'),

  amount: numeric('amount', {
    precision: 10,
    scale: 2,
    mode: 'number',
  }).notNull(),

  currency: text('currency').notNull().default('brl'),

  providerName: text('provider_name'),
  providerReferenceId: text('provider_reference_id'),
  providerSessionId: text('provider_session_id'),
  providerCustomerId: text('provider_customer_id'),
  providerPaymentMethodId: text('provider_payment_method_id'),
  providerClientSecret: text('provider_client_secret'),
  providerStatus: text('provider_status'),

  pixQrCode: text('pix_qr_code'),
  pixQrCodeUrl: text('pix_qr_code_url'),
  expiresAt: timestamp('expires_at', {
    withTimezone: true,
  }),
  failureReason: text('failure_reason'),

  paidAt: timestamp('paid_at', {
    withTimezone: true,
  }),
  canceledAt: timestamp('canceled_at', {
    withTimezone: true,
  }),
  refundedAt: timestamp('refunded_at', {
    withTimezone: true,
  }),

  createdAt: timestamp('created_at', {
    withTimezone: true,
  })
    .notNull()
    .defaultNow(),

  updatedAt: timestamp('updated_at', {
    withTimezone: true,
  }),
});

export const paymentsRelations = relations(payments, ({ one }) => {
  return {
    order: one(orders, {
      fields: [payments.orderId],
      references: [orders.id],
    }),
  };
});

export type PaymentSelect = typeof payments.$inferSelect;
export type PaymentInsert = typeof payments.$inferInsert;
