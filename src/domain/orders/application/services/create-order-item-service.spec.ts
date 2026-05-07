import { beforeEach, describe, expect, it } from 'vitest';
import { makeOrder } from '../../../../../test/factories/make-order';
import { makeProduct } from '../../../../../test/factories/make-product';
import { makeProductFilling } from '../../../../../test/factories/make-product-filling';
import { makeProductSize } from '../../../../../test/factories/make-product-size';
import { FailingOrderItemsRepository } from '../../../../../test/repositories/failures/failing-order-items-repository';
import { FailingOrdersRepository } from '../../../../../test/repositories/failures/failing-orders-repository';
import { InMemoryOrderItemsRepository } from '../../../../../test/repositories/in-memory-order-items-repository';
import { InMemoryOrdersRepository } from '../../../../../test/repositories/in-memory-orders-repository';
import { InMemoryProductFillingsRepository } from '../../../../../test/repositories/in-memory-product-fillings-repository';
import { InMemoryProductSizesRepository } from '../../../../../test/repositories/in-memory-product-sizes-repository';
import { InMemoryProductsRepository } from '../../../../../test/repositories/in-memory-products-repository';
import { UnexpectedError } from '../../../../core/errors/unexpected-error';
import { ProductFillingNotFoundError } from '../../../products/application/errors/product-filling-not-found-error';
import { ProductNotFoundError } from '../../../products/application/errors/product-not-found-error';
import { ProductSizeNotFoundError } from '../../../products/application/errors/product-size-not-found-error';
import { OrderNotFoundError } from '../errors/order-not-found-error';
import { CreateOrderItemService } from './create-order-item-service';

let inMemoryOrderItemsRepository: InMemoryOrderItemsRepository;
let inMemoryOrdersRepository: InMemoryOrdersRepository;
let inMemoryProductsRepository: InMemoryProductsRepository;
let inMemoryProductSizesRepository: InMemoryProductSizesRepository;
let inMemoryProductFillingsRepository: InMemoryProductFillingsRepository;
let failingOrderItemsRepository: FailingOrderItemsRepository;
let failingOrdersRepository: FailingOrdersRepository;
let sut: CreateOrderItemService;

