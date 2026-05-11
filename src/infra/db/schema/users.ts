import { createId } from '@paralleldrive/cuid2';
import { pgEnum, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

export const userRoleEnum = pgEnum('user_role', ['customer', 'admin']);

export const users = pgTable('users', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  password: text('password_hash').notNull(),
  cpf: text('cpf').unique(),
  phone: text('phone'),
  role: userRoleEnum('role').notNull().default('customer'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }),
});