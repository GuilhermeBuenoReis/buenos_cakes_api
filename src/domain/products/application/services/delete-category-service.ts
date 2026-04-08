import { type Either, error, success } from '../../../../core/either';
import { UnexpectedError } from '../../../../core/errors/unexpected-error';
import { CategoryNotFoundError } from '../errors/category-not-found-error';
import type { CategoriesRepository } from '../repositories/categories-repository';

export interface DeleteCategoryServiceRequest {
  categoryId: string;
}

export type DeleteCategoryServiceResponse = Either<
  CategoryNotFoundError | UnexpectedError,
  {
    message: string;
  }
>;

export class DeleteCategoryService {
  constructor(private categoriesRepository: CategoriesRepository) {}

  async execute({
    categoryId,
  }: DeleteCategoryServiceRequest): Promise<DeleteCategoryServiceResponse> {
    try {
      const category = await this.categoriesRepository.findById(categoryId);

      if (!category) {
        return error(new CategoryNotFoundError(categoryId));
      }

      await this.categoriesRepository.delete(category);

      return success({
        message: 'Category deleted successfully.',
      });
    } catch {
      return error(new UnexpectedError());
    }
  }
}
