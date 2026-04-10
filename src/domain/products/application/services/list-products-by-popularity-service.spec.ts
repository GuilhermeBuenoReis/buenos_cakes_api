import { beforeEach, describe, expect, it } from 'vitest';
import { makeProduct } from '../../../../../test/factories/make-product';
import { FailingProductsRepository } from '../../../../../test/repositories/failures/failing-products-repository';
import { InMemoryProductsRepository } from '../../../../../test/repositories/in-memory-products-repository';
import { UnexpectedError } from '../../../../core/errors/unexpected-error';
import { ListProductsByPopularityService } from './list-products-by-popularity-service';

let inMemoryProductsRepository: InMemoryProductsRepository;
let failingProductsRepository: FailingProductsRepository;
let sut: ListProductsByPopularityService;

describe('ListProductsByPopularityService', () => {
  beforeEach(() => {
    inMemoryProductsRepository = new InMemoryProductsRepository();
    failingProductsRepository = new FailingProductsRepository();
    sut = new ListProductsByPopularityService(inMemoryProductsRepository);
  });

  it('should list products ordered by popularity', async () => {
    const leastPopularProduct = makeProduct({
      name: 'Least Popular Cake',
      slug: 'least-popular-cake',
      popularityScore: 10,
    });
    const mostPopularProduct = makeProduct({
      name: 'Most Popular Cake',
      slug: 'most-popular-cake',
      popularityScore: 100,
    });
    const mediumPopularityProduct = makeProduct({
      name: 'Medium Popular Cake',
      slug: 'medium-popular-cake',
      popularityScore: 50,
    });

    await inMemoryProductsRepository.create(leastPopularProduct);
    await inMemoryProductsRepository.create(mostPopularProduct);
    await inMemoryProductsRepository.create(mediumPopularityProduct);

    const result = await sut.execute({
      page: 1,
    });

    expect(result.isSuccess()).toBe(true);

    if (result.isSuccess()) {
      expect(result.value.products).toHaveLength(3);
      expect(result.value.products.map((product) => product.name)).toEqual([
        'Most Popular Cake',
        'Medium Popular Cake',
        'Least Popular Cake',
      ]);
    }
  });

  it('should paginate products ordered by popularity', async () => {
    for (let index = 1; index <= 22; index++) {
      await inMemoryProductsRepository.create(
        makeProduct({
          name: `Product ${index}`,
          slug: `product-${index}`,
          popularityScore: index,
        })
      );
    }

    const result = await sut.execute({
      page: 2,
    });

    expect(result.isSuccess()).toBe(true);

    if (result.isSuccess()) {
      expect(result.value.products).toHaveLength(2);
      expect(result.value.products[0].name).toBe('Product 2');
      expect(result.value.products[1].name).toBe('Product 1');
    }
  });

  it('should return an unexpected error when something goes wrong', async () => {
    sut = new ListProductsByPopularityService(failingProductsRepository);

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
