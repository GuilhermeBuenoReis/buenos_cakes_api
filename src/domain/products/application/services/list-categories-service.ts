import { type Either, error, success } from '../../../../core/either';
import { UnexpectedError } from '../../../../core/errors/unexpected-error';
import type { Category } from '../../enterprise/entities/category';
import type { CategoriesRepository } from '../repositories/categories-repository';

export interface ListCategoriesServiceRequest {
  page: number;
}

export type ListCategoriesServiceResponse = Either<
  UnexpectedError,
  {
    categories: Category[];
  }
>;

export class ListCategoriesService {
  constructor(private categoriesRepository: CategoriesRepository) {}

  async execute({
    page,
  }: ListCategoriesServiceRequest): Promise<ListCategoriesServiceResponse> {
    try {
      const categories = await this.categoriesRepository.findMany({
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
