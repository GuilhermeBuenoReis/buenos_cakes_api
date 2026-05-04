import { type Either, error, success } from '../../../../core/either';
import { UnexpectedError } from '../../../../core/errors/unexpected-error';
import type { ProductFillings } from '../../enterprise/entities/product_fillings';
import type { ProductFillingsRepository } from '../repositories/products-fillings-repository';

export interface ListProductsFillingsByProductServiceRequest {
  productId: string;
}

export type ListProductsFillingsByProductServiceResponse = Either<
  UnexpectedError,
  {
    productFillings: ProductFillings[];
  }
>;

export class ListProductsFillingsByProductService {
  constructor(private productFillingsRepository: ProductFillingsRepository) {}

  async execute({
    productId,
  }: ListProductsFillingsByProductServiceRequest): Promise<ListProductsFillingsByProductServiceResponse> {
    try {
      const productFillings =
        await this.productFillingsRepository.findManyByProductId(productId);

      return success({
        productFillings,
      });
    } catch {
      return error(new UnexpectedError());
    }
  }
}
