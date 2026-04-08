import type { PaginationParams } from '../../../../core/repositories/pagination-params';
import type { Product } from '../../enterprise/entities/product';

export interface ProductsRepository {
  findById(id: string): Promise<Product | null>;
  findBySlug(slug: string): Promise<Product | null>;
  findMany(params: PaginationParams): Promise<Product[]>;
  findManyActive(params: PaginationParams): Promise<Product[]>;
  findManyByCategoryId(
    categoryId: string,
    params: PaginationParams
  ): Promise<Product[]>;
  findManyActiveByCategoryId(
    categoryId: string,
    params: PaginationParams
  ): Promise<Product[]>;
  findManyOrderByPopularity(params: PaginationParams): Promise<Product[]>;
  findManyOrderByRating(params: PaginationParams): Promise<Product[]>;
  create(product: Product): Promise<Product>;
  save(product: Product): Promise<Product>;
  delete(product: Product): Promise<void>;
}
