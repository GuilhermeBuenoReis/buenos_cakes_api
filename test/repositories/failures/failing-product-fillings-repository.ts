import type { ProductFillingsRepository } from '../../../src/domain/products/application/repositories/products-fillings-repository';
import type { ProductFillings } from '../../../src/domain/products/enterprise/entities/product_fillings';

export class FailingProductFillingsRepository
  implements ProductFillingsRepository
{
  async findById(_id: string): Promise<ProductFillings | null> {
    throw new Error('Unexpected repository error.');
  }

  async findByLabelAndProductId(
    _label: string,
    _productId: string
  ): Promise<ProductFillings | null> {
    throw new Error('Unexpected repository error.');
  }

  async findManyByProductId(_productId: string): Promise<ProductFillings[]> {
    throw new Error('Unexpected repository error.');
  }

  async findManyActiveByProductId(
    _productId: string
  ): Promise<ProductFillings[]> {
    throw new Error('Unexpected repository error.');
  }

  async findDefaultByProductId(
    _productId: string
  ): Promise<ProductFillings | null> {
    throw new Error('Unexpected repository error.');
  }

  async create(_productFilling: ProductFillings): Promise<ProductFillings> {
    throw new Error('Unexpected repository error.');
  }

  async save(_productFilling: ProductFillings): Promise<ProductFillings> {
    throw new Error('Unexpected repository error.');
  }

  async delete(_productFilling: ProductFillings): Promise<void> {
    throw new Error('Unexpected repository error.');
  }
}
