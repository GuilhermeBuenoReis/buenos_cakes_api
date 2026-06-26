import { beforeEach, describe, expect, it } from 'vitest';
import { makeOrder } from '../../../../../test/factories/make-order';
import { makeOrderItem } from '../../../../../test/factories/make-order-item';
import { makePayment } from '../../../../../test/factories/make-payment';
import { makeProduct } from '../../../../../test/factories/make-product';
import { InMemoryOrderAdjustmentsRepository } from '../../../../../test/repositories/in-memory-order-adjustments-repository';
import { InMemoryOrderItemsRepository } from '../../../../../test/repositories/in-memory-order-items-repository';
import { InMemoryOrdersRepository } from '../../../../../test/repositories/in-memory-orders-repository';
import { InMemoryProductFillingsRepository } from '../../../../../test/repositories/in-memory-product-fillings-repository';
import { InMemoryProductSizesRepository } from '../../../../../test/repositories/in-memory-product-sizes-repository';
import { InMemoryProductsRepository } from '../../../../../test/repositories/in-memory-products-repository';
import { UniqueEntityID } from '../../../../core/entities/unique-entity-id';
import { OrderFulfillmentMethod, OrderStatus } from '../../enterprise/entities/order';
import {
  OrderAdjustment,
  OrderAdjustmentStatus,
  OrderAdjustmentType,
} from '../../enterprise/entities/order-adjustment';
import { PaymentStatus } from '../../enterprise/entities/payment';
import { ApplyOrderAdjustmentService } from './apply-order-adjustment-service';

let orderAdjustmentsRepository: InMemoryOrderAdjustmentsRepository;
let ordersRepository: InMemoryOrdersRepository;
let orderItemsRepository: InMemoryOrderItemsRepository;
let productsRepository: InMemoryProductsRepository;
let productSizesRepository: InMemoryProductSizesRepository;
let productFillingsRepository: InMemoryProductFillingsRepository;
let sut: ApplyOrderAdjustmentService;

describe('ApplyOrderAdjustmentService', () => {
  beforeEach(() => {
    orderAdjustmentsRepository = new InMemoryOrderAdjustmentsRepository();
    ordersRepository = new InMemoryOrdersRepository();
    orderItemsRepository = new InMemoryOrderItemsRepository();
    productsRepository = new InMemoryProductsRepository();
    productSizesRepository = new InMemoryProductSizesRepository();
    productFillingsRepository = new InMemoryProductFillingsRepository();
    sut = new ApplyOrderAdjustmentService(
      orderAdjustmentsRepository,
      ordersRepository,
      orderItemsRepository,
      productsRepository,
      productSizesRepository,
      productFillingsRepository
    );
  });

  it('should confirm a pending adjustment and apply the change when the additional payment is confirmed', async () => {
    const product = makeProduct({ basePrice: 130, isActive: true });
    await productsRepository.create(product);

    const order = makeOrder({
      status: OrderStatus.PENDING,
      fulfillmentMethod: OrderFulfillmentMethod.PICKUP,
      deliveryFee: 0,
      subtotal: 50,
      total: 50,
    });
    await ordersRepository.create(order);
    await orderItemsRepository.create(
      makeOrderItem({
        orderId: order.id,
        productSizeId: null,
        productFillingId: null,
        quantity: 1,
        unitPrice: 50,
        total: 50,
      })
    );

    const payment = makePayment({
      orderId: order.id,
      status: PaymentStatus.PAID,
      amount: 130,
    });

    const adjustment = OrderAdjustment.create({
      orderId: order.id,
      requestedByUserId: new UniqueEntityID('user-1'),
      type: OrderAdjustmentType.ADDITIONAL_PAYMENT,
      previousTotal: 50,
      newTotal: 180,
      difference: 130,
      paymentId: payment.id,
      operation: {
        action: 'add',
        productId: product.id.toString(),
        quantity: 1,
      },
    });
    await orderAdjustmentsRepository.create(adjustment);

    const result = await sut.execute({ paymentId: payment.id.toString() });

    expect(result.isSuccess()).toBe(true);
    if (result.isSuccess()) {
      expect(result.value.applied).toBe(true);
    }
    expect(orderItemsRepository.items).toHaveLength(2);
    expect(ordersRepository.items[0].total).toBe(180);
    expect(orderAdjustmentsRepository.items[0].status).toBe(
      OrderAdjustmentStatus.CONFIRMED
    );
    expect(orderAdjustmentsRepository.items[0].confirmedAt).toBeInstanceOf(Date);
  });

  it('should do nothing when there is no pending adjustment for the payment', async () => {
    const result = await sut.execute({ paymentId: 'unknown-payment' });

    expect(result.isSuccess()).toBe(true);
    if (result.isSuccess()) {
      expect(result.value.applied).toBe(false);
    }
  });

  it('should not apply an adjustment twice', async () => {
    const product = makeProduct({ basePrice: 10, isActive: true });
    await productsRepository.create(product);

    const order = makeOrder({
      status: OrderStatus.PENDING,
      fulfillmentMethod: OrderFulfillmentMethod.PICKUP,
      deliveryFee: 0,
      subtotal: 50,
      total: 50,
    });
    await ordersRepository.create(order);
    await orderItemsRepository.create(
      makeOrderItem({ orderId: order.id, total: 50 })
    );

    const adjustment = OrderAdjustment.create({
      orderId: order.id,
      requestedByUserId: new UniqueEntityID('user-1'),
      type: OrderAdjustmentType.ADDITIONAL_PAYMENT,
      status: OrderAdjustmentStatus.CONFIRMED,
      previousTotal: 50,
      newTotal: 60,
      difference: 10,
      paymentId: new UniqueEntityID('payment-1'),
      operation: {
        action: 'add',
        productId: product.id.toString(),
        quantity: 1,
      },
    });
    await orderAdjustmentsRepository.create(adjustment);

    const result = await sut.execute({ paymentId: 'payment-1' });

    expect(result.isSuccess()).toBe(true);
    if (result.isSuccess()) {
      expect(result.value.applied).toBe(false);
    }
    expect(orderItemsRepository.items).toHaveLength(1);
  });
});
