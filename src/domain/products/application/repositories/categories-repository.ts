import type { Category } from '../../enterprise/entities/category';

export interface CategoriesRepository {
  findById(id: string): Promise<Category | null>;
  findBySlug(slug: string): Promise<Category | null>;
  findMany(): Promise<Category[]>;
  findManyActive(): Promise<Category[]>;
  create(category: Category): Promise<Category>;
  save(category: Category): Promise<Category>;
  delete(category: Category): Promise<void>;
}
