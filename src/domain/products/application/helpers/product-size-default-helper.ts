import type { ProductSize } from '../../enterprise/entities/product-size';
import type { ProductSizesRepository } from '../repositories/product-sizes-repository';

export class ProductSizeDefaultHelper {
  constructor(private productSizesRepository: ProductSizesRepository) {}

  async resolveCreateDefaultStatus(
    productId: string,
    requestedDefaultStatus?: boolean
  ): Promise<boolean> {
    const currentDefaultProductSize =
      await this.productSizesRepository.findDefaultByProductId(productId);

    const newProductSizeShouldBeDefault = currentDefaultProductSize
      ? (requestedDefaultStatus ?? false)
      : true;

    if (newProductSizeShouldBeDefault && currentDefaultProductSize) {
      currentDefaultProductSize.isDefault = false;
      await this.productSizesRepository.save(currentDefaultProductSize);
    }

    return newProductSizeShouldBeDefault;
  }

  async resolveUpdateDefaultStatus(
    productSize: ProductSize,
    requestedDefaultStatus?: boolean
  ): Promise<boolean | undefined> {
    if (requestedDefaultStatus === undefined) {
      return undefined;
    }

    const currentDefaultProductSize =
      await this.productSizesRepository.findDefaultByProductId(
        productSize.productId.toString()
      );

    if (!currentDefaultProductSize) {
      return true;
    }

    if (
      !requestedDefaultStatus &&
      currentDefaultProductSize.id.equals(productSize.id)
    ) {
      return true;
    }

    if (
      requestedDefaultStatus &&
      !currentDefaultProductSize.id.equals(productSize.id)
    ) {
      currentDefaultProductSize.isDefault = false;
      await this.productSizesRepository.save(currentDefaultProductSize);
    }

    return requestedDefaultStatus;
  }
}
