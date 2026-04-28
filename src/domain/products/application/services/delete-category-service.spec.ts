import { beforeEach, describe, expect, it } from 'vitest';
import { makeCategory } from '../../../../../test/factories/make-category';
import { FailingCategoriesRepository } from '../../../../../test/repositories/failures/failing-categories-repository';
import { InMemoryCategoriesRepository } from '../../../../../test/repositories/in-memory-categories-repository';
import { UnexpectedError } from '../../../../core/errors/unexpected-error';
import { CategoryNotFoundError } from '../errors/category-not-found-error';
import { DeleteCategoryService } from './delete-category-service';

let inMemoryCategoriesRepository: InMemoryCategoriesRepository;
let failingCategoriesRepository: FailingCategoriesRepository;
let sut: DeleteCategoryService;

describe('DeleteCategoryService', () => {
  beforeEach(() => {
    inMemoryCategoriesRepository = new InMemoryCategoriesRepository();
    failingCategoriesRepository = new FailingCategoriesRepository();
    sut = new DeleteCategoryService(inMemoryCategoriesRepository);
  });

  it('should delete a category', async () => {
    const category = makeCategory();

    await inMemoryCategoriesRepository.create(category);

    const result = await sut.execute({
      categoryId: category.id.toString(),
    });

    expect(result.isSuccess()).toBe(true);
    expect(inMemoryCategoriesRepository.items).toHaveLength(0);

    if (result.isSuccess()) {
      expect(result.value.message).toBe('Category deleted successfully.');
    }
  });

  it('should not delete a category when id does not exist', async () => {
    const result = await sut.execute({
      categoryId: 'non-existing-category-id',
    });

    expect(result.isError()).toBe(true);

    if (result.isError()) {
      expect(result.value).toBeInstanceOf(CategoryNotFoundError);
    }
  });

  it('should return an unexpected error when something goes wrong', async () => {
    sut = new DeleteCategoryService(failingCategoriesRepository);

    const result = await sut.execute({
      categoryId: 'category-1',
    });

    expect(result.isError()).toBe(true);

    if (result.isError()) {
      expect(result.value).toBeInstanceOf(UnexpectedError);
      expect(result.value.message).toBe(
        'Something went wrong. Please try again later.'
      );
    }
  });
});
