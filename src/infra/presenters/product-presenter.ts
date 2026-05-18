import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { Product } from '@/domain/products/enterprise/entities/product';
import type { products } from '../db/schema/products';

type DrizzleProduct = typeof products.$inferSelect;

export class ProductPresenter {
  static toDomain(product: DrizzleProduct): Product {
    return Product.create(
      {
        categoryId: new UniqueEntityID(product.categoryId),
        name: product.name,
        slug: product.slug,
        description: product.description,
        basePrice: product.basePrice,
        coverImageUrl: product.coverImageUrl,
        ratingAvg: product.ratingAvg,
        reviewsCount: product.reviewsCount,
        popularityScore: product.popularityScore,
        isActive: product.isActive,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
      },
      new UniqueEntityID(product.id)
    );
  }

  static toHTTP(product: Product) {
    return {
      id: product.id.toString(),
      categoryId: product.categoryId.toString(),
      name: product.name,
      slug: product.slug,
      description: product.description,
      basePrice: product.basePrice,
      coverImageUrl: product.coverImageUrl,
      ratingAvg: product.ratingAvg,
      reviewsCount: product.reviewsCount,
      popularityScore: product.popularityScore,
      isActive: product.isActive,
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt?.toISOString() ?? null,
    };
  }
}
