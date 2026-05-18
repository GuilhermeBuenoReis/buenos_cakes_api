import { createId } from '@paralleldrive/cuid2';
import { relations } from 'drizzle-orm';
import { boolean, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { users } from './users';

export const addresses = pgTable('addresses', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),

  userId: text('user_id')
    .notNull()
    .references(() => users.id, {
      onDelete: 'cascade',
    }),

  label: text('label').notNull(),
  recipientName: text('recipient_name').notNull(),
  street: text('street').notNull(),
  houseNumber: text('house_number').notNull(),
  complement: text('complement'),

  city: text('city').notNull(),
  state: text('state').notNull(),
  zipCode: text('zip_code').notNull(),

  reference: text('reference'),

  isDefault: boolean('is_default').notNull().default(false),

  createdAt: timestamp('created_at', {
    withTimezone: true,
  })
    .notNull()
    .defaultNow(),

  updatedAt: timestamp('updated_at', {
    withTimezone: true,
  }),
});

export const addressesRelations = relations(addresses, ({ one }) => {
  return {
    user: one(users, {
      fields: [addresses.userId],
      references: [users.id],
    }),
  };
});

export type AddressSelect = typeof addresses.$inferSelect;
export type AddressInsert = typeof addresses.$inferInsert;
