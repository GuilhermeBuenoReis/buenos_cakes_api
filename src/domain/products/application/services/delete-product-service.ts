import { type Either, error, success } from '../../../../core/either';
import { UnexpectedError } from '../../../../core/errors/unexpected-error';
import { ProductNotFoundError } from '../errors/product-not-found-error';
import type { ProductsRepository } from '../repositories/products-repository';

export interface DeleteProductServiceRequest {
  productId: string;
}

export type DeleteProductServiceResponse = Either<
  ProductNotFoundError | UnexpectedError,
  {
    message: string;
  }
>;

export class DeleteProductService {
  constructor(private productsRepository: ProductsRepository) {}

  async execute({
    productId,
  }: DeleteProductServiceRequest): Promise<DeleteProductServiceResponse> {
    try {
      const product = await this.productsRepository.findById(productId);

      if (!product) {
        return error(new ProductNotFoundError(productId));
      }

      await this.productsRepository.delete(product);

      return success({
        message: 'Product deleted successfully.',
      });
    } catch {
      return error(new UnexpectedError());
    }
  }
}
