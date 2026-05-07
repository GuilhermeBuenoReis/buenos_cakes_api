import { beforeEach, describe, expect, it } from 'vitest';
import { makeOrderItem } from '../../../../../test/factories/make-order-item';
import { makeProduct } from '../../../../../test/factories/make-product';
import { makeProductFilling } from '../../../../../test/factories/make-product-filling';
import { makeProductSize } from '../../../../../test/factories/make-product-size';
import { FailingOrderItemsRepository } from '../../../../../test/repositories/failures/failing-order-items-repository';
import { InMemoryOrderItemsRepository } from '../../../../../test/repositories/in-memory-order-items-repository';
import { InMemoryProductFillingsRepository } from '../../../../../test/repositories/in-memory-product-fillings-repository';
import { InMemoryProductSizesRepository } from '../../../../../test/repositories/in-memory-product-sizes-repository';
import { InMemoryProductsRepository } from '../../../../../test/repositories/in-memory-products-repository';
import { UnexpectedError } from '../../../../core/errors/unexpected-error';
import { ProductFillingNotFoundError } from '../../../products/application/errors/product-filling-not-found-error';
import { ProductNotFoundError } from '../../../products/application/errors/product-not-found-error';
import { ProductSizeNotFoundError } from '../../../products/application/errors/product-size-not-found-error';
import { OrderItemNotFoundError } from '../errors/order-item-not-found-error';
import { UpdateOrderItemService } from './update-order-item-service';

let inMemoryOrderItemsRepository: InMemoryOrderItemsRepository;
let inMemoryProductsRepository: InMemoryProductsRepository;
let inMemoryProductSizesRepository: InMemoryProductSizesRepository;
let inMemoryProductFillingsRepository: InMemoryProductFillingsRepository;
let failingOrderItemsRepository: FailingOrderItemsRepository;
let sut: UpdateOrderItemService;

