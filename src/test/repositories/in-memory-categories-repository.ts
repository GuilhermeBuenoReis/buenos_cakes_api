import type { Category } from '../../core/entities/category';
import type { CategoriesRepository } from '../../core/repositories/categories-repository';

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

  async findMany(): Promise<Category[]> {
    return this.items;
  }

  async findManyActive(): Promise<Category[]> {
    return this.items.filter((item) => item.isActive);
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
