import { beforeEach, describe, expect, it } from 'vitest';
import { makeProductFilling } from '../../../../../test/factories/make-product-filling';
import { FailingProductFillingsRepository } from '../../../../../test/repositories/failures/failing-product-fillings-repository';
import { InMemoryProductFillingsRepository } from '../../../../../test/repositories/in-memory-product-fillings-repository';
import { UnexpectedError } from '../../../../core/errors/unexpected-error';
import { ProductFillingNotFoundError } from '../errors/product-filling-not-found-error';
import { DeleteProductsFillingService } from './delete-products-filling-service';

let inMemoryProductFillingsRepository: InMemoryProductFillingsRepository;
let failingProductFillingsRepository: FailingProductFillingsRepository;
let sut: DeleteProductsFillingService;

describe('DeleteProductsFillingService', () => {
  beforeEach(() => {
    inMemoryProductFillingsRepository = new InMemoryProductFillingsRepository();
    failingProductFillingsRepository = new FailingProductFillingsRepository();
    sut = new DeleteProductsFillingService(inMemoryProductFillingsRepository);
  });

  it('should delete a product filling', async () => {
    const productFilling = makeProductFilling();

    await inMemoryProductFillingsRepository.create(productFilling);

    const result = await sut.execute({
      productFillingId: productFilling.id.toString(),
    });

    expect(result.isSuccess()).toBe(true);
    expect(inMemoryProductFillingsRepository.items).toHaveLength(0);

    if (result.isSuccess()) {
      expect(result.value.message).toBe(
        'Product filling deleted successfully.'
      );
    }
  });

  it('should not delete a product filling when id does not exist', async () => {
    const result = await sut.execute({
      productFillingId: 'non-existing-product-filling-id',
    });

    expect(result.isError()).toBe(true);

    if (result.isError()) {
      expect(result.value).toBeInstanceOf(ProductFillingNotFoundError);
    }
  });

  it('should return an unexpected error when something goes wrong', async () => {
    sut = new DeleteProductsFillingService(failingProductFillingsRepository);

    const result = await sut.execute({
      productFillingId: 'product-filling-1',
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
