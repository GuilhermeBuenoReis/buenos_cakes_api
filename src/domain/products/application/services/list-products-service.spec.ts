import { beforeEach, describe, expect, it } from 'vitest';
import { makeProduct } from '../../../../../test/factories/make-product';
import { FailingProductsRepository } from '../../../../../test/repositories/failures/failing-products-repository';
import { InMemoryProductsRepository } from '../../../../../test/repositories/in-memory-products-repository';
import { UnexpectedError } from '../../../../core/errors/unexpected-error';
import { ListProductsService } from './list-products-service';

let inMemoryProductsRepository: InMemoryProductsRepository;
let failingProductsRepository: FailingProductsRepository;
let sut: ListProductsService;

describe('ListProductsService', () => {
  beforeEach(() => {
    inMemoryProductsRepository = new InMemoryProductsRepository();
    failingProductsRepository = new FailingProductsRepository();
    sut = new ListProductsService(inMemoryProductsRepository);
  });

  it('should list all products from the requested page', async () => {
    const firstProduct = makeProduct({ name: 'Chocolate Cake' });
    const secondProduct = makeProduct({ name: 'Vanilla Cake' });

    await inMemoryProductsRepository.create(firstProduct);
    await inMemoryProductsRepository.create(secondProduct);

    const result = await sut.execute({
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

  it('should paginate products', async () => {
    for (let index = 1; index <= 22; index++) {
      await inMemoryProductsRepository.create(
        makeProduct({
          name: `Product ${index}`,
          slug: `product-${index}`,
        })
      );
    }

    const result = await sut.execute({
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
    sut = new ListProductsService(failingProductsRepository);

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
