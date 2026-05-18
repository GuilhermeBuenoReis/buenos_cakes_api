import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { ProductSize } from '@/domain/products/enterprise/entities/product-size';
import type { productSizes } from '../db/schema/product-sizes';

type DrizzleProductSize = typeof productSizes.$inferSelect;

export class ProductSizePresenter {
  static toDomain(productSize: DrizzleProductSize): ProductSize {
    return ProductSize.create(
      {
        productId: new UniqueEntityID(productSize.productId),
        code: productSize.code,
        label: productSize.label,
        servingsLabel: productSize.servingsLabel,
        priceDelta: productSize.priceDelta,
        isDefault: productSize.isDefault,
        sortOrder: productSize.sortOrder,
        isActive: productSize.isActive,
        createdAt: productSize.createdAt,
        updatedAt: productSize.updatedAt,
      },
      new UniqueEntityID(productSize.id)
    );
  }

  static toHTTP(productSize: ProductSize) {
    return {
      id: productSize.id.toString(),
      productId: productSize.productId.toString(),
      code: productSize.code,
      label: productSize.label,
      servingsLabel: productSize.servingsLabel ?? null,
      priceDelta: productSize.priceDelta,
      isDefault: productSize.isDefault,
      sortOrder: productSize.sortOrder,
      isActive: productSize.isActive,
      createdAt: productSize.createdAt.toISOString(),
      updatedAt: productSize.updatedAt?.toISOString() ?? null,
    };
  }
}
