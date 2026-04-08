import type { PaginationParams } from '../../../src/core/repositories/pagination-params';
import type { ProductsRepository } from '../../../src/domain/products/application/repositories/products-repository';
import type { Product } from '../../../src/domain/products/enterprise/entities/product';

export class FailingProductsRepository implements ProductsRepository {
  async findById(_id: string): Promise<Product | null> {
    throw new Error('Unexpected repository error.');
  }

  async findBySlug(_slug: string): Promise<Product | null> {
    throw new Error('Unexpected repository error.');
  }

  async findMany(_params: PaginationParams): Promise<Product[]> {
    throw new Error('Unexpected repository error.');
  }

  async findManyActive(_params: PaginationParams): Promise<Product[]> {
    throw new Error('Unexpected repository error.');
  }

  async findManyByCategoryId(
    _id: string,
    _params: PaginationParams
  ): Promise<Product[]> {
    throw new Error('Unexpected repository error.');
  }

  async findManyActiveByCategoryId(
    _id: string,
    _params: PaginationParams
  ): Promise<Product[]> {
    throw new Error('Unexpected repository error.');
  }

  async findManyOrderByPopularity(_params: PaginationParams): Promise<Product[]> {
    throw new Error('Unexpected repository error.');
  }

  async findManyOrderByRating(_params: PaginationParams): Promise<Product[]> {
    throw new Error('Unexpected repository error.');
  }

  async create(_product: Product): Promise<Product> {
    throw new Error('Unexpected repository error.');
  }

  async save(_product: Product): Promise<Product> {
    throw new Error('Unexpected repository error.');
  }

  async delete(_product: Product): Promise<void> {
    throw new Error('Unexpected repository error.');
  }
}
