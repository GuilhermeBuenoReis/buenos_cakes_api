import { createId } from '@paralleldrive/cuid2';
import { relations } from 'drizzle-orm';
import {
  boolean,
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import { products } from './products';

export const productSizes = pgTable('product_sizes', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),

  productId: text('product_id')
    .notNull()
    .references(() => products.id, {
      onDelete: 'cascade',
    }),

  code: text('code').notNull().unique(),
  label: text('label').notNull(),
  servingsLabel: text('servings_label'),
  priceDelta: numeric('price_delta', {
    precision: 10,
    scale: 2,
    mode: 'number',
  }).notNull(),

  isDefault: boolean('is_default').notNull().default(false),
  sortOrder: integer('sort_order').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),

  createdAt: timestamp('created_at', {
    withTimezone: true,
  })
    .notNull()
    .defaultNow(),

  updatedAt: timestamp('updated_at', {
    withTimezone: true,
  }),
});

export const productSizesRelations = relations(productSizes, ({ one }) => {
  return {
    product: one(products, {
      fields: [productSizes.productId],
      references: [products.id],
    }),
  };
});

export type ProductSizeSelect = typeof productSizes.$inferSelect;
export type ProductSizeInsert = typeof productSizes.$inferInsert;
