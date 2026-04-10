import { beforeEach, describe, expect, it } from 'vitest';
import { makeProduct } from '../../../../../test/factories/make-product';
import { FailingProductsRepository } from '../../../../../test/repositories/failures/failing-products-repository';
import { InMemoryProductsRepository } from '../../../../../test/repositories/in-memory-products-repository';
import { UniqueEntityID } from '../../../../core/entities/unique-entity-id';
import { UnexpectedError } from '../../../../core/errors/unexpected-error';
import { ListProductsByCategoryService } from './list-products-by-category-service';

let inMemoryProductsRepository: InMemoryProductsRepository;
let failingProductsRepository: FailingProductsRepository;
let sut: ListProductsByCategoryService;

describe('ListProductsByCategoryService', () => {
  beforeEach(() => {
    inMemoryProductsRepository = new InMemoryProductsRepository();
    failingProductsRepository = new FailingProductsRepository();
    sut = new ListProductsByCategoryService(inMemoryProductsRepository);
  });

  it('should list only products from the requested category and page', async () => {
    const categoryId = new UniqueEntityID('category-1');

    const firstProduct = makeProduct({
      categoryId,
      name: 'Chocolate Cake',
    });
    const secondProduct = makeProduct({
      categoryId,
      name: 'Vanilla Cake',
    });
    const otherCategoryProduct = makeProduct({
      categoryId: new UniqueEntityID('category-2'),
      name: 'Other Category Product',
    });

    await inMemoryProductsRepository.create(firstProduct);
    await inMemoryProductsRepository.create(secondProduct);
    await inMemoryProductsRepository.create(otherCategoryProduct);

    const result = await sut.execute({
      categoryId: categoryId.toString(),
      page: 1,
    });

    expect(result.isSuccess()).toBe(true);

    if (result.isSuccess()) {
      expect(result.value.products).toHaveLength(2);
      expect(
        result.value.products.map((product) => product.id.toString())
      ).toEqual([firstProduct.id.toString(), secondProduct.id.toString()]);
    }
  });

  it('should paginate products from the requested category', async () => {
    const categoryId = new UniqueEntityID('category-1');

    for (let index = 1; index <= 22; index++) {
      await inMemoryProductsRepository.create(
        makeProduct({
          categoryId,
          name: `Product ${index}`,
          slug: `product-${index}`,
        })
      );
    }

    await inMemoryProductsRepository.create(
      makeProduct({
        categoryId: new UniqueEntityID('category-2'),
        name: 'Other Category Product',
        slug: 'other-category-product',
      })
    );

    const result = await sut.execute({
      categoryId: categoryId.toString(),
      page: 2,
    });

    expect(result.isSuccess()).toBe(true);

    if (result.isSuccess()) {
      expect(result.value.products).toHaveLength(2);
      expect(result.value.products[0].name).toBe('Product 21');
      expect(result.value.products[1].name).toBe('Product 22');
    }
  });

  it('should return an unexpected error when something goes wrong', async () => {
    sut = new ListProductsByCategoryService(failingProductsRepository);

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