describe('UpdateOrderItemService', () => {
  beforeEach(() => {
    inMemoryOrderItemsRepository = new InMemoryOrderItemsRepository();
    inMemoryProductsRepository = new InMemoryProductsRepository();
    inMemoryProductSizesRepository = new InMemoryProductSizesRepository();
    inMemoryProductFillingsRepository = new InMemoryProductFillingsRepository();
    failingOrderItemsRepository = new FailingOrderItemsRepository();
    sut = new UpdateOrderItemService(
      inMemoryOrderItemsRepository,
      inMemoryProductsRepository,
      inMemoryProductSizesRepository,
      inMemoryProductFillingsRepository
    );
  });

  it('should update an order item', async () => {
    const product = makeProduct();
    const productSize = makeProductSize({ productId: product.id });
    const productFilling = makeProductFilling({ productId: product.id });
    const orderItem = makeOrderItem({ productId: product.id });

    await inMemoryProductsRepository.create(product);
    await inMemoryProductSizesRepository.create(productSize);
    await inMemoryProductFillingsRepository.create(productFilling);
    await inMemoryOrderItemsRepository.create(orderItem);

    const result = await sut.execute({
      orderItemId: orderItem.id.toString(),
      productSizeId: productSize.id.toString(),
      productFillingId: productFilling.id.toString(),
      quantity: 3,
      unitPrice: 40,
      total: 120,
      note: null,
    });

    expect(result.isSuccess()).toBe(true);

    if (result.isSuccess()) {
      expect(result.value.orderItem.productSizeId?.toString()).toBe(
        productSize.id.toString()
      );
      expect(result.value.orderItem.productFillingId?.toString()).toBe(
        productFilling.id.toString()
      );
      expect(result.value.orderItem.quantity).toBe(3);
      expect(result.value.orderItem.unitPrice).toBe(40);
      expect(result.value.orderItem.total).toBe(120);
      expect(result.value.orderItem.note).toBeNull();
      expect(result.value.orderItem.updatedAt).toBeInstanceOf(Date);
    }
  });

  it('should not update an order item when it does not exist', async () => {
    const result = await sut.execute({
      orderItemId: 'non-existing-order-item-id',
      quantity: 3,
    });

    expect(result.isError()).toBe(true);

    if (result.isError()) {
      expect(result.value).toBeInstanceOf(OrderItemNotFoundError);
    }
  });

  it('should not update an order item with a product that does not exist', async () => {
    const orderItem = makeOrderItem();

    await inMemoryOrderItemsRepository.create(orderItem);

    const result = await sut.execute({
      orderItemId: orderItem.id.toString(),
      productId: 'non-existing-product-id',
    });

    expect(result.isError()).toBe(true);

    if (result.isError()) {
      expect(result.value).toBeInstanceOf(ProductNotFoundError);
    }
  });

  it('should clear size and filling when changing product', async () => {
    const product = makeProduct();
    const newProduct = makeProduct();
    const productSize = makeProductSize({ productId: product.id });
    const productFilling = makeProductFilling({ productId: product.id });
    const orderItem = makeOrderItem({
      productId: product.id,
      productSizeId: productSize.id,
      productFillingId: productFilling.id,
    });

    await inMemoryProductsRepository.create(product);
    await inMemoryProductsRepository.create(newProduct);
    await inMemoryProductSizesRepository.create(productSize);
    await inMemoryProductFillingsRepository.create(productFilling);
    await inMemoryOrderItemsRepository.create(orderItem);

    const result = await sut.execute({
      orderItemId: orderItem.id.toString(),
      productId: newProduct.id.toString(),
      productSizeId: null,
      productFillingId: null,
    });

    expect(result.isSuccess()).toBe(true);

    if (result.isSuccess()) {
      expect(result.value.orderItem.productId.toString()).toBe(
        newProduct.id.toString()
      );
      expect(result.value.orderItem.productSizeId).toBeNull();
      expect(result.value.orderItem.productFillingId).toBeNull();
    }
  });

  it('should not change product while keeping size from the previous product', async () => {
    const product = makeProduct();
    const newProduct = makeProduct();
    const productSize = makeProductSize({ productId: product.id });
    const orderItem = makeOrderItem({
      productId: product.id,
      productSizeId: productSize.id,
    });

    await inMemoryProductsRepository.create(product);
    await inMemoryProductsRepository.create(newProduct);
    await inMemoryProductSizesRepository.create(productSize);
    await inMemoryOrderItemsRepository.create(orderItem);

    const result = await sut.execute({
      orderItemId: orderItem.id.toString(),
      productId: newProduct.id.toString(),
    });

    expect(result.isError()).toBe(true);

    if (result.isError()) {
      expect(result.value).toBeInstanceOf(ProductSizeNotFoundError);
    }
  });

  it('should not update an order item with a size from another product', async () => {
    const product = makeProduct();
    const anotherProductSize = makeProductSize();
    const orderItem = makeOrderItem({ productId: product.id });

    await inMemoryProductsRepository.create(product);
    await inMemoryProductSizesRepository.create(anotherProductSize);
    await inMemoryOrderItemsRepository.create(orderItem);

    const result = await sut.execute({
      orderItemId: orderItem.id.toString(),
      productSizeId: anotherProductSize.id.toString(),
    });

    expect(result.isError()).toBe(true);

    if (result.isError()) {
      expect(result.value).toBeInstanceOf(ProductSizeNotFoundError);
    }
  });

  it('should not update an order item with a filling from another product', async () => {
    const product = makeProduct();
    const anotherProductFilling = makeProductFilling();
    const orderItem = makeOrderItem({
      productId: product.id,
      productSizeId: null,
    });

    await inMemoryProductsRepository.create(product);
    await inMemoryProductFillingsRepository.create(anotherProductFilling);
    await inMemoryOrderItemsRepository.create(orderItem);

    const result = await sut.execute({
      orderItemId: orderItem.id.toString(),
      productFillingId: anotherProductFilling.id.toString(),
    });

    expect(result.isError()).toBe(true);

    if (result.isError()) {
      expect(result.value).toBeInstanceOf(ProductFillingNotFoundError);
    }
  });

  it('should return an unexpected error when something goes wrong', async () => {
    sut = new UpdateOrderItemService(
      failingOrderItemsRepository,
      inMemoryProductsRepository,
      inMemoryProductSizesRepository,
      inMemoryProductFillingsRepository
    );

    const result = await sut.execute({
      orderItemId: 'order-item-1',
      quantity: 3,
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
