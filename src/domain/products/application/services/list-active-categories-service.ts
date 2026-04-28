import { type Either, error, success } from '../../../../core/either';
import { UnexpectedError } from '../../../../core/errors/unexpected-error';
import type { Category } from '../../enterprise/entities/category';
import type { CategoriesRepository } from '../repositories/categories-repository';

export interface ListActiveCategoriesServiceRequest {
  page: number;
}

export type ListActiveCategoriesServiceResponse = Either<
  UnexpectedError,
  {
    categories: Category[];
  }
>;

export class ListActiveCategoriesService {
  constructor(private categoriesRepository: CategoriesRepository) {}

  async execute({
    page,
  }: ListActiveCategoriesServiceRequest): Promise<ListActiveCategoriesServiceResponse> {
    try {
      const categories = await this.categoriesRepository.findManyActive({
        page,
      });

      return success({
        categories,
      });
    } catch {
      return error(new UnexpectedError());
    }
  }
}
