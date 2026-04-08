import { beforeEach, describe, expect, it } from 'vitest';
import { makeCategory } from '../../../../../test/factories/make-category';
import { FailingCategoriesRepository } from '../../../../../test/repositories/failures/failing-categories-repository';
import { InMemoryCategoriesRepository } from '../../../../../test/repositories/in-memory-categories-repository';
import { UnexpectedError } from '../../../../core/errors/unexpected-error';
import { CategoryNotFoundError } from '../errors/category-not-found-error';
import { FetchCategoryByIdService } from './fetch-category-by-id-service';

let inMemoryCategoriesRepository: InMemoryCategoriesRepository;
let failingCategoriesRepository: FailingCategoriesRepository;
let sut: FetchCategoryByIdService;

describe('FetchCategoryByIdService', () => {
  beforeEach(() => {
    inMemoryCategoriesRepository = new InMemoryCategoriesRepository();
    failingCategoriesRepository = new FailingCategoriesRepository();
    sut = new FetchCategoryByIdService(inMemoryCategoriesRepository);
  });

  it('should get a category by id', async () => {
    const category = makeCategory({
      name: 'Birthday Cakes',
      slug: 'birthday-cakes',
    });

    await inMemoryCategoriesRepository.create(category);

    const categoryId = category.id.toString();

    const result = await sut.execute({
      categoryId,
    });

    expect(result.isSuccess()).toBe(true);

    if (result.isSuccess()) {
      expect(result.value.category.id).toEqual(category.id);
      expect(result.value.category.name).toBe('Birthday Cakes');
      expect(result.value.category.slug).toBe('birthday-cakes');
    }
  });

  it('should return an error when category does not exist', async () => {
    const nonExistingCategoryId = 'non-existing-category-id';

    const result = await sut.execute({
      categoryId: nonExistingCategoryId,
    });

    expect(result.isError()).toBe(true);

    if (result.isError()) {
      expect(result.value).toBeInstanceOf(CategoryNotFoundError);
      expect(result.value.message).toBe(
        `Category with id "${nonExistingCategoryId}" does not exist.`
      );
    }
  });

  it('should return an unexpected error when something goes wrong', async () => {
    sut = new FetchCategoryByIdService(failingCategoriesRepository);

    const categoryIdToFind = 'any-category-id';

    const result = await sut.execute({
      categoryId: categoryIdToFind,
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
