import { beforeEach, describe, expect, it } from 'vitest';
import { makeCategory } from '../../../../../test/factories/make-category';
import { FailingCategoriesRepository } from '../../../../../test/repositories/failures/failing-categories-repository';
import { InMemoryCategoriesRepository } from '../../../../../test/repositories/in-memory-categories-repository';
import { UnexpectedError } from '../../../../core/errors/unexpected-error';
import { ListActiveCategoriesService } from './list-active-categories-service';

let inMemoryCategoriesRepository: InMemoryCategoriesRepository;
let failingCategoriesRepository: FailingCategoriesRepository;
let sut: ListActiveCategoriesService;

describe('ListActiveCategoriesService', () => {
  beforeEach(() => {
    inMemoryCategoriesRepository = new InMemoryCategoriesRepository();
    failingCategoriesRepository = new FailingCategoriesRepository();
    sut = new ListActiveCategoriesService(inMemoryCategoriesRepository);
  });

  it('should list only active categories from the requested page', async () => {
    const activeCategory = makeCategory({
      name: 'Birthday Cakes',
      isActive: true,
    });
    const inactiveCategory = makeCategory({
      name: 'Inactive Category',
      isActive: false,
    });

    await inMemoryCategoriesRepository.create(activeCategory);
    await inMemoryCategoriesRepository.create(inactiveCategory);

    const result = await sut.execute({
      page: 1,
    });

    expect(result.isSuccess()).toBe(true);

    if (result.isSuccess()) {
      expect(result.value.categories).toHaveLength(1);
      expect(result.value.categories[0].id.toString()).toBe(
        activeCategory.id.toString()
      );
    }
  });

  it('should paginate active categories', async () => {
    for (let index = 1; index <= 22; index++) {
      await inMemoryCategoriesRepository.create(
        makeCategory({
          name: `Active Category ${index}`,
          slug: `active-category-${index}`,
          isActive: true,
        })
      );
    }

    await inMemoryCategoriesRepository.create(
      makeCategory({
        name: 'Inactive Category',
        slug: 'inactive-category',
        isActive: false,
      })
    );

    const result = await sut.execute({
      page: 2,
    });

    expect(result.isSuccess()).toBe(true);

    if (result.isSuccess()) {
      expect(result.value.categories).toHaveLength(2);
      expect(result.value.categories[0].name).toBe('Active Category 21');
      expect(result.value.categories[1].name).toBe('Active Category 22');
    }
  });

  it('should return an unexpected error when something goes wrong', async () => {
    sut = new ListActiveCategoriesService(failingCategoriesRepository);

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
