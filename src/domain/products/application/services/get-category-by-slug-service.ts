import { type Either, error, success } from '../../../../core/either';
import { UnexpectedError } from '../../../../core/errors/unexpected-error';
import type { Category } from '../../enterprise/entities/category';
import { CategoryWithSlugNotFoundError } from '../errors/category-with-slug-not-found-error';
import type { CategoriesRepository } from '../repositories/categories-repository';

export interface GetCategoryBySlugServiceRequest {
  slug: string;
}

export type GetCategoryBySlugServiceResponse = Either<
  CategoryWithSlugNotFoundError | UnexpectedError,
  {
    category: Category;
  }
>;

export class GetCategoryBySlugService {
  constructor(private categoriesRepository: CategoriesRepository) {}

  async execute({
    slug,
  }: GetCategoryBySlugServiceRequest): Promise<GetCategoryBySlugServiceResponse> {
    try {
      const category = await this.categoriesRepository.findBySlug(slug);

      if (!category) {
        return error(new CategoryWithSlugNotFoundError(slug));
      }

      return success({
        category,
      });
    } catch {
      return error(new UnexpectedError());
    }
  }
}
