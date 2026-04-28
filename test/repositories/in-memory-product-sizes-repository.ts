import type { ProductSizesRepository } from '../../src/domain/products/application/repositories/product-sizes-repository';
import type { ProductSize } from '../../src/domain/products/enterprise/entities/product-size';

export class InMemoryProductSizesRepository implements ProductSizesRepository {
  public items: ProductSize[] = [];

  async findById(id: string): Promise<ProductSize | null> {
    const productSize = this.items.find((item) => item.id.toString() === id);

    if (!productSize) {
      return null;
    }

    return productSize;
  }

  async findByCodeAndProductId(
    code: string,
    productId: string
  ): Promise<ProductSize | null> {
    const productSize = this.items.find(
      (item) => item.code === code && item.productId.toString() === productId
    );

    if (!productSize) {
      return null;
    }

    return productSize;
  }

  async findManyByProductId(productId: string): Promise<ProductSize[]> {
    return this.items.filter((item) => item.productId.toString() === productId);
  }

  async findManyActiveByProductId(productId: string): Promise<ProductSize[]> {
    return this.items.filter(
      (item) => item.productId.toString() === productId && item.isActive
    );
  }

  async findDefaultByProductId(productId: string): Promise<ProductSize | null> {
    const productSize = this.items.find(
      (item) => item.productId.toString() === productId && item.isDefault
    );

    if (!productSize) {
      return null;
    }

    return productSize;
  }

  async create(productSize: ProductSize): Promise<ProductSize> {
    this.items.push(productSize);

    return productSize;
  }

  async save(productSize: ProductSize): Promise<ProductSize> {
    const productSizeIndex = this.items.findIndex((item) =>
      item.id.equals(productSize.id)
    );

    this.items[productSizeIndex] = productSize;

    return productSize;
  }

  async delete(productSize: ProductSize): Promise<void> {
    const productSizeIndex = this.items.findIndex((item) =>
      item.id.equals(productSize.id)
    );

    this.items.splice(productSizeIndex, 1);
  }
}
