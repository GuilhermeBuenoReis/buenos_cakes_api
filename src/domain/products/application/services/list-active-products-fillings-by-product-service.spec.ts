import { beforeEach, describe, expect, it } from 'vitest';
import { makeProductFilling } from '../../../../../test/factories/make-product-filling';
import { FailingProductFillingsRepository } from '../../../../../test/repositories/failures/failing-product-fillings-repository';
import { InMemoryProductFillingsRepository } from '../../../../../test/repositories/in-memory-product-fillings-repository';
import { UniqueEntityID } from '../../../../core/entities/unique-entity-id';
import { UnexpectedError } from '../../../../core/errors/unexpected-error';
import { ListActiveProductsFillingsByProductService } from './list-active-products-fillings-by-product-service';

let inMemoryProductFillingsRepository: InMemoryProductFillingsRepository;
let failingProductFillingsRepository: FailingProductFillingsRepository;
let sut: ListActiveProductsFillingsByProductService;

describe('ListActiveProductsFillingsByProductService', () => {
  beforeEach(() => {
    inMemoryProductFillingsRepository = new InMemoryProductFillingsRepository();
    failingProductFillingsRepository = new FailingProductFillingsRepository();
    sut = new ListActiveProductsFillingsByProductService(
      inMemoryProductFillingsRepository
    );
  });

  it('should list only active product fillings from the requested product', async () => {
    const productId = new UniqueEntityID('product-1');

    const activeProductFilling = makeProductFilling({
      productId,
      label: 'Chocolate',
      isActive: true,
    });
    const inactiveProductFilling = makeProductFilling({
      productId,
      label: 'Morango',
      isActive: false,
    });
    const otherProductFilling = makeProductFilling({
      productId: new UniqueEntityID('product-2'),
      label: 'Ninho',
      isActive: true,
    });

    await inMemoryProductFillingsRepository.create(activeProductFilling);
    await inMemoryProductFillingsRepository.create(inactiveProductFilling);
    await inMemoryProductFillingsRepository.create(otherProductFilling);

    const result = await sut.execute({
      productId: productId.toString(),
    });

    expect(result.isSuccess()).toBe(true);

    if (result.isSuccess()) {
      expect(result.value.productFillings).toHaveLength(1);
      expect(result.value.productFillings[0].id.toString()).toBe(
        activeProductFilling.id.toString()
      );
    }
  });

  it('should return an unexpected error when something goes wrong', async () => {
    sut = new ListActiveProductsFillingsByProductService(
      failingProductFillingsRepository
    );

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
