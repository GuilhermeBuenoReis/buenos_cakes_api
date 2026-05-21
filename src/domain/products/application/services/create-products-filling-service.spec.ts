import { beforeEach, describe, expect, it } from 'vitest';
import { makeProduct } from '../../../../../test/factories/make-product';
import { makeProductFilling } from '../../../../../test/factories/make-product-filling';
import { FailingProductFillingsRepository } from '../../../../../test/repositories/failures/failing-product-fillings-repository';
import { FailingProductsRepository } from '../../../../../test/repositories/failures/failing-products-repository';
import { InMemoryProductFillingsRepository } from '../../../../../test/repositories/in-memory-product-fillings-repository';
import { InMemoryProductsRepository } from '../../../../../test/repositories/in-memory-products-repository';
import { UnexpectedError } from '../../../../core/errors/unexpected-error';
import { ProductFillingLabelAlreadyExistsError } from '../errors/product-filling-label-already-exists-error';
import { ProductNotFoundError } from '../errors/product-not-found-error';
import { CreateProductsFillingService } from './create-products-filling-service';

let inMemoryProductsRepository: InMemoryProductsRepository;
let inMemoryProductFillingsRepository: InMemoryProductFillingsRepository;
let failingProductsRepository: FailingProductsRepository;
let failingProductFillingsRepository: FailingProductFillingsRepository;
let sut: CreateProductsFillingService;

describe('CreateProductsFillingService', () => {
  beforeEach(() => {
    inMemoryProductsRepository = new InMemoryProductsRepository();
    inMemoryProductFillingsRepository = new InMemoryProductFillingsRepository();
    failingProductsRepository = new FailingProductsRepository();
    failingProductFillingsRepository = new FailingProductFillingsRepository();
    sut = new CreateProductsFillingService(
      inMemoryProductsRepository,
      inMemoryProductFillingsRepository
    );
  });

  it('should create a product filling', async () => {
    const product = makeProduct();

    await inMemoryProductsRepository.create(product);

    const result = await sut.execute({
      productId: product.id.toString(),
      label: 'Chocolate',
      priceDelta: 20,
      sortOrder: 1,
    });

    expect(result.isSuccess()).toBe(true);
    expect(inMemoryProductFillingsRepository.items).toHaveLength(1);

    if (result.isSuccess()) {
      expect(result.value.productFilling.productId.toString()).toBe(
        product.id.toString()
      );
      expect(result.value.productFilling.label).toBe('Chocolate');
      expect(result.value.productFilling.priceDelta).toBe(20);
      expect(result.value.productFilling.isDefault).toBe(true);
      expect(result.value.productFilling.sortOrder).toBe(1);
      expect(result.value.productFilling.isActive).toBe(true);
    }
  });

  it('should not create a product filling when product does not exist', async () => {
    const result = await sut.execute({
      productId: 'non-existing-product-id',
      label: 'Chocolate',
      priceDelta: 20,
    });

    expect(result.isError()).toBe(true);

    if (result.isError()) {
      expect(result.value).toBeInstanceOf(ProductNotFoundError);
    }
  });

  it('should not create a product filling with the same label for the same product', async () => {
    const product = makeProduct();

    await inMemoryProductsRepository.create(product);
    await inMemoryProductFillingsRepository.create(
      makeProductFilling({
        productId: product.id,
        label: 'Chocolate',
      })
    );

    const result = await sut.execute({
      productId: product.id.toString(),
      label: 'Chocolate',
      priceDelta: 20,
    });

    expect(result.isError()).toBe(true);

    if (result.isError()) {
      expect(result.value).toBeInstanceOf(
        ProductFillingLabelAlreadyExistsError
      );
    }
  });

  it('should unset the previous default filling when creating a new default filling', async () => {
    const product = makeProduct();

    await inMemoryProductsRepository.create(product);

    const currentDefaultFilling = makeProductFilling({
      productId: product.id,
      label: 'Chocolate',
      isDefault: true,
    });

    await inMemoryProductFillingsRepository.create(currentDefaultFilling);

    const result = await sut.execute({
      productId: product.id.toString(),
      label: 'Morango',
      priceDelta: 40,
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

  it('should return an unexpected error when products repository fails', async () => {
    sut = new CreateProductsFillingService(
      failingProductsRepository,
      inMemoryProductFillingsRepository
    );

    const result = await sut.execute({
      productId: 'product-1',
      label: 'Chocolate',
      priceDelta: 20,
    });

    expect(result.isError()).toBe(true);

    if (result.isError()) {
      expect(result.value).toBeInstanceOf(UnexpectedError);
      expect(result.value.message).toBe(
        'Something went wrong. Please try again later.'
      );
    }
  });

  it('should return an unexpected error when product fillings repository fails', async () => {
    const product = makeProduct();

    await inMemoryProductsRepository.create(product);

    sut = new CreateProductsFillingService(
      inMemoryProductsRepository,
      failingProductFillingsRepository
    );

    const result = await sut.execute({
      productId: product.id.toString(),
      label: 'Chocolate',
      priceDelta: 20,
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
