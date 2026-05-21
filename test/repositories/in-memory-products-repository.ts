import type { PaginationParams } from '../../src/core/repositories/pagination-params';
import type { ProductsRepository } from '../../src/domain/products/application/repositories/products-repository';
import type { Product } from '../../src/domain/products/enterprise/entities/product';

export class InMemoryProductsRepository implements ProductsRepository {
  public items: Product[] = [];

  async findById(id: string): Promise<Product | null> {
    const product = this.items.find((item) => item.id.toString() === id);

    if (!product) {
      return null;
    }

    return product;
  }

  async findBySlug(slug: string): Promise<Product | null> {
    const product = this.items.find((item) => item.slug === slug);

    if (!product) {
      return null;
    }

    return product;
  }

  async findMany({ page }: PaginationParams): Promise<Product[]> {
    return this.items.slice((page - 1) * 20, page * 20);
  }

  async findManyActive({ page }: PaginationParams): Promise<Product[]> {
    const activeProducts = this.items.filter((item) => item.isActive);

    return activeProducts.slice((page - 1) * 20, page * 20);
  }

  async findManyByCategoryId(
    id: string,
    { page }: PaginationParams
  ): Promise<Product[]> {
    const products = this.items.filter(
      (item) => item.categoryId.toString() === id
    );

    return products.slice((page - 1) * 20, page * 20);
  }

  async findManyActiveByCategoryId(
    id: string,
    { page }: PaginationParams
  ): Promise<Product[]> {
    const activeProducts = this.items.filter(
      (item) => item.categoryId.toString() === id && item.isActive
    );

    return activeProducts.slice((page - 1) * 20, page * 20);
  }

  async findManyOrderByPopularity({
    page,
  }: PaginationParams): Promise<Product[]> {
    const orderedProducts = [...this.items].sort(
      (a, b) => b.popularityScore - a.popularityScore
    );

    return orderedProducts.slice((page - 1) * 20, page * 20);
  }

  async findManyOrderByRating({ page }: PaginationParams): Promise<Product[]> {
    const orderedProducts = [...this.items].sort(
      (a, b) => b.ratingAvg - a.ratingAvg
    );

    return orderedProducts.slice((page - 1) * 20, page * 20);
  }

  async create(product: Product): Promise<Product> {
    this.items.push(product);

    return product;
  }

  async save(product: Product): Promise<Product> {
    const productIndex = this.items.findIndex((item) =>
      item.id.equals(product.id)
    );

    this.items[productIndex] = product;

    return product;
  }

  async delete(product: Product): Promise<void> {
    const productIndex = this.items.findIndex((item) =>
      item.id.equals(product.id)
    );

    this.items.splice(productIndex, 1);
  }
}
