import type { ProductSize } from '../../enterprise/entities/product-size';

export interface ProductSizesRepository {
  findById(id: string): Promise<ProductSize | null>;
  findByCodeAndProductId(
    code: string,
    productId: string
  ): Promise<ProductSize | null>;
  findManyByProductId(productId: string): Promise<ProductSize[]>;
  findManyActiveByProductId(productId: string): Promise<ProductSize[]>;
  findDefaultByProductId(productId: string): Promise<ProductSize | null>;
  create(productSize: ProductSize): Promise<ProductSize>;
  save(productSize: ProductSize): Promise<ProductSize>;
  delete(productSize: ProductSize): Promise<void>;
}
