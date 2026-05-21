import { beforeEach, describe, expect, it } from 'vitest';
import { makeProductSize } from '../../../../../test/factories/make-product-size';
import { FailingProductSizesRepository } from '../../../../../test/repositories/failures/failing-product-sizes-repository';
import { InMemoryProductSizesRepository } from '../../../../../test/repositories/in-memory-product-sizes-repository';
import { UniqueEntityID } from '../../../../core/entities/unique-entity-id';
import { UnexpectedError } from '../../../../core/errors/unexpected-error';
import { ListProductSizesByProductService } from './list-product-sizes-by-product-service';

let inMemoryProductSizesRepository: InMemoryProductSizesRepository;
let failingProductSizesRepository: FailingProductSizesRepository;
let sut: ListProductSizesByProductService;

describe('ListProductSizesByProductService', () => {
  beforeEach(() => {
    inMemoryProductSizesRepository = new InMemoryProductSizesRepository();
    failingProductSizesRepository = new FailingProductSizesRepository();
    sut = new ListProductSizesByProductService(inMemoryProductSizesRepository);
  });

  it('should list only product sizes from the requested product', async () => {
    const productId = new UniqueEntityID('product-1');

    const firstProductSize = makeProductSize({
      productId,
      code: 'KG1',
      label: '1kg',
    });
    const secondProductSize = makeProductSize({
      productId,
      code: 'KG2',
      label: '2kg',
    });
    const otherProductSize = makeProductSize({
      productId: new UniqueEntityID('product-2'),
      code: 'KG3',
      label: '3kg',
    });

    await inMemoryProductSizesRepository.create(firstProductSize);
    await inMemoryProductSizesRepository.create(secondProductSize);
    await inMemoryProductSizesRepository.create(otherProductSize);

    const result = await sut.execute({
      productId: productId.toString(),
    });

    expect(result.isSuccess()).toBe(true);

    if (result.isSuccess()) {
      expect(result.value.productSizes).toHaveLength(2);
      expect(
        result.value.productSizes.map((productSize) =>
          productSize.id.toString()
        )
      ).toEqual([
        firstProductSize.id.toString(),
        secondProductSize.id.toString(),
      ]);
    }
  });

  it('should return an unexpected error when something goes wrong', async () => {
    sut = new ListProductSizesByProductService(failingProductSizesRepository);

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
