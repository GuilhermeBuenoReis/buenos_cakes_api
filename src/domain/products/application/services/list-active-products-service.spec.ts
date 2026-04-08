import { beforeEach, describe, expect, it } from 'vitest';
import { makeProduct } from '../../../../../test/factories/make-product';
import { FailingProductsRepository } from '../../../../../test/repositories/failures/failing-products-repository';
import { InMemoryProductsRepository } from '../../../../../test/repositories/in-memory-products-repository';
import { UnexpectedError } from '../../../../core/errors/unexpected-error';
import { ListActiveProductsService } from './list-active-products-service';

let inMemoryProductsRepository: InMemoryProductsRepository;
let failingProductsRepository: FailingProductsRepository;
let sut: ListActiveProductsService;

describe('ListActiveProductsService', () => {
  beforeEach(() => {
    inMemoryProductsRepository = new InMemoryProductsRepository();
    failingProductsRepository = new FailingProductsRepository();
    sut = new ListActiveProductsService(inMemoryProductsRepository);
  });

  it('should list only active products from the requested page', async () => {
    const activeProduct = makeProduct({
      name: 'Chocolate Cake',
      isActive: true,
    });
    const inactiveProduct = makeProduct({
      name: 'Inactive Product',
      isActive: false,
    });

    await inMemoryProductsRepository.create(activeProduct);
    await inMemoryProductsRepository.create(inactiveProduct);

    const result = await sut.execute({
      page: 1,
    });

    expect(result.isSuccess()).toBe(true);

    if (result.isSuccess()) {
      expect(result.value.products).toHaveLength(1);
      expect(result.value.products[0].id.toString()).toBe(
        activeProduct.id.toString()
      );
    }
  });

  it('should paginate active products', async () => {
    for (let index = 1; index <= 22; index++) {
      await inMemoryProductsRepository.create(
        makeProduct({
          name: `Active Product ${index}`,
          slug: `active-product-${index}`,
          isActive: true,
        })
      );
    }

    await inMemoryProductsRepository.create(
      makeProduct({
        name: 'Inactive Product',
        slug: 'inactive-product',
        isActive: false,
      })
    );

    const result = await sut.execute({
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
    sut = new ListActiveProductsService(failingProductsRepository);

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
