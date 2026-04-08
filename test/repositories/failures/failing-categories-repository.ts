import type { Category } from '../../../domain/products/enterprise/entities/category';
import type { CategoriesRepository } from '../../../domain/products/application/repositories/categories-repository';

export class FailingCategoriesRepository implements CategoriesRepository {
  async findById(_id: string): Promise<Category | null> {
    throw new Error('Unexpected repository error.');
  }

  async findBySlug(_slug: string): Promise<Category | null> {
    throw new Error('Unexpected repository error.');
  }

  async findMany(): Promise<Category[]> {
    throw new Error('Unexpected repository error.');
  }

  async findManyActive(): Promise<Category[]> {
    throw new Error('Unexpected repository error.');
  }

  async create(_category: Category): Promise<Category> {
    throw new Error('Unexpected repository error.');
  }

  async save(_category: Category): Promise<Category> {
    throw new Error('Unexpected repository error.');
  }

  async delete(_category: Category): Promise<void> {
    throw new Error('Unexpected repository error.');
  }
}