describe('CreateOrderItemService', () => {
  beforeEach(() => {
    inMemoryOrderItemsRepository = new InMemoryOrderItemsRepository();
    inMemoryOrdersRepository = new InMemoryOrdersRepository();
    inMemoryProductsRepository = new InMemoryProductsRepository();
    inMemoryProductSizesRepository = new InMemoryProductSizesRepository();
    inMemoryProductFillingsRepository = new InMemoryProductFillingsRepository();
    failingOrderItemsRepository = new FailingOrderItemsRepository();
    failingOrdersRepository = new FailingOrdersRepository();
    sut = new CreateOrderItemService(
      inMemoryOrderItemsRepository,
      inMemoryOrdersRepository,
      inMemoryProductsRepository,
      inMemoryProductSizesRepository,
      inMemoryProductFillingsRepository
    );
  });

  it('should create an order item', async () => {
    const order = makeOrder();
    const product = makeProduct();
    const productSize = makeProductSize({ productId: product.id });
    const productFilling = makeProductFilling({ productId: product.id });

    await inMemoryOrdersRepository.create(order);
    await inMemoryProductsRepository.create(product);
    await inMemoryProductSizesRepository.create(productSize);
    await inMemoryProductFillingsRepository.create(productFilling);

    const result = await sut.execute({
      orderId: order.id.toString(),
      productId: product.id.toString(),
      productSizeId: productSize.id.toString(),
      productFillingId: productFilling.id.toString(),
      quantity: 2,
      unitPrice: 35,
      total: 70,
      note: 'Sem canela',
    });

    expect(result.isSuccess()).toBe(true);
    expect(inMemoryOrderItemsRepository.items).toHaveLength(1);

    if (result.isSuccess()) {
      expect(result.value.orderItem.orderId.toString()).toBe(
        order.id.toString()
      );
      expect(result.value.orderItem.productId.toString()).toBe(
        product.id.toString()
      );
      expect(result.value.orderItem.productSizeId?.toString()).toBe(
        productSize.id.toString()
      );
      expect(result.value.orderItem.productFillingId?.toString()).toBe(
        productFilling.id.toString()
      );
      expect(result.value.orderItem.quantity).toBe(2);
      expect(result.value.orderItem.unitPrice).toBe(35);
      expect(result.value.orderItem.total).toBe(70);
      expect(result.value.orderItem.note).toBe('Sem canela');
    }
  });

  it('should not create an order item when order does not exist', async () => {
    const product = makeProduct();

    await inMemoryProductsRepository.create(product);

    const result = await sut.execute({
      orderId: 'non-existing-order-id',
      productId: product.id.toString(),
      quantity: 1,
      unitPrice: 35,
      total: 35,
    });

    expect(result.isError()).toBe(true);

    if (result.isError()) {
      expect(result.value).toBeInstanceOf(OrderNotFoundError);
    }
  });

  it('should not create an order item when product does not exist', async () => {
    const order = makeOrder();

    await inMemoryOrdersRepository.create(order);

    const result = await sut.execute({
      orderId: order.id.toString(),
      productId: 'non-existing-product-id',
      quantity: 1,
      unitPrice: 35,
      total: 35,
    });

    expect(result.isError()).toBe(true);

    if (result.isError()) {
      expect(result.value).toBeInstanceOf(ProductNotFoundError);
    }
  });

  it('should not create an order item with a size from another product', async () => {
    const order = makeOrder();
    const product = makeProduct();
    const anotherProductSize = makeProductSize();

    await inMemoryOrdersRepository.create(order);
    await inMemoryProductsRepository.create(product);
    await inMemoryProductSizesRepository.create(anotherProductSize);

    const result = await sut.execute({
      orderId: order.id.toString(),
      productId: product.id.toString(),
      productSizeId: anotherProductSize.id.toString(),
      quantity: 1,
      unitPrice: 35,
      total: 35,
    });

    expect(result.isError()).toBe(true);

    if (result.isError()) {
      expect(result.value).toBeInstanceOf(ProductSizeNotFoundError);
    }
  });

  it('should not create an order item with a filling from another product', async () => {
    const order = makeOrder();
    const product = makeProduct();
    const anotherProductFilling = makeProductFilling();

    await inMemoryOrdersRepository.create(order);
    await inMemoryProductsRepository.create(product);
    await inMemoryProductFillingsRepository.create(anotherProductFilling);

    const result = await sut.execute({
      orderId: order.id.toString(),
      productId: product.id.toString(),
      productFillingId: anotherProductFilling.id.toString(),
      quantity: 1,
      unitPrice: 35,
      total: 35,
    });

    expect(result.isError()).toBe(true);

    if (result.isError()) {
      expect(result.value).toBeInstanceOf(ProductFillingNotFoundError);
    }
  });

  it('should return an unexpected error when orders repository fails', async () => {
    sut = new CreateOrderItemService(
      inMemoryOrderItemsRepository,
      failingOrdersRepository,
      inMemoryProductsRepository,
      inMemoryProductSizesRepository,
      inMemoryProductFillingsRepository
    );

    const result = await sut.execute({
      orderId: 'order-1',
      productId: 'product-1',
      quantity: 1,
      unitPrice: 35,
      total: 35,
    });

    expect(result.isError()).toBe(true);

    if (result.isError()) {
      expect(result.value).toBeInstanceOf(UnexpectedError);
      expect(result.value.message).toBe(
        'Something went wrong. Please try again later.'
      );
    }
  });

  it('should return an unexpected error when order items repository fails', async () => {
    const order = makeOrder();
    const product = makeProduct();

    await inMemoryOrdersRepository.create(order);
    await inMemoryProductsRepository.create(product);

    sut = new CreateOrderItemService(
      failingOrderItemsRepository,
      inMemoryOrdersRepository,
      inMemoryProductsRepository,
      inMemoryProductSizesRepository,
      inMemoryProductFillingsRepository
    );

    const result = await sut.execute({
      orderId: order.id.toString(),
      productId: product.id.toString(),
      quantity: 1,
      unitPrice: 35,
      total: 35,
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
