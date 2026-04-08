import { beforeEach, describe, expect, it } from 'vitest';
import { makeCategory } from '../../../../../test/factories/make-category';
import { FailingCategoriesRepository } from '../../../../../test/repositories/failures/failing-categories-repository';
import { InMemoryCategoriesRepository } from '../../../../../test/repositories/in-memory-categories-repository';
import { UnexpectedError } from '../../../../core/errors/unexpected-error';
import { ListCategoriesService } from './list-categories-service';

let inMemoryCategoriesRepository: InMemoryCategoriesRepository;
let failingCategoriesRepository: FailingCategoriesRepository;
let sut: ListCategoriesService;

describe('ListCategoriesService', () => {
  beforeEach(() => {
    inMemoryCategoriesRepository = new InMemoryCategoriesRepository();
    failingCategoriesRepository = new FailingCategoriesRepository();
    sut = new ListCategoriesService(inMemoryCategoriesRepository);
  });

  it('should list all categories from the requested page', async () => {
    const firstCategory = makeCategory({ name: 'Birthday Cakes' });
    const secondCategory = makeCategory({ name: 'Wedding Cakes' });

    await inMemoryCategoriesRepository.create(firstCategory);
    await inMemoryCategoriesRepository.create(secondCategory);

    const result = await sut.execute({
      page: 1,
    });

    expect(result.isSuccess()).toBe(true);

    if (result.isSuccess()) {
      expect(result.value.categories).toHaveLength(2);
      expect(
        result.value.categories.map((category) => category.id.toString())
      ).toEqual([firstCategory.id.toString(), secondCategory.id.toString()]);
    }
  });

  it('should paginate categories', async () => {
    for (let index = 1; index <= 22; index++) {
      await inMemoryCategoriesRepository.create(
        makeCategory({
          name: `Category ${index}`,
          slug: `category-${index}`,
        })
      );
    }

    const result = await sut.execute({
      page: 2,
    });

    expect(result.isSuccess()).toBe(true);

    if (result.isSuccess()) {
      expect(result.value.categories).toHaveLength(2);
      expect(result.value.categories[0].name).toBe('Category 21');
      expect(result.value.categories[1].name).toBe('Category 22');
    }
  });

  it('should return an unexpected error when something goes wrong', async () => {
    sut = new ListCategoriesService(failingCategoriesRepository);

    const result = await sut.execute({
      page: 1,
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
