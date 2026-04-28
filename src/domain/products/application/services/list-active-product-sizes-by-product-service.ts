import { type Either, error, success } from '../../../../core/either';
import { UnexpectedError } from '../../../../core/errors/unexpected-error';
import type { ProductSize } from '../../enterprise/entities/product-size';
import type { ProductSizesRepository } from '../repositories/product-sizes-repository';

export interface ListActiveProductSizesByProductServiceRequest {
  productId: string;
}

export type ListActiveProductSizesByProductServiceResponse = Either<
  UnexpectedError,
  {
    productSizes: ProductSize[];
  }
>;

export class ListActiveProductSizesByProductService {
  constructor(private productSizesRepository: ProductSizesRepository) {}

  async execute({
    productId,
  }: ListActiveProductSizesByProductServiceRequest): Promise<ListActiveProductSizesByProductServiceResponse> {
    try {
      const productSizes =
        await this.productSizesRepository.findManyActiveByProductId(productId);

      return success({
        productSizes,
      });
    } catch {
      return error(new UnexpectedError());
    }
  }
}
