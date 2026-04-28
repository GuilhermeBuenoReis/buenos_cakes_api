import { type Either, error, success } from '../../../../core/either';
import { UnexpectedError } from '../../../../core/errors/unexpected-error';
import { ProductSizeNotFoundError } from '../errors/product-size-not-found-error';
import type { ProductSizesRepository } from '../repositories/product-sizes-repository';

export interface DeleteProductSizeServiceRequest {
  productSizeId: string;
}

export type DeleteProductSizeServiceResponse = Either<
  ProductSizeNotFoundError | UnexpectedError,
  {
    message: string;
  }
>;

export class DeleteProductSizeService {
  constructor(private productSizesRepository: ProductSizesRepository) {}

  async execute({
    productSizeId,
  }: DeleteProductSizeServiceRequest): Promise<DeleteProductSizeServiceResponse> {
    try {
      const productSize = await this.productSizesRepository.findById(productSizeId);

      if (!productSize) {
        return error(new ProductSizeNotFoundError(productSizeId));
      }

      await this.productSizesRepository.delete(productSize);

      return success({
        message: 'Product size deleted successfully.',
      });
    } catch {
      return error(new UnexpectedError());
    }
  }
}
