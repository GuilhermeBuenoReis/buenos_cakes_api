import { type Either, error, success } from '../../../../core/either';
import { UnexpectedError } from '../../../../core/errors/unexpected-error';
import type { Product } from '../../enterprise/entities/product';
import type { ProductsRepository } from '../repositories/products-repository';

export interface ListActiveProductsByCategoryServiceRequest {
  categoryId: string;
  page: number;
}

export type ListActiveProductsByCategoryServiceResponse = Either<
  UnexpectedError,
  {
    products: Product[];
  }
>;

export class ListActiveProductsByCategoryService {
  constructor(private productsRepository: ProductsRepository) {}

  async execute({
    categoryId,
    page,
  }: ListActiveProductsByCategoryServiceRequest): Promise<ListActiveProductsByCategoryServiceResponse> {
    try {
      const products = await this.productsRepository.findManyActiveByCategoryId(
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
