import { type Either, error, success } from '../../../../core/either';
import { UnexpectedError } from '../../../../core/errors/unexpected-error';
import type { Product } from '../../enterprise/entities/product';
import { ProductNotFoundError } from '../errors/product-not-found-error';
import type { ProductsRepository } from '../repositories/products-repository';

export interface FetchProductByIdServiceRequest {
  productId: string;
}

export type FetchProductByIdServiceResponse = Either<
  ProductNotFoundError | UnexpectedError,
  {
    product: Product;
  }
>;

export class FetchProductByIdService {
  constructor(private productsRepository: ProductsRepository) {}

  async execute({
    productId,
  }: FetchProductByIdServiceRequest): Promise<FetchProductByIdServiceResponse> {
    try {
      const product = await this.productsRepository.findById(productId);

      if (!product) {
        return error(new ProductNotFoundError(productId));
      }

      return success({
        product,
      });
    } catch {
      return error(new UnexpectedError());
    }
  }
}
