import { beforeEach, describe, expect, it } from 'vitest';
import { makeProduct } from '../../../../../test/factories/make-product';
import { FailingProductsRepository } from '../../../../../test/repositories/failures/failing-products-repository';
import { InMemoryProductsRepository } from '../../../../../test/repositories/in-memory-products-repository';
import { UnexpectedError } from '../../../../core/errors/unexpected-error';
import { ProductNotFoundError } from '../errors/product-not-found-error';
import { DeleteProductService } from './delete-product-service';

let inMemoryProductsRepository: InMemoryProductsRepository;
let failingProductsRepository: FailingProductsRepository;
let sut: DeleteProductService;

describe('DeleteProductService', () => {
  beforeEach(() => {
    inMemoryProductsRepository = new InMemoryProductsRepository();
    failingProductsRepository = new FailingProductsRepository();
    sut = new DeleteProductService(inMemoryProductsRepository);
  });

  it('should delete a product', async () => {
    const product = makeProduct();

    await inMemoryProductsRepository.create(product);

    const result = await sut.execute({
      productId: product.id.toString(),
    });

    expect(result.isSuccess()).toBe(true);
    expect(inMemoryProductsRepository.items).toHaveLength(0);

    if (result.isSuccess()) {
      expect(result.value.message).toBe('Product deleted successfully.');
    }
  });

  it('should not delete a product when id does not exist', async () => {
    const result = await sut.execute({
      productId: 'non-existing-product-id',
    });

    expect(result.isError()).toBe(true);

    if (result.isError()) {
      expect(result.value).toBeInstanceOf(ProductNotFoundError);
    }
  });

  it('should return an unexpected error when something goes wrong', async () => {
    sut = new DeleteProductService(failingProductsRepository);

    const result = await sut.execute({
      productId: 'product-1',
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
