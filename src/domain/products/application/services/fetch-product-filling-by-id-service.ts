import { type Either, error, success } from '../../../../core/either';
import { UnexpectedError } from '../../../../core/errors/unexpected-error';
import type { ProductFillings } from '../../enterprise/entities/product_fillings';
import { ProductFillingNotFoundError } from '../errors/product-filling-not-found-error';
import type { ProductFillingsRepository } from '../repositories/products-fillings-repository';

export interface FetchProductFillingByIdServiceRequest {
  productFillingId: string;
}

export type FetchProductFillingByIdServiceResponse = Either<
  ProductFillingNotFoundError | UnexpectedError,
  {
    productFilling: ProductFillings;
  }
>;

export class FetchProductFillingByIdService {
  constructor(private productFillingsRepository: ProductFillingsRepository) {}

  async execute({
    productFillingId,
  }: FetchProductFillingByIdServiceRequest): Promise<FetchProductFillingByIdServiceResponse> {
    try {
      const productFilling =
        await this.productFillingsRepository.findById(productFillingId);

      if (!productFilling) {
        return error(new ProductFillingNotFoundError(productFillingId));
      }

      return success({
        productFilling,
      });
    } catch {
      return error(new UnexpectedError());
    }
  }
}
