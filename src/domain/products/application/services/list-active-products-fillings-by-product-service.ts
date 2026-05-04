import { type Either, error, success } from '../../../../core/either';
import { UnexpectedError } from '../../../../core/errors/unexpected-error';
import type { ProductFillings } from '../../enterprise/entities/product_fillings';
import type { ProductFillingsRepository } from '../repositories/products-fillings-repository';

export interface ListActiveProductsFillingsByProductServiceRequest {
  productId: string;
}

export type ListActiveProductsFillingsByProductServiceResponse = Either<
  UnexpectedError,
  {
    productFillings: ProductFillings[];
  }
>;

export class ListActiveProductsFillingsByProductService {
  constructor(private productFillingsRepository: ProductFillingsRepository) {}

  async execute({
    productId,
  }: ListActiveProductsFillingsByProductServiceRequest): Promise<ListActiveProductsFillingsByProductServiceResponse> {
    try {
      const productFillings =
        await this.productFillingsRepository.findManyActiveByProductId(productId);

      return success({
        productFillings,
      });
    } catch {
      return error(new UnexpectedError());
    }
  }
}
