import { beforeEach, describe, expect, it } from 'vitest';
import { makeCategory } from '../../../../../test/factories/make-category';
import { FailingCategoriesRepository } from '../../../../../test/repositories/failures/failing-categories-repository';
import { InMemoryCategoriesRepository } from '../../../../../test/repositories/in-memory-categories-repository';
import { UnexpectedError } from '../../../../core/errors/unexpected-error';
import { CategoryNotFoundError } from '../errors/category-not-found-error';
import { CategorySlugAlreadyExistsError } from '../errors/category-slug-already-exists-error';
import { UpdateCategoryService } from './update-category-service';

let inMemoryCategoriesRepository: InMemoryCategoriesRepository;
let failingCategoriesRepository: FailingCategoriesRepository;
let sut: UpdateCategoryService;

describe('UpdateCategoryService', () => {
  beforeEach(() => {
    inMemoryCategoriesRepository = new InMemoryCategoriesRepository();
    failingCategoriesRepository = new FailingCategoriesRepository();
    sut = new UpdateCategoryService(inMemoryCategoriesRepository);
  });

  it('should update a category', async () => {
    const category = makeCategory({
      name: 'Birthday Cakes',
      slug: 'birthday-cakes',
      description: 'Old description',
      imageUrl: 'https://example.com/old-image.png',
      isActive: true,
    });

    await inMemoryCategoriesRepository.create(category);

    const result = await sut.execute({
      categoryId: category.id.toString(),
      name: 'Wedding Cakes',
      slug: 'wedding-cakes',
      description: null,
      imageUrl: 'https://example.com/new-image.png',
      isActive: false,
    });

    expect(result.isSuccess()).toBe(true);

    if (result.isSuccess()) {
      expect(result.value.category.name).toBe('Wedding Cakes');
      expect(result.value.category.slug).toBe('wedding-cakes');
      expect(result.value.category.description).toBeNull();
      expect(result.value.category.imageUrl).toBe(
        'https://example.com/new-image.png'
      );
      expect(result.value.category.isActive).toBe(false);
      expect(result.value.category.updatedAt).toBeInstanceOf(Date);
    }
  });

  it('should not update a category when it does not exist', async () => {
    const result = await sut.execute({
      categoryId: 'non-existing-category-id',
      name: 'Wedding Cakes',
    });

    expect(result.isError()).toBe(true);

    if (result.isError()) {
      expect(result.value).toBeInstanceOf(CategoryNotFoundError);
    }
  });

  it('should not update a category with a slug that is already in use', async () => {
    const category = makeCategory({
      slug: 'birthday-cakes',
    });

    const anotherCategory = makeCategory({
      slug: 'wedding-cakes',
    });

    await inMemoryCategoriesRepository.create(category);
    await inMemoryCategoriesRepository.create(anotherCategory);

    const result = await sut.execute({
      categoryId: category.id.toString(),
      slug: anotherCategory.slug,
    });

    expect(result.isError()).toBe(true);

    if (result.isError()) {
      expect(result.value).toBeInstanceOf(CategorySlugAlreadyExistsError);
    }
  });

  it('should return an unexpected error when something goes wrong', async () => {
    sut = new UpdateCategoryService(failingCategoriesRepository);

    const result = await sut.execute({
      categoryId: 'category-1',
      name: 'Wedding Cakes',
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
