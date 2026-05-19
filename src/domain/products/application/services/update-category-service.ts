import { type Either, error, success } from '../../../../core/either';
import { UnexpectedError } from '../../../../core/errors/unexpected-error';
import type { Category } from '../../enterprise/entities/category';
import { CategoryNotFoundError } from '../errors/category-not-found-error';
import { CategorySlugAlreadyExistsError } from '../errors/category-slug-already-exists-error';
import type { CategoriesRepository } from '../repositories/categories-repository';

export interface UpdateCategoryServiceRequest {
  categoryId: string;
  name?: string;
  slug?: string;
  description?: string | null;
  imageUrl?: string | null;
  isActive?: boolean;
}

export type UpdateCategoryServiceResponse = Either<
  CategoryNotFoundError | CategorySlugAlreadyExistsError | UnexpectedError,
  {
    category: Category;
  }
>;

export class UpdateCategoryService {
  constructor(private categoriesRepository: CategoriesRepository) {}

  async execute({
    categoryId,
    name,
    slug,
    description,
    imageUrl,
    isActive,
  }: UpdateCategoryServiceRequest): Promise<UpdateCategoryServiceResponse> {
    try {
      const category = await this.categoriesRepository.findById(categoryId);

      if (!category) {
        return error(new CategoryNotFoundError(categoryId));
      }

      const isSlugBeingChanged = slug && slug !== category.slug;

      if (isSlugBeingChanged) {
        const categoryWithSameSlug =
          await this.categoriesRepository.findBySlug(slug);

        const slugAlreadyInUseByAnotherCategory =
          categoryWithSameSlug && !categoryWithSameSlug.id.equals(category.id);

        if (slugAlreadyInUseByAnotherCategory) {
          return error(new CategorySlugAlreadyExistsError(slug));
        }
      }

      const fieldsToUpdate = {
        name,
        slug,
        description,
        imageUrl,
        isActive,
      };

      if (fieldsToUpdate.name !== undefined)
        category.name = fieldsToUpdate.name;
      if (fieldsToUpdate.slug !== undefined)
        category.slug = fieldsToUpdate.slug;
      if (fieldsToUpdate.description !== undefined)
        category.description = fieldsToUpdate.description;
      if (fieldsToUpdate.imageUrl !== undefined)
        category.imageUrl = fieldsToUpdate.imageUrl;
      if (fieldsToUpdate.isActive !== undefined)
        category.isActive = fieldsToUpdate.isActive;

      await this.categoriesRepository.save(category);

      return success({
        category,
      });
    } catch {
      return error(new UnexpectedError());
    }
  }
}
