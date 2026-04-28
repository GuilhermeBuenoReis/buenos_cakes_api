import type { Category } from '../../src/domain/products/enterprise/entities/category';
import type { CategoriesRepository } from '../../src/domain/products/application/repositories/categories-repository';
import type { PaginationParams } from '../../src/core/repositories/pagination-params';

export class InMemoryCategoriesRepository implements CategoriesRepository {
  public items: Category[] = [];

  async findById(id: string): Promise<Category | null> {
    const category = this.items.find((item) => item.id.toString() === id);

    if (!category) {
      return null;
    }

    return category;
  }

  async findBySlug(slug: string): Promise<Category | null> {
    const category = this.items.find((item) => item.slug === slug);

    if (!category) {
      return null;
    }

    return category;
  }

  async findMany({ page }: PaginationParams): Promise<Category[]> {

    return this.items.slice((page - 1) * 20, page * 20);
  }

  async findManyActive({ page }: PaginationParams): Promise<Category[]> {
    const activeCategories = this.items.filter((item) => item.isActive);

    return activeCategories.slice((page - 1) * 20, page * 20);
  }

  async create(category: Category): Promise<Category> {
    this.items.push(category);

    return category;
  }

  async save(category: Category): Promise<Category> {
    const categoryIndex = this.items.findIndex((item) => item.id.equals(category.id));

    this.items[categoryIndex] = category;

    return category;
  }

  async delete(category: Category): Promise<void> {
    const categoryIndex = this.items.findIndex((item) => item.id.equals(category.id));

    this.items.splice(categoryIndex, 1);
  }
}
