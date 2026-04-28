import { beforeEach, describe, expect, it } from 'vitest';
import { makeProductSize } from '../../../../../test/factories/make-product-size';
import { FailingProductSizesRepository } from '../../../../../test/repositories/failures/failing-product-sizes-repository';
import { InMemoryProductSizesRepository } from '../../../../../test/repositories/in-memory-product-sizes-repository';
import { UnexpectedError } from '../../../../core/errors/unexpected-error';
import { ProductSizeNotFoundError } from '../errors/product-size-not-found-error';
import { DeleteProductSizeService } from './delete-product-size-service';

let inMemoryProductSizesRepository: InMemoryProductSizesRepository;
let failingProductSizesRepository: FailingProductSizesRepository;
let sut: DeleteProductSizeService;

describe('DeleteProductSizeService', () => {
  beforeEach(() => {
    inMemoryProductSizesRepository = new InMemoryProductSizesRepository();
    failingProductSizesRepository = new FailingProductSizesRepository();
    sut = new DeleteProductSizeService(inMemoryProductSizesRepository);
  });

  it('should delete a product size', async () => {
    const productSize = makeProductSize();

    await inMemoryProductSizesRepository.create(productSize);

    const result = await sut.execute({
      productSizeId: productSize.id.toString(),
    });

    expect(result.isSuccess()).toBe(true);
    expect(inMemoryProductSizesRepository.items).toHaveLength(0);

    if (result.isSuccess()) {
      expect(result.value.message).toBe('Product size deleted successfully.');
    }
  });

  it('should not delete a product size when id does not exist', async () => {
    const result = await sut.execute({
      productSizeId: 'non-existing-product-size-id',
    });

    expect(result.isError()).toBe(true);

    if (result.isError()) {
      expect(result.value).toBeInstanceOf(ProductSizeNotFoundError);
    }
  });

  it('should return an unexpected error when something goes wrong', async () => {
    sut = new DeleteProductSizeService(failingProductSizesRepository);

    const result = await sut.execute({
      productSizeId: 'product-size-1',
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
