import type { ProductFillingsRepository } from '../../src/domain/products/application/repositories/products-fillings-repository';
import type { ProductFillings } from '../../src/domain/products/enterprise/entities/product_fillings';

export class InMemoryProductFillingsRepository
  implements ProductFillingsRepository
{
  public items: ProductFillings[] = [];

  async findById(id: string): Promise<ProductFillings | null> {
    const productFilling = this.items.find((item) => item.id.toString() === id);

    if (!productFilling) {
      return null;
    }

    return productFilling;
  }

  async findByLabelAndProductId(
    label: string,
    productId: string
  ): Promise<ProductFillings | null> {
    const productFilling = this.items.find(
      (item) => item.label === label && item.productId.toString() === productId
    );

    if (!productFilling) {
      return null;
    }

    return productFilling;
  }

  async findManyByProductId(productId: string): Promise<ProductFillings[]> {
    return this.items.filter((item) => item.productId.toString() === productId);
  }

  async findManyActiveByProductId(productId: string): Promise<ProductFillings[]> {
    return this.items.filter(
      (item) => item.productId.toString() === productId && item.isActive
    );
  }

  async findDefaultByProductId(productId: string): Promise<ProductFillings | null> {
    const productFilling = this.items.find(
      (item) => item.productId.toString() === productId && item.isDefault
    );

    if (!productFilling) {
      return null;
    }

    return productFilling;
  }

  async create(productFilling: ProductFillings): Promise<ProductFillings> {
    this.items.push(productFilling);

    return productFilling;
  }

  async save(productFilling: ProductFillings): Promise<ProductFillings> {
    const productFillingIndex = this.items.findIndex((item) =>
      item.id.equals(productFilling.id)
    );

    this.items[productFillingIndex] = productFilling;

    return productFilling;
  }

  async delete(productFilling: ProductFillings): Promise<void> {
    const productFillingIndex = this.items.findIndex((item) =>
      item.id.equals(productFilling.id)
    );

    this.items.splice(productFillingIndex, 1);
  }
}
