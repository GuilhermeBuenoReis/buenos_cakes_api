import type { ProductSizesRepository } from '../../../src/domain/products/application/repositories/product-sizes-repository';
import type { ProductSize } from '../../../src/domain/products/enterprise/entities/product-size';

export class FailingProductSizesRepository implements ProductSizesRepository {
  async findById(_id: string): Promise<ProductSize | null> {
    throw new Error('Unexpected repository error.');
  }

  async findByCodeAndProductId(
    _code: string,
    _productId: string
  ): Promise<ProductSize | null> {
    throw new Error('Unexpected repository error.');
  }

  async findManyByProductId(_productId: string): Promise<ProductSize[]> {
    throw new Error('Unexpected repository error.');
  }

  async findManyActiveByProductId(_productId: string): Promise<ProductSize[]> {
    throw new Error('Unexpected repository error.');
  }

  async findDefaultByProductId(_productId: string): Promise<ProductSize | null> {
    throw new Error('Unexpected repository error.');
  }

  async create(_productSize: ProductSize): Promise<ProductSize> {
    throw new Error('Unexpected repository error.');
  }

  async save(_productSize: ProductSize): Promise<ProductSize> {
    throw new Error('Unexpected repository error.');
  }

  async delete(_productSize: ProductSize): Promise<void> {
    throw new Error('Unexpected repository error.');
  }
}
