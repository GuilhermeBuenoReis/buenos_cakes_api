import { type Either, error, success } from '../../../../core/either';
import { UnexpectedError } from '../../../../core/errors/unexpected-error';
import type { Product } from '../../enterprise/entities/product';
import type { ProductsRepository } from '../repositories/products-repository';

export interface ListProductsByRatingServiceRequest {
  page: number;
}

export type ListProductsByRatingServiceResponse = Either<
  UnexpectedError,
  {
    products: Product[];
  }
>;

export class ListProductsByRatingService {
  constructor(private productsRepository: ProductsRepository) {}

  async execute({
    page,
  }: ListProductsByRatingServiceRequest): Promise<ListProductsByRatingServiceResponse> {
    try {
      const products = await this.productsRepository.findManyOrderByRating({
        page,
      });

      return success({
        products,
      });
    } catch {
      return error(new UnexpectedError());
    }
  }
}
