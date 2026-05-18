import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { Category } from '@/domain/products/enterprise/entities/category';
import type { categories } from '../db/schema/categories';

type DrizzleCategory = typeof categories.$inferSelect;

export class CategoryPresenter {
  static toDomain(category: DrizzleCategory): Category {
    return Category.create(
      {
        name: category.name,
        slug: category.slug,
        description: category.description,
        imageUrl: category.imageUrl,
        isActive: category.isActive,
        createdAt: category.createdAt,
        updatedAt: category.updatedAt,
      },
      new UniqueEntityID(category.id)
    );
  }

  static toHTTP(category: Category) {
    return {
      id: category.id.toString(),
      name: category.name,
      slug: category.slug,
      description: category.description,
      imageUrl: category.imageUrl,
      isActive: category.isActive,
      createdAt: category.createdAt.toISOString(),
      updatedAt: category.updatedAt?.toISOString() ?? null,
    };
  }
}
