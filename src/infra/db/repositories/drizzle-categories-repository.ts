import { eq } from 'drizzle-orm';

import type { PaginationParams } from '@/core/repositories/pagination-params';
import type { CategoriesRepository } from '@/domain/products/application/repositories/categories-repository';
import type { Category } from '@/domain/products/enterprise/entities/category';
import { CategoryPresenter } from '@/infra/presenters/category-presenter';
import { db } from '..';
import { categories } from '../schema/categories';

const CATEGORIES_PER_PAGE = 20;

export class DrizzleCategoriesRepository implements CategoriesRepository {
  async findById(id: string): Promise<Category | null> {
    const category = await db.query.categories.findFirst({
      where: eq(categories.id, id),
    });

    if (!category) {
      return null;
    }

    return CategoryPresenter.toDomain(category);
  }

  async findBySlug(slug: string): Promise<Category | null> {
    const category = await db.query.categories.findFirst({
      where: eq(categories.slug, slug),
    });

    if (!category) {
      return null;
    }

    return CategoryPresenter.toDomain(category);
  }

  async findMany({ page }: PaginationParams): Promise<Category[]> {
    const allCategories = await db.query.categories.findMany({
      limit: CATEGORIES_PER_PAGE,
      offset: (page - 1) * CATEGORIES_PER_PAGE,
    });

    return allCategories.map(CategoryPresenter.toDomain);
  }

  async findManyActive({ page }: PaginationParams): Promise<Category[]> {
    const activeCategories = await db.query.categories.findMany({
      where: eq(categories.isActive, true),
      limit: CATEGORIES_PER_PAGE,
      offset: (page - 1) * CATEGORIES_PER_PAGE,
    });

    return activeCategories.map(CategoryPresenter.toDomain);
  }

  async create(category: Category): Promise<Category> {
    const [created] = await db
      .insert(categories)
      .values({
        id: category.id.toString(),
        name: category.name,
        slug: category.slug,
        description: category.description,
        imageUrl: category.imageUrl,
        isActive: category.isActive,
        createdAt: category.createdAt,
        updatedAt: category.updatedAt,
      })
      .returning();

    if (!created) {
      throw new Error('Failed to create category.');
    }

    return CategoryPresenter.toDomain(created);
  }

  async save(category: Category): Promise<Category> {
    const [updatedCategory] = await db
      .update(categories)
      .set({
        name: category.name,
        slug: category.slug,
        description: category.description,
        imageUrl: category.imageUrl,
        isActive: category.isActive,
        updatedAt: new Date(),
      })
      .where(eq(categories.id, category.id.toString()))
      .returning();

    if (!updatedCategory) {
      throw new Error('Failed to update category.');
    }

    return CategoryPresenter.toDomain(updatedCategory);
  }

  async delete(category: Category): Promise<void> {
    await db.delete(categories).where(eq(categories.id, category.id.toString()));
  }
}
