import { beforeEach, describe, expect, it } from 'vitest';
import { makeProduct } from '../../../../../test/factories/make-product';
import { FailingProductsRepository } from '../../../../../test/repositories/failures/failing-products-repository';
import { InMemoryProductsRepository } from '../../../../../test/repositories/in-memory-products-repository';
import { UniqueEntityID } from '../../../../core/entities/unique-entity-id';
import { UnexpectedError } from '../../../../core/errors/unexpected-error';
import { ListActiveProductsByCategoryService } from './list-active-products-by-category-service';

let inMemoryProductsRepository: InMemoryProductsRepository;
let failingProductsRepository: FailingProductsRepository;
let sut: ListActiveProductsByCategoryService;

describe('ListActiveProductsByCategoryService', () => {
  beforeEach(() => {
    inMemoryProductsRepository = new InMemoryProductsRepository();
    failingProductsRepository = new FailingProductsRepository();
    sut = new ListActiveProductsByCategoryService(inMemoryProductsRepository);
  });

  it('should list only active products from the requested category and page', async () => {
    const categoryId = new UniqueEntityID('category-1');

    const firstActiveProduct = makeProduct({
      categoryId,
      name: 'Chocolate Cake',
      isActive: true,
    });
    const secondActiveProduct = makeProduct({
      categoryId,
      name: 'Vanilla Cake',
      isActive: true,
    });
    const inactiveProduct = makeProduct({
      categoryId,
      name: 'Inactive Product',
      isActive: false,
    });
    const otherCategoryActiveProduct = makeProduct({
      categoryId: new UniqueEntityID('category-2'),
      name: 'Other Category Product',
      isActive: true,
    });

    await inMemoryProductsRepository.create(firstActiveProduct);
    await inMemoryProductsRepository.create(secondActiveProduct);
    await inMemoryProductsRepository.create(inactiveProduct);
    await inMemoryProductsRepository.create(otherCategoryActiveProduct);

    const result = await sut.execute({
      categoryId: categoryId.toString(),
      page: 1,
    });

    expect(result.isSuccess()).toBe(true);

    if (result.isSuccess()) {
      expect(result.value.products).toHaveLength(2);
      expect(
        result.value.products.map((product) => product.id.toString())
      ).toEqual([
        firstActiveProduct.id.toString(),
        secondActiveProduct.id.toString(),
      ]);
    }
  });

  it('should paginate active products from the requested category', async () => {
    const categoryId = new UniqueEntityID('category-1');

    for (let index = 1; index <= 22; index++) {
      await inMemoryProductsRepository.create(
        makeProduct({
          categoryId,
          name: `Active Product ${index}`,
          slug: `active-product-${index}`,
          isActive: true,
        })
      );
    }

    await inMemoryProductsRepository.create(
      makeProduct({
        categoryId,
        name: 'Inactive Product',
        slug: 'inactive-product',
        isActive: false,
      })
    );

    await inMemoryProductsRepository.create(
      makeProduct({
        categoryId: new UniqueEntityID('category-2'),
        name: 'Other Category Product',
        slug: 'other-category-product',
        isActive: true,
      })
    );

    const result = await sut.execute({
      categoryId: categoryId.toString(),
      page: 2,
    });

    expect(result.isSuccess()).toBe(true);

    if (result.isSuccess()) {
      expect(result.value.products).toHaveLength(2);
      expect(result.value.products[0].name).toBe('Active Product 21');
      expect(result.value.products[1].name).toBe('Active Product 22');
    }
  });

  it('should return an unexpected error when something goes wrong', async () => {
    sut = new ListActiveProductsByCategoryService(failingProductsRepository);

    const result = await sut.execute({
      categoryId: 'category-1',
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
