import type { ProductFillings } from '../../enterprise/entities/product_fillings';
import type { ProductFillingsRepository } from '../repositories/products-fillings-repository';

export class ProductFillingDefaultHelper {
  constructor(private productFillingsRepository: ProductFillingsRepository) {}

  async resolveCreateDefaultStatus(
    productId: string,
    requestedDefaultStatus?: boolean
  ): Promise<boolean> {
    const currentDefaultProductFilling =
      await this.productFillingsRepository.findDefaultByProductId(productId);

    const newProductFillingShouldBeDefault = currentDefaultProductFilling
      ? (requestedDefaultStatus ?? false)
      : true;

    if (newProductFillingShouldBeDefault && currentDefaultProductFilling) {
      currentDefaultProductFilling.isDefault = false;
      await this.productFillingsRepository.save(currentDefaultProductFilling);
    }

    return newProductFillingShouldBeDefault;
  }

  async resolveUpdateDefaultStatus(
    productFilling: ProductFillings,
    requestedDefaultStatus?: boolean
  ): Promise<boolean | undefined> {
    if (requestedDefaultStatus === undefined) {
      return undefined;
    }

    const currentDefaultProductFilling =
      await this.productFillingsRepository.findDefaultByProductId(
        productFilling.productId.toString()
      );

    if (!currentDefaultProductFilling) {
      return true;
    }

    if (
      !requestedDefaultStatus &&
      currentDefaultProductFilling.id.equals(productFilling.id)
    ) {
      return true;
    }

    if (
      requestedDefaultStatus &&
      !currentDefaultProductFilling.id.equals(productFilling.id)
    ) {
      currentDefaultProductFilling.isDefault = false;
      await this.productFillingsRepository.save(currentDefaultProductFilling);
    }

    return requestedDefaultStatus;
  }
}
