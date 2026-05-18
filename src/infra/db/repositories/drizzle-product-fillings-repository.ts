import { and, asc, eq } from 'drizzle-orm';

import type { ProductFillingsRepository } from '@/domain/products/application/repositories/products-fillings-repository';
import type { ProductFillings } from '@/domain/products/enterprise/entities/product_fillings';
import { ProductFillingPresenter } from '@/infra/presenters/product-filling-presenter';
import { db } from '..';
import { productFillings } from '../schema/product-fillings';

export class DrizzleProductFillingsRepository
  implements ProductFillingsRepository
{
  async findById(id: string): Promise<ProductFillings | null> {
    const productFilling = await db.query.productFillings.findFirst({
      where: eq(productFillings.id, id),
    });

    if (!productFilling) {
      return null;
    }

    return ProductFillingPresenter.toDomain(productFilling);
  }

  async findByLabelAndProductId(
    label: string,
    productId: string
  ): Promise<ProductFillings | null> {
    const productFilling = await db.query.productFillings.findFirst({
      where: and(
        eq(productFillings.label, label),
        eq(productFillings.productId, productId)
      ),
    });

    if (!productFilling) {
      return null;
    }

    return ProductFillingPresenter.toDomain(productFilling);
  }

  async findManyByProductId(productId: string): Promise<ProductFillings[]> {
    const productProductFillings = await db.query.productFillings.findMany({
      where: eq(productFillings.productId, productId),
      orderBy: asc(productFillings.sortOrder),
    });

    return productProductFillings.map(ProductFillingPresenter.toDomain);
  }

  async findManyActiveByProductId(
    productId: string
  ): Promise<ProductFillings[]> {
    const activeProductFillings = await db.query.productFillings.findMany({
      where: and(
        eq(productFillings.productId, productId),
        eq(productFillings.isActive, true)
      ),
      orderBy: asc(productFillings.sortOrder),
    });

    return activeProductFillings.map(ProductFillingPresenter.toDomain);
  }

  async findDefaultByProductId(
    productId: string
  ): Promise<ProductFillings | null> {
    const productFilling = await db.query.productFillings.findFirst({
      where: and(
        eq(productFillings.productId, productId),
        eq(productFillings.isDefault, true)
      ),
    });

    if (!productFilling) {
      return null;
    }

    return ProductFillingPresenter.toDomain(productFilling);
  }

  async create(productFilling: ProductFillings): Promise<ProductFillings> {
    const [created] = await db
      .insert(productFillings)
      .values({
        id: productFilling.id.toString(),
        productId: productFilling.productId.toString(),
        label: productFilling.label,
        priceDelta: productFilling.priceDelta,
        isDefault: productFilling.isDefault,
        sortOrder: productFilling.sortOrder,
        isActive: productFilling.isActive,
        createdAt: productFilling.createdAt,
        updatedAt: productFilling.updatedAt,
      })
      .returning();

    if (!created) {
      throw new Error('Failed to create product filling.');
    }

    return ProductFillingPresenter.toDomain(created);
  }

  async save(productFilling: ProductFillings): Promise<ProductFillings> {
    const [updatedProductFilling] = await db
      .update(productFillings)
      .set({
        productId: productFilling.productId.toString(),
        label: productFilling.label,
        priceDelta: productFilling.priceDelta,
        isDefault: productFilling.isDefault,
        sortOrder: productFilling.sortOrder,
        isActive: productFilling.isActive,
        updatedAt: new Date(),
      })
      .where(eq(productFillings.id, productFilling.id.toString()))
      .returning();

    if (!updatedProductFilling) {
      throw new Error('Failed to update product filling.');
    }

    return ProductFillingPresenter.toDomain(updatedProductFilling);
  }

  async delete(productFilling: ProductFillings): Promise<void> {
    await db
      .delete(productFillings)
      .where(eq(productFillings.id, productFilling.id.toString()));
  }
}
