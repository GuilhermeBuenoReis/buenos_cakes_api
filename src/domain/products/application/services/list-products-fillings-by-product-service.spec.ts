import { beforeEach, describe, expect, it } from 'vitest';
import { makeProductFilling } from '../../../../../test/factories/make-product-filling';
import { FailingProductFillingsRepository } from '../../../../../test/repositories/failures/failing-product-fillings-repository';
import { InMemoryProductFillingsRepository } from '../../../../../test/repositories/in-memory-product-fillings-repository';
import { UniqueEntityID } from '../../../../core/entities/unique-entity-id';
import { UnexpectedError } from '../../../../core/errors/unexpected-error';
import { ListProductsFillingsByProductService } from './list-products-fillings-by-product-service';

let inMemoryProductFillingsRepository: InMemoryProductFillingsRepository;
let failingProductFillingsRepository: FailingProductFillingsRepository;
let sut: ListProductsFillingsByProductService;

describe('ListProductsFillingsByProductService', () => {
  beforeEach(() => {
    inMemoryProductFillingsRepository = new InMemoryProductFillingsRepository();
    failingProductFillingsRepository = new FailingProductFillingsRepository();
    sut = new ListProductsFillingsByProductService(
      inMemoryProductFillingsRepository
    );
  });

  it('should list only product fillings from the requested product', async () => {
    const productId = new UniqueEntityID('product-1');

    const firstProductFilling = makeProductFilling({
      productId,
      label: 'Chocolate',
    });
    const secondProductFilling = makeProductFilling({
      productId,
      label: 'Morango',
    });
    const otherProductFilling = makeProductFilling({
      productId: new UniqueEntityID('product-2'),
      label: 'Ninho',
    });

    await inMemoryProductFillingsRepository.create(firstProductFilling);
    await inMemoryProductFillingsRepository.create(secondProductFilling);
    await inMemoryProductFillingsRepository.create(otherProductFilling);

    const result = await sut.execute({
      productId: productId.toString(),
    });

    expect(result.isSuccess()).toBe(true);

    if (result.isSuccess()) {
      expect(result.value.productFillings).toHaveLength(2);
      expect(
        result.value.productFillings.map((productFilling) =>
          productFilling.id.toString()
        )
      ).toEqual([
        firstProductFilling.id.toString(),
        secondProductFilling.id.toString(),
      ]);
    }
  });

  it('should return an unexpected error when something goes wrong', async () => {
    sut = new ListProductsFillingsByProductService(
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
