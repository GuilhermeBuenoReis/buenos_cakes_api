import { beforeEach, describe, expect, it } from 'vitest';
import { makeCategory } from '../../../../test/factories/make-category';
import { FailingCategoriesRepository } from '../../../../test/repositories/failures/failing-categories-repository';
import { InMemoryCategoriesRepository } from '../../../../test/repositories/in-memory-categories-repository';
import { CreateCategoryService } from './create-category-service';
import { CategorySlugAlreadyExistsError } from '../errors/category-slug-already-exists-error';
import { UnexpectedError } from '../../../../core/errors/unexpected-error';

let inMemoryCategoriesRepository: InMemoryCategoriesRepository;
let failingCategoriesRepository: FailingCategoriesRepository;
let sut: CreateCategoryService;

describe('CreateCategoryService', () => {
  beforeEach(() => {
    inMemoryCategoriesRepository = new InMemoryCategoriesRepository();
    failingCategoriesRepository = new FailingCategoriesRepository();
    sut = new CreateCategoryService(inMemoryCategoriesRepository);
  });

  it('should create a category', async () => {
    const result = await sut.execute({
      name: 'Birthday Cakes',
      slug: 'birthday-cakes',
      description: 'Categories for birthday cake products.',
      imageUrl: 'https://example.com/birthday-cakes.png',
    });

    expect(result.isSuccess()).toBe(true);
    expect(inMemoryCategoriesRepository.items).toHaveLength(1);

    if (result.isSuccess()) {
      expect(result.value.category.name).toBe('Birthday Cakes');
      expect(result.value.category.slug).toBe('birthday-cakes');
      expect(result.value.category.isActive).toBe(true);
    }
  });

  it('should not create a category with the same slug twice', async () => {
    const existingCategory = makeCategory({
      slug: 'birthday-cakes',
    });

    await inMemoryCategoriesRepository.create(existingCategory);

    const result = await sut.execute({
      name: 'Party Cakes',
      slug: 'birthday-cakes',
    });

    expect(result.isError()).toBe(true);
    expect(inMemoryCategoriesRepository.items).toHaveLength(1);

    if (result.isError()) {
      expect(result.value).toBeInstanceOf(CategorySlugAlreadyExistsError);
    }
  });

  it('should return an unexpected error when something goes wrong', async () => {
    sut = new CreateCategoryService(failingCategoriesRepository);

    const result = await sut.execute({
      name: 'Wedding Cakes',
      slug: 'wedding-cakes',
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
