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
import { categories } from './categories';

export const products = pgTable('products', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),

  categoryId: text('category_id')
    .notNull()
    .references(() => categories.id, {
      onDelete: 'restrict',
    }),

  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  basePrice: numeric('base_price', {
    precision: 10,
    scale: 2,
    mode: 'number',
  }).notNull(),
  coverImageUrl: text('cover_image_url'),

  ratingAvg: numeric('rating_avg', {
    precision: 3,
    scale: 2,
    mode: 'number',
  })
    .notNull()
    .default(0),
  reviewsCount: integer('reviews_count').notNull().default(0),
  popularityScore: integer('popularity_score').notNull().default(0),
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

export const productsRelations = relations(products, ({ one }) => {
  return {
    category: one(categories, {
      fields: [products.categoryId],
      references: [categories.id],
    }),
  };
});

export type ProductSelect = typeof products.$inferSelect;
export type ProductInsert = typeof products.$inferInsert;
