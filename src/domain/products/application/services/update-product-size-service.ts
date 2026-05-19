import { type Either, error, success } from '../../../../core/either';
import { UnexpectedError } from '../../../../core/errors/unexpected-error';
import type { ProductSize } from '../../enterprise/entities/product-size';
import { ProductSizeCodeAlreadyExistsError } from '../errors/product-size-code-already-exists-error';
import { ProductSizeNotFoundError } from '../errors/product-size-not-found-error';
import { ProductSizeDefaultHelper } from '../helpers/product-size-default-helper';
import type { ProductSizesRepository } from '../repositories/product-sizes-repository';

export interface UpdateProductSizeServiceRequest {
  productSizeId: string;
  code?: string;
  label?: string;
  servingsLabel?: string | null;
  priceDelta?: number;
  isDefault?: boolean;
  sortOrder?: number;
  isActive?: boolean;
}

export type UpdateProductSizeServiceResponse = Either<
  | ProductSizeNotFoundError
  | ProductSizeCodeAlreadyExistsError
  | UnexpectedError,
  {
    productSize: ProductSize;
  }
>;

export class UpdateProductSizeService {
  private productSizeDefaultHelper: ProductSizeDefaultHelper;

  constructor(private productSizesRepository: ProductSizesRepository) {
    this.productSizeDefaultHelper = new ProductSizeDefaultHelper(
      productSizesRepository
    );
  }

  async execute({
    productSizeId,
    code,
    label,
    servingsLabel,
    priceDelta,
    isDefault,
    sortOrder,
    isActive,
  }: UpdateProductSizeServiceRequest): Promise<UpdateProductSizeServiceResponse> {
    try {
      const productSize =
        await this.productSizesRepository.findById(productSizeId);

      if (!productSize) {
        return error(new ProductSizeNotFoundError(productSizeId));
      }

      const isCodeBeingChanged = code && code !== productSize.code;

      if (isCodeBeingChanged) {
        const productSizeWithSameCode =
          await this.productSizesRepository.findByCodeAndProductId(
            code,
            productSize.productId.toString()
          );

        const codeAlreadyInUseByAnotherProductSize =
          productSizeWithSameCode &&
          !productSizeWithSameCode.id.equals(productSize.id);

        if (codeAlreadyInUseByAnotherProductSize) {
          return error(new ProductSizeCodeAlreadyExistsError(code));
        }
      }

      const updatedDefaultStatus =
        await this.productSizeDefaultHelper.resolveUpdateDefaultStatus(
          productSize,
          isDefault
        );

      const fieldsToUpdate = {
        code,
        label,
        servingsLabel,
        priceDelta,
        isDefault: updatedDefaultStatus,
        sortOrder,
        isActive,
      };

      if (fieldsToUpdate.code !== undefined)
        productSize.code = fieldsToUpdate.code;
      if (fieldsToUpdate.label !== undefined)
        productSize.label = fieldsToUpdate.label;
      if (fieldsToUpdate.servingsLabel !== undefined)
        productSize.servingsLabel = fieldsToUpdate.servingsLabel;
      if (fieldsToUpdate.priceDelta !== undefined)
        productSize.priceDelta = fieldsToUpdate.priceDelta;
      if (fieldsToUpdate.isDefault !== undefined)
        productSize.isDefault = fieldsToUpdate.isDefault;
      if (fieldsToUpdate.sortOrder !== undefined)
        productSize.sortOrder = fieldsToUpdate.sortOrder;
      if (fieldsToUpdate.isActive !== undefined)
        productSize.isActive = fieldsToUpdate.isActive;

      await this.productSizesRepository.save(productSize);

      return success({
        productSize,
      });
    } catch {
      return error(new UnexpectedError());
    }
  }
}
