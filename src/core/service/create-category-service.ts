import { Category } from '../entities/category';
import type { CategoriesRepository } from '../repositories/categories-repository';
import { type Either, error, success } from '../utils/either';
import { CategorySlugAlreadyExistsError } from './errors/category-slug-already-exists-error';
import { UnexpectedError } from './errors/unexpected-error';

export interface CreateCategoryServiceRequest {
  name: string;
  slug: string;
  description?: string | null;
  imageUrl?: string | null;
  isActive?: boolean;
}

export type CreateCategoryServiceResponse = Either<
  CategorySlugAlreadyExistsError | UnexpectedError,
  {
    category: Category;
  }
>;

export class CreateCategoryService {
  constructor(private categoriesRepository: CategoriesRepository) {}

  async execute({
    name,
    slug,
    description,
    imageUrl,
    isActive,
  }: CreateCategoryServiceRequest): Promise<CreateCategoryServiceResponse> {
    try {
      const existingCategoryWithSameSlug =
        await this.categoriesRepository.findBySlug(slug);

      if (existingCategoryWithSameSlug) {
        return error(new CategorySlugAlreadyExistsError(slug));
      }

      const category = Category.create({
        name,
        slug,
        description,
        imageUrl,
        isActive,
      });

      await this.categoriesRepository.create(category);

      return success({
        category,
      });
    } catch {
      return error(new UnexpectedError());
    }
  }
}
