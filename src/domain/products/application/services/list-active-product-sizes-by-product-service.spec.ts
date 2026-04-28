import { beforeEach, describe, expect, it } from 'vitest';
import { makeProductSize } from '../../../../../test/factories/make-product-size';
import { FailingProductSizesRepository } from '../../../../../test/repositories/failures/failing-product-sizes-repository';
import { InMemoryProductSizesRepository } from '../../../../../test/repositories/in-memory-product-sizes-repository';
import { UniqueEntityID } from '../../../../core/entities/unique-entity-id';
import { UnexpectedError } from '../../../../core/errors/unexpected-error';
import { ListActiveProductSizesByProductService } from './list-active-product-sizes-by-product-service';

let inMemoryProductSizesRepository: InMemoryProductSizesRepository;
let failingProductSizesRepository: FailingProductSizesRepository;
let sut: ListActiveProductSizesByProductService;

describe('ListActiveProductSizesByProductService', () => {
  beforeEach(() => {
    inMemoryProductSizesRepository = new InMemoryProductSizesRepository();
    failingProductSizesRepository = new FailingProductSizesRepository();
    sut = new ListActiveProductSizesByProductService(
      inMemoryProductSizesRepository
    );
  });

  it('should list only active product sizes from the requested product', async () => {
    const productId = new UniqueEntityID('product-1');

    const activeProductSize = makeProductSize({
      productId,
      code: 'KG1',
      label: '1kg',
      isActive: true,
    });
    const inactiveProductSize = makeProductSize({
      productId,
      code: 'KG2',
      label: '2kg',
      isActive: false,
    });
    const otherProductSize = makeProductSize({
      productId: new UniqueEntityID('product-2'),
      code: 'KG3',
      label: '3kg',
      isActive: true,
    });

    await inMemoryProductSizesRepository.create(activeProductSize);
    await inMemoryProductSizesRepository.create(inactiveProductSize);
    await inMemoryProductSizesRepository.create(otherProductSize);

    const result = await sut.execute({
      productId: productId.toString(),
    });

    expect(result.isSuccess()).toBe(true);

    if (result.isSuccess()) {
      expect(result.value.productSizes).toHaveLength(1);
      expect(result.value.productSizes[0].id.toString()).toBe(
        activeProductSize.id.toString()
      );
    }
  });

  it('should return an unexpected error when something goes wrong', async () => {
    sut = new ListActiveProductSizesByProductService(
      failingProductSizesRepository
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
