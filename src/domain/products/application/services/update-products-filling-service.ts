import { type Either, error, success } from '../../../../core/either';
import { UnexpectedError } from '../../../../core/errors/unexpected-error';
import type { ProductFillings } from '../../enterprise/entities/product_fillings';
import { ProductFillingLabelAlreadyExistsError } from '../errors/product-filling-label-already-exists-error';
import { ProductFillingNotFoundError } from '../errors/product-filling-not-found-error';
import { ProductFillingDefaultHelper } from '../helpers/product-filling-default-helper';
import type { ProductFillingsRepository } from '../repositories/products-fillings-repository';

export interface UpdateProductsFillingServiceRequest {
  productFillingId: string;
  label?: string;
  priceDelta?: number;
  isDefault?: boolean;
  sortOrder?: number;
  isActive?: boolean;
}

export type UpdateProductsFillingServiceResponse = Either<
  | ProductFillingNotFoundError
  | ProductFillingLabelAlreadyExistsError
  | UnexpectedError,
  {
    productFilling: ProductFillings;
  }
>;

export class UpdateProductsFillingService {
  private productFillingDefaultHelper: ProductFillingDefaultHelper;

  constructor(private productFillingsRepository: ProductFillingsRepository) {
    this.productFillingDefaultHelper = new ProductFillingDefaultHelper(
      productFillingsRepository
    );
  }

  async execute({
    productFillingId,
    label,
    priceDelta,
    isDefault,
    sortOrder,
    isActive,
  }: UpdateProductsFillingServiceRequest): Promise<UpdateProductsFillingServiceResponse> {
    try {
      const productFilling =
        await this.productFillingsRepository.findById(productFillingId);

      if (!productFilling) {
        return error(new ProductFillingNotFoundError(productFillingId));
      }

      const isLabelBeingChanged = label && label !== productFilling.label;

      if (isLabelBeingChanged) {
        const productFillingWithSameLabel =
          await this.productFillingsRepository.findByLabelAndProductId(
            label,
            productFilling.productId.toString()
          );

        const labelAlreadyInUseByAnotherProductFilling =
          productFillingWithSameLabel &&
          !productFillingWithSameLabel.id.equals(productFilling.id);

        if (labelAlreadyInUseByAnotherProductFilling) {
          return error(new ProductFillingLabelAlreadyExistsError(label));
        }
      }

      const updatedDefaultStatus =
        await this.productFillingDefaultHelper.resolveUpdateDefaultStatus(
          productFilling,
          isDefault
        );

      const fieldsToUpdate = {
        label,
        priceDelta,
        isDefault: updatedDefaultStatus,
        sortOrder,
        isActive,
      };

      if (fieldsToUpdate.label !== undefined)
        productFilling.label = fieldsToUpdate.label;
      if (fieldsToUpdate.priceDelta !== undefined)
        productFilling.priceDelta = fieldsToUpdate.priceDelta;
      if (fieldsToUpdate.isDefault !== undefined)
        productFilling.isDefault = fieldsToUpdate.isDefault;
      if (fieldsToUpdate.sortOrder !== undefined)
        productFilling.sortOrder = fieldsToUpdate.sortOrder;
      if (fieldsToUpdate.isActive !== undefined)
        productFilling.isActive = fieldsToUpdate.isActive;

      await this.productFillingsRepository.save(productFilling);

      return success({
        productFilling,
      });
    } catch {
      return error(new UnexpectedError());
    }
  }
}
