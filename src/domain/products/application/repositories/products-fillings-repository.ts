import type { ProductFillings } from '../../enterprise/entities/product_fillings';

export interface ProductFillingsRepository {
  findById(id: string): Promise<ProductFillings | null>;
  findByLabelAndProductId(
    label: string,
    productId: string
  ): Promise<ProductFillings | null>;
  findManyByProductId(productId: string): Promise<ProductFillings[]>;
  findManyActiveByProductId(productId: string): Promise<ProductFillings[]>;
  findDefaultByProductId(productId: string): Promise<ProductFillings | null>;
  create(productFilling: ProductFillings): Promise<ProductFillings>;
  save(productFilling: ProductFillings): Promise<ProductFillings>;
  delete(productFilling: ProductFillings): Promise<void>;
}
