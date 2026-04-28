import { beforeEach, describe, expect, it } from 'vitest';
import { makeProduct } from '../../../../../test/factories/make-product';
import { FailingProductsRepository } from '../../../../../test/repositories/failures/failing-products-repository';
import { InMemoryProductsRepository } from '../../../../../test/repositories/in-memory-products-repository';
import { UnexpectedError } from '../../../../core/errors/unexpected-error';
import { Slug } from '../../enterprise/entities/value-objects/slug';
import { ProductWithSlugNotFoundError } from '../errors/product-with-slug-not-found-error';
import { FetchProductBySlugService } from './fetch-product-by-slug-service';

let inMemoryProductsRepository: InMemoryProductsRepository;
let failingProductsRepository: FailingProductsRepository;
let sut: FetchProductBySlugService;

describe('FetchProductBySlugService', () => {
  beforeEach(() => {
    inMemoryProductsRepository = new InMemoryProductsRepository();
    failingProductsRepository = new FailingProductsRepository();
    sut = new FetchProductBySlugService(inMemoryProductsRepository);
  });

  it('should be able to get a product by slug', async () => {
    const product = makeProduct({
      slug: Slug.create('chocolate-cake').value,
    });

    await inMemoryProductsRepository.create(product);

    const result = await sut.execute({
      slug: 'chocolate-cake',
    });

    expect(result.isSuccess()).toBe(true);

    if (result.isSuccess()) {
      expect(result.value.product.id).toBeTruthy();
      expect(result.value.product.name).toEqual(product.name);
      expect(result.value.product.slug).toEqual('chocolate-cake');
    }
  });

  it('should return an error when product does not exist', async () => {
    const result = await sut.execute({
      slug: 'non-existing-product-slug',
    });

    expect(result.isError()).toBe(true);

    if (result.isError()) {
      expect(result.value).toBeInstanceOf(ProductWithSlugNotFoundError);
      expect(result.value.message).toBe(
        'Product with slug "non-existing-product-slug" does not exist.'
      );
    }
  });

  it('should return an unexpected error when something goes wrong', async () => {
    sut = new FetchProductBySlugService(failingProductsRepository);

    const result = await sut.execute({
      slug: 'chocolate-cake',
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
