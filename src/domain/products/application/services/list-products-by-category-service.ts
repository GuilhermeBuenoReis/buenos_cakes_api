import { type Either, error, success } from '../../../../core/either';
import { UnexpectedError } from '../../../../core/errors/unexpected-error';
import type { Product } from '../../enterprise/entities/product';
import type { ProductsRepository } from '../repositories/products-repository';

export interface ListProductsByCategoryServiceRequest {
  categoryId: string;
  page: number;
}

export type ListProductsByCategoryServiceResponse = Either<
  UnexpectedError,
  {
    products: Product[];
  }
>;

export class ListProductsByCategoryService {
  constructor(private productsRepository: ProductsRepository) {}

  async execute({
    categoryId,
    page,
  }: ListProductsByCategoryServiceRequest): Promise<ListProductsByCategoryServiceResponse> {
    try {
      const products = await this.productsRepository.findManyByCategoryId(
        categoryId,
        { page }
      );

      return success({
        products,
      });
    } catch {
      return error(new UnexpectedError());
    }
  }
}
