import { type Either, error, success } from '../../../../core/either';
import { UniqueEntityID } from '../../../../core/entities/unique-entity-id';
import { UnexpectedError } from '../../../../core/errors/unexpected-error';
import { ProductFillings } from '../../enterprise/entities/product_fillings';
import { ProductFillingLabelAlreadyExistsError } from '../errors/product-filling-label-already-exists-error';
import { ProductNotFoundError } from '../errors/product-not-found-error';
import { ProductFillingDefaultHelper } from '../helpers/product-filling-default-helper';
import type { ProductFillingsRepository } from '../repositories/products-fillings-repository';
import type { ProductsRepository } from '../repositories/products-repository';

export interface CreateProductsFillingServiceRequest {
  productId: string;
  label: string;
  priceDelta: number;
  isDefault?: boolean;
  sortOrder?: number;
  isActive?: boolean;
}

export type CreateProductsFillingServiceResponse = Either<
  | ProductNotFoundError
  | ProductFillingLabelAlreadyExistsError
  | UnexpectedError,
  {
    productFilling: ProductFillings;
  }
>;

export class CreateProductsFillingService {
  private productFillingDefaultHelper: ProductFillingDefaultHelper;

  constructor(
    private productsRepository: ProductsRepository,
    private productFillingsRepository: ProductFillingsRepository
  ) {
    this.productFillingDefaultHelper = new ProductFillingDefaultHelper(
      productFillingsRepository
    );
  }

  async execute({
    productId,
    label,
    priceDelta,
    isDefault,
    sortOrder,
    isActive,
  }: CreateProductsFillingServiceRequest): Promise<CreateProductsFillingServiceResponse> {
    try {
      const product = await this.productsRepository.findById(productId);

      if (!product) {
        return error(new ProductNotFoundError(productId));
      }

      const existingProductFillingWithSameLabel =
        await this.productFillingsRepository.findByLabelAndProductId(
          label,
          productId
        );

      if (existingProductFillingWithSameLabel) {
        return error(new ProductFillingLabelAlreadyExistsError(label));
      }

      const newProductFillingShouldBeDefault =
        await this.productFillingDefaultHelper.resolveCreateDefaultStatus(
          productId,
          isDefault
        );

      const productFilling = ProductFillings.create({
        productId: new UniqueEntityID(productId),
        label,
        priceDelta,
        isDefault: newProductFillingShouldBeDefault,
        sortOrder,
        isActive,
      });

      await this.productFillingsRepository.create(productFilling);

      return success({
        productFilling,
      });
    } catch {
      return error(new UnexpectedError());
    }
  }
}
