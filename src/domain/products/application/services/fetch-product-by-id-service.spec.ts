import { beforeEach, describe, expect, it } from 'vitest';
import { makeProduct } from '../../../../../test/factories/make-product';
import { FailingProductsRepository } from '../../../../../test/repositories/failures/failing-products-repository';
import { InMemoryProductsRepository } from '../../../../../test/repositories/in-memory-products-repository';
import { UnexpectedError } from '../../../../core/errors/unexpected-error';
import { ProductNotFoundError } from '../errors/product-not-found-error';
import { FetchProductByIdService } from './fetch-product-by-id-service';

let inMemoryProductsRepository: InMemoryProductsRepository;
let failingProductsRepository: FailingProductsRepository;
let sut: FetchProductByIdService;

describe('FetchProductByIdService', () => {
  beforeEach(() => {
    inMemoryProductsRepository = new InMemoryProductsRepository();
    failingProductsRepository = new FailingProductsRepository();
    sut = new FetchProductByIdService(inMemoryProductsRepository);
  });

  it('should get a product by id', async () => {
    const product = makeProduct({
      name: 'Chocolate Cake',
      slug: 'chocolate-cake',
    });

    await inMemoryProductsRepository.create(product);

    const productId = product.id.toString();

    const result = await sut.execute({
      productId,
    });

    expect(result.isSuccess()).toBe(true);

    if (result.isSuccess()) {
      expect(result.value.product.id).toEqual(product.id);
      expect(result.value.product.name).toBe('Chocolate Cake');
      expect(result.value.product.slug).toBe('chocolate-cake');
    }
  });

  it('should return an error when product does not exist', async () => {
    const nonExistingProductId = 'non-existing-product-id';

    const result = await sut.execute({
      productId: nonExistingProductId,
    });

    expect(result.isError()).toBe(true);

    if (result.isError()) {
      expect(result.value).toBeInstanceOf(ProductNotFoundError);
      expect(result.value.message).toBe(
        `Product with id "${nonExistingProductId}" does not exist.`
      );
    }
  });

  it('should return an unexpected error when something goes wrong', async () => {
    sut = new FetchProductByIdService(failingProductsRepository);

    const result = await sut.execute({
      productId: 'any-product-id',
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
