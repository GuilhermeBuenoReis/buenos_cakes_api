import { beforeEach, describe, expect, it } from 'vitest';
import { makeProductFilling } from '../../../../../test/factories/make-product-filling';
import { FailingProductFillingsRepository } from '../../../../../test/repositories/failures/failing-product-fillings-repository';
import { InMemoryProductFillingsRepository } from '../../../../../test/repositories/in-memory-product-fillings-repository';
import { UnexpectedError } from '../../../../core/errors/unexpected-error';
import { ProductFillingNotFoundError } from '../errors/product-filling-not-found-error';
import { FetchProductFillingByIdService } from './fetch-product-filling-by-id-service';

let inMemoryProductFillingsRepository: InMemoryProductFillingsRepository;
let failingProductFillingsRepository: FailingProductFillingsRepository;
let sut: FetchProductFillingByIdService;

describe('FetchProductFillingByIdService', () => {
  beforeEach(() => {
    inMemoryProductFillingsRepository = new InMemoryProductFillingsRepository();
    failingProductFillingsRepository = new FailingProductFillingsRepository();
    sut = new FetchProductFillingByIdService(
      inMemoryProductFillingsRepository
    );
  });

  it('should get a product filling by id', async () => {
    const productFilling = makeProductFilling({
      label: 'Chocolate',
    });

    await inMemoryProductFillingsRepository.create(productFilling);

    const result = await sut.execute({
      productFillingId: productFilling.id.toString(),
    });

    expect(result.isSuccess()).toBe(true);

    if (result.isSuccess()) {
      expect(result.value.productFilling.id).toEqual(productFilling.id);
      expect(result.value.productFilling.label).toBe('Chocolate');
    }
  });

  it('should return an error when product filling does not exist', async () => {
    const nonExistingProductFillingId = 'non-existing-product-filling-id';

    const result = await sut.execute({
      productFillingId: nonExistingProductFillingId,
    });

    expect(result.isError()).toBe(true);

    if (result.isError()) {
      expect(result.value).toBeInstanceOf(ProductFillingNotFoundError);
      expect(result.value.message).toBe(
        `Product filling with id "${nonExistingProductFillingId}" does not exist.`
      );
    }
  });

  it('should return an unexpected error when something goes wrong', async () => {
    sut = new FetchProductFillingByIdService(failingProductFillingsRepository);

    const result = await sut.execute({
      productFillingId: 'any-product-filling-id',
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
