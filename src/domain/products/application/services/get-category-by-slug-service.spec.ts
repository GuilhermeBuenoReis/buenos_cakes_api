import { beforeEach, describe, expect, it } from 'vitest';
import { makeCategory } from '../../../../../test/factories/make-category';
import { FailingCategoriesRepository } from '../../../../../test/repositories/failures/failing-categories-repository';
import { InMemoryCategoriesRepository } from '../../../../../test/repositories/in-memory-categories-repository';
import { UnexpectedError } from '../../../../core/errors/unexpected-error';
import { Slug } from '../../enterprise/entities/value-objects/slug';
import { CategoryWithSlugNotFoundError } from '../errors/category-with-slug-not-found-error';
import { GetCategoryBySlugService } from './get-category-by-slug-service';

let inMemoryCategoriesRepository: InMemoryCategoriesRepository;
let failingCategoriesRepository: FailingCategoriesRepository;
let sut: GetCategoryBySlugService;

describe('GetCategoryBySlugService', () => {
  beforeEach(() => {
    inMemoryCategoriesRepository = new InMemoryCategoriesRepository();
    failingCategoriesRepository = new FailingCategoriesRepository();
    sut = new GetCategoryBySlugService(inMemoryCategoriesRepository);
  });

  it('should be able to get a category by slug', async () => {
    const newCategory = makeCategory({
      slug: Slug.create('birthday-cakes').value,
    });

    await inMemoryCategoriesRepository.create(newCategory);

    const result = await sut.execute({
      slug: 'birthday-cakes',
    });

    expect(result.isSuccess()).toBe(true);

    if (result.isSuccess()) {
      const { category } = result.value;

      expect(category.id).toBeTruthy();
      expect(category.name).toEqual(newCategory.name);
      expect(category.slug).toEqual('birthday-cakes');
    }
  });

  it('should return an error when category does not exist', async () => {
    const result = await sut.execute({
      slug: 'non-existing-category-slug',
    });

    expect(result.isError()).toBe(true);

    if (result.isError()) {
      expect(result.value).toBeInstanceOf(CategoryWithSlugNotFoundError);
      expect(result.value.message).toBe(
        'Category with slug "non-existing-category-slug" does not exist.'
      );
    }
  });

  it('should return an unexpected error when something goes wrong', async () => {
    sut = new GetCategoryBySlugService(failingCategoriesRepository);

    const result = await sut.execute({
      slug: 'birthday-cakes',
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
