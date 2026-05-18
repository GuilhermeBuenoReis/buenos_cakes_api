import { and, desc, eq } from 'drizzle-orm';

import type { PaginationParams } from '@/core/repositories/pagination-params';
import type { ProductsRepository } from '@/domain/products/application/repositories/products-repository';
import type { Product } from '@/domain/products/enterprise/entities/product';
import { ProductPresenter } from '@/infra/presenters/product-presenter';
import { db } from '..';
import { products } from '../schema/products';

const PRODUCTS_PER_PAGE = 20;

export class DrizzleProductsRepository implements ProductsRepository {
  async findById(id: string): Promise<Product | null> {
    const product = await db.query.products.findFirst({
      where: eq(products.id, id),
    });

    if (!product) {
      return null;
    }

    return ProductPresenter.toDomain(product);
  }

  async findBySlug(slug: string): Promise<Product | null> {
    const product = await db.query.products.findFirst({
      where: eq(products.slug, slug),
    });

    if (!product) {
      return null;
    }

    return ProductPresenter.toDomain(product);
  }

  async findMany({ page }: PaginationParams): Promise<Product[]> {
    const allProducts = await db.query.products.findMany({
      limit: PRODUCTS_PER_PAGE,
      offset: (page - 1) * PRODUCTS_PER_PAGE,
    });

    return allProducts.map(ProductPresenter.toDomain);
  }

  async findManyActive({ page }: PaginationParams): Promise<Product[]> {
    const activeProducts = await db.query.products.findMany({
      where: eq(products.isActive, true),
      limit: PRODUCTS_PER_PAGE,
      offset: (page - 1) * PRODUCTS_PER_PAGE,
    });

    return activeProducts.map(ProductPresenter.toDomain);
  }

  async findManyByCategoryId(
    categoryId: string,
    { page }: PaginationParams
  ): Promise<Product[]> {
    const categoryProducts = await db.query.products.findMany({
      where: eq(products.categoryId, categoryId),
      limit: PRODUCTS_PER_PAGE,
      offset: (page - 1) * PRODUCTS_PER_PAGE,
    });

    return categoryProducts.map(ProductPresenter.toDomain);
  }

  async findManyActiveByCategoryId(
    categoryId: string,
    { page }: PaginationParams
  ): Promise<Product[]> {
    const activeCategoryProducts = await db.query.products.findMany({
      where: and(
        eq(products.categoryId, categoryId),
        eq(products.isActive, true)
      ),
      limit: PRODUCTS_PER_PAGE,
      offset: (page - 1) * PRODUCTS_PER_PAGE,
    });

    return activeCategoryProducts.map(ProductPresenter.toDomain);
  }

  async findManyOrderByPopularity({
    page,
  }: PaginationParams): Promise<Product[]> {
    const orderedProducts = await db.query.products.findMany({
      orderBy: desc(products.popularityScore),
      limit: PRODUCTS_PER_PAGE,
      offset: (page - 1) * PRODUCTS_PER_PAGE,
    });

    return orderedProducts.map(ProductPresenter.toDomain);
  }

  async findManyOrderByRating({ page }: PaginationParams): Promise<Product[]> {
    const orderedProducts = await db.query.products.findMany({
      orderBy: desc(products.ratingAvg),
      limit: PRODUCTS_PER_PAGE,
      offset: (page - 1) * PRODUCTS_PER_PAGE,
    });

    return orderedProducts.map(ProductPresenter.toDomain);
  }

  async create(product: Product): Promise<Product> {
    const [created] = await db
      .insert(products)
      .values({
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
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
      })
      .returning();

    if (!created) {
      throw new Error('Failed to create product.');
    }

    return ProductPresenter.toDomain(created);
  }

  async save(product: Product): Promise<Product> {
    const [updatedProduct] = await db
      .update(products)
      .set({
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
        updatedAt: new Date(),
      })
      .where(eq(products.id, product.id.toString()))
      .returning();

    if (!updatedProduct) {
      throw new Error('Failed to update product.');
    }

    return ProductPresenter.toDomain(updatedProduct);
  }

  async delete(product: Product): Promise<void> {
    await db.delete(products).where(eq(products.id, product.id.toString()));
  }
}
