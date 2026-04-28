import { type Either, error, success } from '../../../../core/either';
import { UnexpectedError } from '../../../../core/errors/unexpected-error';
import type { ProductSize } from '../../enterprise/entities/product-size';
import type { ProductSizesRepository } from '../repositories/product-sizes-repository';

export interface ListProductSizesByProductServiceRequest {
  productId: string;
}

export type ListProductSizesByProductServiceResponse = Either<
  UnexpectedError,
  {
    productSizes: ProductSize[];
  }
>;

export class ListProductSizesByProductService {
  constructor(private productSizesRepository: ProductSizesRepository) {}

  async execute({
    productId,
  }: ListProductSizesByProductServiceRequest): Promise<ListProductSizesByProductServiceResponse> {
    try {
      const productSizes =
        await this.productSizesRepository.findManyByProductId(productId);

      return success({
        productSizes,
      });
    } catch {
      return error(new UnexpectedError());
    }
  }
}
