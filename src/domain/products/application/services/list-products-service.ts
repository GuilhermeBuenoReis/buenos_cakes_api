import { type Either, error, success } from '../../../../core/either';
import { UnexpectedError } from '../../../../core/errors/unexpected-error';
import type { Product } from '../../enterprise/entities/product';
import type { ProductsRepository } from '../repositories/products-repository';

export interface ListProductsServiceRequest {
  page: number;
}

export type ListProductsServiceResponse = Either<
  UnexpectedError,
  {
    products: Product[];
  }
>;

export class ListProductsService {
  constructor(private productsRepository: ProductsRepository) {}

  async execute({
    page,
  }: ListProductsServiceRequest): Promise<ListProductsServiceResponse> {
    try {
      const products = await this.productsRepository.findMany({
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
