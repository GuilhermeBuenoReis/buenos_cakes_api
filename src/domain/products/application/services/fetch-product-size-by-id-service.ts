import { type Either, error, success } from '../../../../core/either';
import { UnexpectedError } from '../../../../core/errors/unexpected-error';
import type { ProductSize } from '../../enterprise/entities/product-size';
import { ProductSizeNotFoundError } from '../errors/product-size-not-found-error';
import type { ProductSizesRepository } from '../repositories/product-sizes-repository';

export interface FetchProductSizeByIdServiceRequest {
  productSizeId: string;
}

export type FetchProductSizeByIdServiceResponse = Either<
  ProductSizeNotFoundError | UnexpectedError,
  {
    productSize: ProductSize;
  }
>;

export class FetchProductSizeByIdService {
  constructor(private productSizesRepository: ProductSizesRepository) {}

  async execute({
    productSizeId,
  }: FetchProductSizeByIdServiceRequest): Promise<FetchProductSizeByIdServiceResponse> {
    try {
      const productSize = await this.productSizesRepository.findById(productSizeId);

      if (!productSize) {
        return error(new ProductSizeNotFoundError(productSizeId));
      }

      return success({
        productSize,
      });
    } catch {
      return error(new UnexpectedError());
    }
  }
}
