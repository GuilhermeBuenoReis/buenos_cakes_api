import { type Either, error, success } from '../../../../core/either';
import { UnexpectedError } from '../../../../core/errors/unexpected-error';
import type { Product } from '../../enterprise/entities/product';
import type { ProductsRepository } from '../repositories/products-repository';

export interface ListProductsByPopularityServiceRequest {
  page: number;
}

export type ListProductsByPopularityServiceResponse = Either<
  UnexpectedError,
  {
    products: Product[];
  }
>;

export class ListProductsByPopularityService {
  constructor(private productsRepository: ProductsRepository) {}

  async execute({
    page,
  }: ListProductsByPopularityServiceRequest): Promise<ListProductsByPopularityServiceResponse> {
    try {
      const products = await this.productsRepository.findManyOrderByPopularity({
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
