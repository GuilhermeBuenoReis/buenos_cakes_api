import { type Either, error, success } from '../../../../core/either';
import { UnexpectedError } from '../../../../core/errors/unexpected-error';
import type { Category } from '../../enterprise/entities/category';
import { CategoryNotFoundError } from '../errors/category-not-found-error';
import type { CategoriesRepository } from '../repositories/categories-repository';

export interface FetchCategoryByIdServiceRequest {
  categoryId: string;
}

export type FetchCategoryByIdServiceResponse = Either<
  CategoryNotFoundError | UnexpectedError,
  {
    category: Category;
  }
>;

export class FetchCategoryByIdService {
  constructor(private categoriesRepository: CategoriesRepository) {}

  async execute({
    categoryId,
  }: FetchCategoryByIdServiceRequest): Promise<FetchCategoryByIdServiceResponse> {
    try {
      const category = await this.categoriesRepository.findById(categoryId);

      if (!category) {
        return error(new CategoryNotFoundError(categoryId));
      }

      return success({
        category,
      });
    } catch {
      return error(new UnexpectedError());
    }
  }
}
