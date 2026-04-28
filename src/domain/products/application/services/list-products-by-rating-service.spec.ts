import { beforeEach, describe, expect, it } from 'vitest';
import { makeProduct } from '../../../../../test/factories/make-product';
import { FailingProductsRepository } from '../../../../../test/repositories/failures/failing-products-repository';
import { InMemoryProductsRepository } from '../../../../../test/repositories/in-memory-products-repository';
import { UnexpectedError } from '../../../../core/errors/unexpected-error';
import { ListProductsByRatingService } from './list-products-by-rating-service';

let inMemoryProductsRepository: InMemoryProductsRepository;
let failingProductsRepository: FailingProductsRepository;
let sut: ListProductsByRatingService;

describe('ListProductsByRatingService', () => {
  beforeEach(() => {
    inMemoryProductsRepository = new InMemoryProductsRepository();
    failingProductsRepository = new FailingProductsRepository();
    sut = new ListProductsByRatingService(inMemoryProductsRepository);
  });

  it('should list products ordered by rating', async () => {
    const lowestRatedProduct = makeProduct({
      name: 'Low Rated Cake',
      slug: 'low-rated-cake',
      ratingAvg: 2.5,
    });
    const highestRatedProduct = makeProduct({
      name: 'High Rated Cake',
      slug: 'high-rated-cake',
      ratingAvg: 4.9,
    });
    const mediumRatedProduct = makeProduct({
      name: 'Medium Rated Cake',
      slug: 'medium-rated-cake',
      ratingAvg: 3.7,
    });

    await inMemoryProductsRepository.create(lowestRatedProduct);
    await inMemoryProductsRepository.create(highestRatedProduct);
    await inMemoryProductsRepository.create(mediumRatedProduct);

    const result = await sut.execute({
      page: 1,
    });

    expect(result.isSuccess()).toBe(true);

    if (result.isSuccess()) {
      expect(result.value.products).toHaveLength(3);
      expect(result.value.products.map((product) => product.name)).toEqual([
        'High Rated Cake',
        'Medium Rated Cake',
        'Low Rated Cake',
      ]);
    }
  });

  it('should paginate products ordered by rating', async () => {
    for (let index = 1; index <= 22; index++) {
      await inMemoryProductsRepository.create(
        makeProduct({
          name: `Product ${index}`,
          slug: `product-${index}`,
          ratingAvg: index / 10,
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
    sut = new ListProductsByRatingService(failingProductsRepository);

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
