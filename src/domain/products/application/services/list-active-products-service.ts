import { type Either, error, success } from '../../../../core/either';
import { UnexpectedError } from '../../../../core/errors/unexpected-error';
import type { Product } from '../../enterprise/entities/product';
import type { ProductsRepository } from '../repositories/products-repository';

export interface ListActiveProductsServiceRequest {
  page: number;
}

export type ListActiveProductsServiceResponse = Either<
  UnexpectedError,
  {
    products: Product[];
  }
>;

export class ListActiveProductsService {
  constructor(private productsRepository: ProductsRepository) {}

  async execute({
    page,
  }: ListActiveProductsServiceRequest): Promise<ListActiveProductsServiceResponse> {
    try {
      const products = await this.productsRepository.findManyActive({
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
