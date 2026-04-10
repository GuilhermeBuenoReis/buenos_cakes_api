import { beforeEach, describe, expect, it } from 'vitest';
import { makeProduct } from '../../../../../test/factories/make-product';
import { makeProductSize } from '../../../../../test/factories/make-product-size';
import { FailingProductsRepository } from '../../../../../test/repositories/failures/failing-products-repository';
import { FailingProductSizesRepository } from '../../../../../test/repositories/failures/failing-product-sizes-repository';
import { InMemoryProductsRepository } from '../../../../../test/repositories/in-memory-products-repository';
import { InMemoryProductSizesRepository } from '../../../../../test/repositories/in-memory-product-sizes-repository';
import { UnexpectedError } from '../../../../core/errors/unexpected-error';
import { ProductNotFoundError } from '../errors/product-not-found-error';
import { ProductSizeCodeAlreadyExistsError } from '../errors/product-size-code-already-exists-error';
import { CreateProductSizeService } from './create-product-size-service';

let inMemoryProductsRepository: InMemoryProductsRepository;
let inMemoryProductSizesRepository: InMemoryProductSizesRepository;
let failingProductsRepository: FailingProductsRepository;
let failingProductSizesRepository: FailingProductSizesRepository;
let sut: CreateProductSizeService;

describe('CreateProductSizeService', () => {
  beforeEach(() => {
    inMemoryProductsRepository = new InMemoryProductsRepository();
    inMemoryProductSizesRepository = new InMemoryProductSizesRepository();
    failingProductsRepository = new FailingProductsRepository();
    failingProductSizesRepository = new FailingProductSizesRepository();
    sut = new CreateProductSizeService(
      inMemoryProductsRepository,
      inMemoryProductSizesRepository
    );
  });

  it('should create a product size', async () => {
    const product = makeProduct();

    await inMemoryProductsRepository.create(product);

    const result = await sut.execute({
      productId: product.id.toString(),
      code: 'KG1',
      label: '1kg',
      servingsLabel: '10 fatias',
      priceDelta: 20,
      sortOrder: 1,
    });

    expect(result.isSuccess()).toBe(true);
    expect(inMemoryProductSizesRepository.items).toHaveLength(1);

    if (result.isSuccess()) {
      expect(result.value.productSize.productId.toString()).toBe(
        product.id.toString()
      );
      expect(result.value.productSize.code).toBe('KG1');
      expect(result.value.productSize.label).toBe('1kg');
      expect(result.value.productSize.servingsLabel).toBe('10 fatias');
      expect(result.value.productSize.priceDelta).toBe(20);
      expect(result.value.productSize.isDefault).toBe(true);
      expect(result.value.productSize.isActive).toBe(true);
    }
  });

  it('should not create a product size when product does not exist', async () => {
    const result = await sut.execute({
      productId: 'non-existing-product-id',
      code: 'KG1',
      label: '1kg',
      priceDelta: 20,
    });

    expect(result.isError()).toBe(true);

    if (result.isError()) {
      expect(result.value).toBeInstanceOf(ProductNotFoundError);
    }
  });

  it('should not create a product size with the same code for the same product', async () => {
    const product = makeProduct();

    await inMemoryProductsRepository.create(product);
    await inMemoryProductSizesRepository.create(
      makeProductSize({
        productId: product.id,
        code: 'KG1',
      })
    );

    const result = await sut.execute({
      productId: product.id.toString(),
      code: 'KG1',
      label: '1kg',
      priceDelta: 20,
    });

    expect(result.isError()).toBe(true);

    if (result.isError()) {
      expect(result.value).toBeInstanceOf(ProductSizeCodeAlreadyExistsError);
    }
  });

  it('should unset the previous default size when creating a new default size', async () => {
    const product = makeProduct();

    await inMemoryProductsRepository.create(product);

    const currentDefaultSize = makeProductSize({
      productId: product.id,
      code: 'KG1',
      isDefault: true,
    });

    await inMemoryProductSizesRepository.create(currentDefaultSize);

    const result = await sut.execute({
      productId: product.id.toString(),
      code: 'KG2',
      label: '2kg',
      priceDelta: 40,
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

  it('should return an unexpected error when products repository fails', async () => {
    sut = new CreateProductSizeService(
      failingProductsRepository,
      inMemoryProductSizesRepository
    );

    const result = await sut.execute({
      productId: 'product-1',
      code: 'KG1',
      label: '1kg',
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

  it('should return an unexpected error when product sizes repository fails', async () => {
    const product = makeProduct();

    await inMemoryProductsRepository.create(product);

    sut = new CreateProductSizeService(
      inMemoryProductsRepository,
      failingProductSizesRepository
    );

    const result = await sut.execute({
      productId: product.id.toString(),
      code: 'KG1',
      label: '1kg',
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
