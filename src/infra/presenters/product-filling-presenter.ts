import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { ProductFillings } from '@/domain/products/enterprise/entities/product_fillings';
import type { productFillings } from '../db/schema/product-fillings';

type DrizzleProductFilling = typeof productFillings.$inferSelect;

export class ProductFillingPresenter {
  static toDomain(productFilling: DrizzleProductFilling): ProductFillings {
    return ProductFillings.create(
      {
        productId: new UniqueEntityID(productFilling.productId),
        label: productFilling.label,
        priceDelta: productFilling.priceDelta,
        isDefault: productFilling.isDefault,
        sortOrder: productFilling.sortOrder,
        isActive: productFilling.isActive,
        createdAt: productFilling.createdAt,
        updatedAt: productFilling.updatedAt,
      },
      new UniqueEntityID(productFilling.id)
    );
  }

  static toHTTP(productFilling: ProductFillings) {
    return {
      id: productFilling.id.toString(),
      productId: productFilling.productId.toString(),
      label: productFilling.label,
      priceDelta: productFilling.priceDelta,
      isDefault: productFilling.isDefault,
      sortOrder: productFilling.sortOrder,
      isActive: productFilling.isActive,
      createdAt: productFilling.createdAt.toISOString(),
      updatedAt: productFilling.updatedAt?.toISOString() ?? null,
    };
  }
}
