import { and, asc, eq } from 'drizzle-orm';

import type { ProductSizesRepository } from '@/domain/products/application/repositories/product-sizes-repository';
import type { ProductSize } from '@/domain/products/enterprise/entities/product-size';
import { ProductSizePresenter } from '@/infra/presenters/product-size-presenter';
import { db } from '..';
import { productSizes } from '../schema/product-sizes';

export class DrizzleProductSizesRepository implements ProductSizesRepository {
  async findById(id: string): Promise<ProductSize | null> {
    const productSize = await db.query.productSizes.findFirst({
      where: eq(productSizes.id, id),
    });

    if (!productSize) {
      return null;
    }

    return ProductSizePresenter.toDomain(productSize);
  }

  async findByCodeAndProductId(
    code: string,
    productId: string
  ): Promise<ProductSize | null> {
    const productSize = await db.query.productSizes.findFirst({
      where: and(
        eq(productSizes.code, code),
        eq(productSizes.productId, productId)
      ),
    });

    if (!productSize) {
      return null;
    }

    return ProductSizePresenter.toDomain(productSize);
  }

  async findManyByProductId(productId: string): Promise<ProductSize[]> {
    const productProductSizes = await db.query.productSizes.findMany({
      where: eq(productSizes.productId, productId),
      orderBy: asc(productSizes.sortOrder),
    });

    return productProductSizes.map(ProductSizePresenter.toDomain);
  }

  async findManyActiveByProductId(productId: string): Promise<ProductSize[]> {
    const activeProductSizes = await db.query.productSizes.findMany({
      where: and(
        eq(productSizes.productId, productId),
        eq(productSizes.isActive, true)
      ),
      orderBy: asc(productSizes.sortOrder),
    });

    return activeProductSizes.map(ProductSizePresenter.toDomain);
  }

  async findDefaultByProductId(productId: string): Promise<ProductSize | null> {
    const productSize = await db.query.productSizes.findFirst({
      where: and(
        eq(productSizes.productId, productId),
        eq(productSizes.isDefault, true)
      ),
    });

    if (!productSize) {
      return null;
    }

    return ProductSizePresenter.toDomain(productSize);
  }

  async create(productSize: ProductSize): Promise<ProductSize> {
    const [created] = await db
      .insert(productSizes)
      .values({
        id: productSize.id.toString(),
        productId: productSize.productId.toString(),
        code: productSize.code,
        label: productSize.label,
        servingsLabel: productSize.servingsLabel,
        priceDelta: productSize.priceDelta,
        isDefault: productSize.isDefault,
        sortOrder: productSize.sortOrder,
        isActive: productSize.isActive,
        createdAt: productSize.createdAt,
        updatedAt: productSize.updatedAt,
      })
      .returning();

    if (!created) {
      throw new Error('Failed to create product size.');
    }

    return ProductSizePresenter.toDomain(created);
  }

  async save(productSize: ProductSize): Promise<ProductSize> {
    const [updatedProductSize] = await db
      .update(productSizes)
      .set({
        productId: productSize.productId.toString(),
        code: productSize.code,
        label: productSize.label,
        servingsLabel: productSize.servingsLabel,
        priceDelta: productSize.priceDelta,
        isDefault: productSize.isDefault,
        sortOrder: productSize.sortOrder,
        isActive: productSize.isActive,
        updatedAt: new Date(),
      })
      .where(eq(productSizes.id, productSize.id.toString()))
      .returning();

    if (!updatedProductSize) {
      throw new Error('Failed to update product size.');
    }

    return ProductSizePresenter.toDomain(updatedProductSize);
  }

  async delete(productSize: ProductSize): Promise<void> {
    await db
      .delete(productSizes)
      .where(eq(productSizes.id, productSize.id.toString()));
  }
}
