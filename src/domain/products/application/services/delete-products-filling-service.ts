import { type Either, error, success } from '../../../../core/either';
import { UnexpectedError } from '../../../../core/errors/unexpected-error';
import { ProductFillingNotFoundError } from '../errors/product-filling-not-found-error';
import type { ProductFillingsRepository } from '../repositories/products-fillings-repository';

export interface DeleteProductsFillingServiceRequest {
  productFillingId: string;
}

export type DeleteProductsFillingServiceResponse = Either<
  ProductFillingNotFoundError | UnexpectedError,
  {
    message: string;
  }
>;

export class DeleteProductsFillingService {
  constructor(private productFillingsRepository: ProductFillingsRepository) {}

  async execute({
    productFillingId,
  }: DeleteProductsFillingServiceRequest): Promise<DeleteProductsFillingServiceResponse> {
    try {
      const productFilling =
        await this.productFillingsRepository.findById(productFillingId);

      if (!productFilling) {
        return error(new ProductFillingNotFoundError(productFillingId));
      }

      await this.productFillingsRepository.delete(productFilling);

      return success({
        message: 'Product filling deleted successfully.',
      });
    } catch {
      return error(new UnexpectedError());
    }
  }
}
