import { beforeEach, describe, expect, it } from 'vitest';
import { makeProduct } from '../../../../../test/factories/make-product';
import { makeProductSize } from '../../../../../test/factories/make-product-size';
import { FailingProductSizesRepository } from '../../../../../test/repositories/failures/failing-product-sizes-repository';
import { InMemoryProductSizesRepository } from '../../../../../test/repositories/in-memory-product-sizes-repository';
import { InMemoryProductsRepository } from '../../../../../test/repositories/in-memory-products-repository';
import { UnexpectedError } from '../../../../core/errors/unexpected-error';
import { ProductSizeCodeAlreadyExistsError } from '../errors/product-size-code-already-exists-error';
import { ProductSizeNotFoundError } from '../errors/product-size-not-found-error';
import { UpdateProductSizeService } from './update-product-size-service';

let inMemoryProductsRepository: InMemoryProductsRepository;
let inMemoryProductSizesRepository: InMemoryProductSizesRepository;
let failingProductSizesRepository: FailingProductSizesRepository;
let sut: UpdateProductSizeService;

describe('UpdateProductSizeService', () => {
  beforeEach(() => {
    inMemoryProductsRepository = new InMemoryProductsRepository();
    inMemoryProductSizesRepository = new InMemoryProductSizesRepository();
    failingProductSizesRepository = new FailingProductSizesRepository();
    sut = new UpdateProductSizeService(inMemoryProductSizesRepository);
  });

  it('should update a product size', async () => {
    const product = makeProduct();

    await inMemoryProductsRepository.create(product);

    const productSize = makeProductSize({
      productId: product.id,
      code: 'KG1',
      label: '1kg',
      servingsLabel: '10 fatias',
      priceDelta: 20,
      isDefault: true,
      sortOrder: 1,
      isActive: true,
    });

    await inMemoryProductSizesRepository.create(productSize);

    const result = await sut.execute({
      productSizeId: productSize.id.toString(),
      code: 'KG2',
      label: '2kg',
      servingsLabel: null,
      priceDelta: 35,
      sortOrder: 2,
      isActive: false,
    });

    expect(result.isSuccess()).toBe(true);

    if (result.isSuccess()) {
      expect(result.value.productSize.code).toBe('KG2');
      expect(result.value.productSize.label).toBe('2kg');
      expect(result.value.productSize.servingsLabel).toBeNull();
      expect(result.value.productSize.priceDelta).toBe(35);
      expect(result.value.productSize.sortOrder).toBe(2);
      expect(result.value.productSize.isActive).toBe(false);
      expect(result.value.productSize.updatedAt).toBeInstanceOf(Date);
    }
  });

  it('should not update a product size when it does not exist', async () => {
    const result = await sut.execute({
      productSizeId: 'non-existing-product-size-id',
      label: '2kg',
    });

    expect(result.isError()).toBe(true);

    if (result.isError()) {
      expect(result.value).toBeInstanceOf(ProductSizeNotFoundError);
    }
  });

  it('should not update a product size with a code that is already in use for the same product', async () => {
    const product = makeProduct();

    await inMemoryProductsRepository.create(product);

    const productSize = makeProductSize({
      productId: product.id,
      code: 'KG1',
    });

    const anotherProductSize = makeProductSize({
      productId: product.id,
      code: 'KG2',
    });

    await inMemoryProductSizesRepository.create(productSize);
    await inMemoryProductSizesRepository.create(anotherProductSize);

    const result = await sut.execute({
      productSizeId: productSize.id.toString(),
      code: anotherProductSize.code,
    });

    expect(result.isError()).toBe(true);

    if (result.isError()) {
      expect(result.value).toBeInstanceOf(ProductSizeCodeAlreadyExistsError);
    }
  });

  it('should unset the previous default size when updating another size as default', async () => {
    const product = makeProduct();

    await inMemoryProductsRepository.create(product);

    const currentDefaultSize = makeProductSize({
      productId: product.id,
      code: 'KG1',
      isDefault: true,
    });

    const anotherProductSize = makeProductSize({
      productId: product.id,
      code: 'KG2',
      isDefault: false,
    });

    await inMemoryProductSizesRepository.create(currentDefaultSize);
    await inMemoryProductSizesRepository.create(anotherProductSize);

    const result = await sut.execute({
      productSizeId: anotherProductSize.id.toString(),
      isDefault: true,
    });

    expect(result.isSuccess()).toBe(true);

    const updatedCurrentDefaultSize = await inMemoryProductSizesRepository.findById(
      currentDefaultSize.id.toString()
    );

    expect(updatedCurrentDefaultSize?.isDefault).toBe(false);

    if (result.isSuccess()) {
      expect(result.value.productSize.isDefault).toBe(true);
    }
  });

  it('should keep a size as default when trying to unset the only default size', async () => {
    const product = makeProduct();

    await inMemoryProductsRepository.create(product);

    const productSize = makeProductSize({
      productId: product.id,
      code: 'KG1',
      isDefault: true,
    });

    await inMemoryProductSizesRepository.create(productSize);

    const result = await sut.execute({
      productSizeId: productSize.id.toString(),
      isDefault: false,
    });

    expect(result.isSuccess()).toBe(true);

    if (result.isSuccess()) {
      expect(result.value.productSize.isDefault).toBe(true);
    }
  });

  it('should return an unexpected error when something goes wrong', async () => {
    sut = new UpdateProductSizeService(failingProductSizesRepository);

    const result = await sut.execute({
      productSizeId: 'product-size-1',
      label: '2kg',
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
