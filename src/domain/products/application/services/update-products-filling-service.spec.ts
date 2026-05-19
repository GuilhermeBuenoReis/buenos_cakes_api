import { beforeEach, describe, expect, it } from 'vitest';
import { makeProduct } from '../../../../../test/factories/make-product';
import { makeProductFilling } from '../../../../../test/factories/make-product-filling';
import { FailingProductFillingsRepository } from '../../../../../test/repositories/failures/failing-product-fillings-repository';
import { InMemoryProductFillingsRepository } from '../../../../../test/repositories/in-memory-product-fillings-repository';
import { InMemoryProductsRepository } from '../../../../../test/repositories/in-memory-products-repository';
import { UnexpectedError } from '../../../../core/errors/unexpected-error';
import { ProductFillingLabelAlreadyExistsError } from '../errors/product-filling-label-already-exists-error';
import { ProductFillingNotFoundError } from '../errors/product-filling-not-found-error';
import { UpdateProductsFillingService } from './update-products-filling-service';

let inMemoryProductsRepository: InMemoryProductsRepository;
let inMemoryProductFillingsRepository: InMemoryProductFillingsRepository;
let failingProductFillingsRepository: FailingProductFillingsRepository;
let sut: UpdateProductsFillingService;

describe('UpdateProductsFillingService', () => {
  beforeEach(() => {
    inMemoryProductsRepository = new InMemoryProductsRepository();
    inMemoryProductFillingsRepository = new InMemoryProductFillingsRepository();
    failingProductFillingsRepository = new FailingProductFillingsRepository();
    sut = new UpdateProductsFillingService(inMemoryProductFillingsRepository);
  });

  it('should update a product filling', async () => {
    const product = makeProduct();

    await inMemoryProductsRepository.create(product);

    const productFilling = makeProductFilling({
      productId: product.id,
      label: 'Chocolate',
      priceDelta: 20,
      isDefault: true,
      sortOrder: 1,
      isActive: true,
    });

    await inMemoryProductFillingsRepository.create(productFilling);

    const result = await sut.execute({
      productFillingId: productFilling.id.toString(),
      label: 'Morango',
      priceDelta: 35,
      sortOrder: 2,
      isActive: false,
    });

    expect(result.isSuccess()).toBe(true);

    if (result.isSuccess()) {
      expect(result.value.productFilling.label).toBe('Morango');
      expect(result.value.productFilling.priceDelta).toBe(35);
      expect(result.value.productFilling.sortOrder).toBe(2);
      expect(result.value.productFilling.isActive).toBe(false);
      expect(result.value.productFilling.updatedAt).toBeInstanceOf(Date);
    }
  });

  it('should not update a product filling when it does not exist', async () => {
    const result = await sut.execute({
      productFillingId: 'non-existing-product-filling-id',
      label: 'Morango',
    });

    expect(result.isError()).toBe(true);

    if (result.isError()) {
      expect(result.value).toBeInstanceOf(ProductFillingNotFoundError);
    }
  });

  it('should not update a product filling with a label that is already in use for the same product', async () => {
    const product = makeProduct();

    await inMemoryProductsRepository.create(product);

    const productFilling = makeProductFilling({
      productId: product.id,
      label: 'Chocolate',
    });

    const anotherProductFilling = makeProductFilling({
      productId: product.id,
      label: 'Morango',
    });

    await inMemoryProductFillingsRepository.create(productFilling);
    await inMemoryProductFillingsRepository.create(anotherProductFilling);

    const result = await sut.execute({
      productFillingId: productFilling.id.toString(),
      label: anotherProductFilling.label,
    });

    expect(result.isError()).toBe(true);

    if (result.isError()) {
      expect(result.value).toBeInstanceOf(
        ProductFillingLabelAlreadyExistsError
      );
    }
  });

  it('should unset the previous default filling when updating another filling as default', async () => {
    const product = makeProduct();

    await inMemoryProductsRepository.create(product);

    const currentDefaultFilling = makeProductFilling({
      productId: product.id,
      label: 'Chocolate',
      isDefault: true,
    });

    const anotherProductFilling = makeProductFilling({
      productId: product.id,
      label: 'Morango',
      isDefault: false,
    });

    await inMemoryProductFillingsRepository.create(currentDefaultFilling);
    await inMemoryProductFillingsRepository.create(anotherProductFilling);

    const result = await sut.execute({
      productFillingId: anotherProductFilling.id.toString(),
      isDefault: true,
    });

    expect(result.isSuccess()).toBe(true);

    const updatedCurrentDefaultFilling =
      await inMemoryProductFillingsRepository.findById(
        currentDefaultFilling.id.toString()
      );

    expect(updatedCurrentDefaultFilling?.isDefault).toBe(false);

    if (result.isSuccess()) {
      expect(result.value.productFilling.isDefault).toBe(true);
    }
  });

  it('should keep a filling as default when trying to unset the only default filling', async () => {
    const product = makeProduct();

    await inMemoryProductsRepository.create(product);

    const productFilling = makeProductFilling({
      productId: product.id,
      label: 'Chocolate',
      isDefault: true,
    });

    await inMemoryProductFillingsRepository.create(productFilling);

    const result = await sut.execute({
      productFillingId: productFilling.id.toString(),
      isDefault: false,
    });

    expect(result.isSuccess()).toBe(true);

    if (result.isSuccess()) {
      expect(result.value.productFilling.isDefault).toBe(true);
    }
  });

  it('should return an unexpected error when something goes wrong', async () => {
    sut = new UpdateProductsFillingService(failingProductFillingsRepository);

    const result = await sut.execute({
      productFillingId: 'product-filling-1',
      label: 'Morango',
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
