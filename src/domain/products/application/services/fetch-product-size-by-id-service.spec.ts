import { beforeEach, describe, expect, it } from 'vitest';
import { makeProductSize } from '../../../../../test/factories/make-product-size';
import { FailingProductSizesRepository } from '../../../../../test/repositories/failures/failing-product-sizes-repository';
import { InMemoryProductSizesRepository } from '../../../../../test/repositories/in-memory-product-sizes-repository';
import { UnexpectedError } from '../../../../core/errors/unexpected-error';
import { ProductSizeNotFoundError } from '../errors/product-size-not-found-error';
import { FetchProductSizeByIdService } from './fetch-product-size-by-id-service';

let inMemoryProductSizesRepository: InMemoryProductSizesRepository;
let failingProductSizesRepository: FailingProductSizesRepository;
let sut: FetchProductSizeByIdService;

describe('FetchProductSizeByIdService', () => {
  beforeEach(() => {
    inMemoryProductSizesRepository = new InMemoryProductSizesRepository();
    failingProductSizesRepository = new FailingProductSizesRepository();
    sut = new FetchProductSizeByIdService(inMemoryProductSizesRepository);
  });

  it('should get a product size by id', async () => {
    const productSize = makeProductSize({
      code: 'KG1',
      label: '1kg',
    });

    await inMemoryProductSizesRepository.create(productSize);

    const result = await sut.execute({
      productSizeId: productSize.id.toString(),
    });

    expect(result.isSuccess()).toBe(true);

    if (result.isSuccess()) {
      expect(result.value.productSize.id).toEqual(productSize.id);
      expect(result.value.productSize.code).toBe('KG1');
      expect(result.value.productSize.label).toBe('1kg');
    }
  });

  it('should return an error when product size does not exist', async () => {
    const nonExistingProductSizeId = 'non-existing-product-size-id';

    const result = await sut.execute({
      productSizeId: nonExistingProductSizeId,
    });

    expect(result.isError()).toBe(true);

    if (result.isError()) {
      expect(result.value).toBeInstanceOf(ProductSizeNotFoundError);
      expect(result.value.message).toBe(
        `Product size with id "${nonExistingProductSizeId}" does not exist.`
      );
    }
  });

  it('should return an unexpected error when something goes wrong', async () => {
    sut = new FetchProductSizeByIdService(failingProductSizesRepository);

    const result = await sut.execute({
      productSizeId: 'any-product-size-id',
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
