import { beforeEach, describe, expect, it } from 'vitest';
import { makeOrder } from '../../../../../test/factories/make-order';
import { makeOrderItem } from '../../../../../test/factories/make-order-item';
import { makePayment } from '../../../../../test/factories/make-payment';
import { makeProduct } from '../../../../../test/factories/make-product';
import { FakePaymentGateway } from '../../../../../test/payment/fake-payment-gateway';
import { InMemoryOrderAdjustmentsRepository } from '../../../../../test/repositories/in-memory-order-adjustments-repository';
import { InMemoryOrderItemsRepository } from '../../../../../test/repositories/in-memory-order-items-repository';
import { InMemoryOrdersRepository } from '../../../../../test/repositories/in-memory-orders-repository';
import { InMemoryPaymentsRepository } from '../../../../../test/repositories/in-memory-payments-repository';
import { InMemoryProductFillingsRepository } from '../../../../../test/repositories/in-memory-product-fillings-repository';
import { InMemoryProductSizesRepository } from '../../../../../test/repositories/in-memory-product-sizes-repository';
import { InMemoryProductsRepository } from '../../../../../test/repositories/in-memory-products-repository';
import { UniqueEntityID } from '../../../../core/entities/unique-entity-id';
import { ProductNotAvailableError } from '../../../products/application/errors/product-not-available-error';
import {
  OrderFulfillmentMethod,
  OrderStatus,
} from '../../enterprise/entities/order';
import {
  OrderAdjustmentStatus,
  OrderAdjustmentType,
} from '../../enterprise/entities/order-adjustment';
import { PaymentStatus } from '../../enterprise/entities/payment';
import { OrderDoesNotBelongToUserError } from '../errors/order-does-not-belong-to-user-error';
import { OrderEditDeadlineExpiredError } from '../errors/order-edit-deadline-expired-error';
import { OrderItemNotFoundError } from '../errors/order-item-not-found-error';
import { OrderMustHaveItemsError } from '../errors/order-must-have-items-error';
import { OrderNotFoundError } from '../errors/order-not-found-error';
import { OrderStatusNotEditableError } from '../errors/order-status-not-editable-error';
import { PaymentGatewayError } from '../errors/payment-gateway-error';
import type { PaymentGateway } from '../gateways/payment-gateway';
import { ChangeOrderItemsService } from './change-order-items-service';

let ordersRepository: InMemoryOrdersRepository;
let orderItemsRepository: InMemoryOrderItemsRepository;
let productsRepository: InMemoryProductsRepository;
let productSizesRepository: InMemoryProductSizesRepository;
let productFillingsRepository: InMemoryProductFillingsRepository;
let paymentsRepository: InMemoryPaymentsRepository;
let orderAdjustmentsRepository: InMemoryOrderAdjustmentsRepository;
let paymentGateway: FakePaymentGateway;
let sut: ChangeOrderItemsService;

const USER_ID = 'user-1';

function inHours(hours: number) {
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}

function makeEditableOrder(overrides = {}) {
  return makeOrder({
    userId: new UniqueEntityID(USER_ID),
    status: OrderStatus.PENDING,
    fulfillmentMethod: OrderFulfillmentMethod.PICKUP,
    pickupScheduledAt: inHours(48),
    deliveryFee: 0,
    ...overrides,
  });
}

describe('ChangeOrderItemsService', () => {
  beforeEach(() => {
    ordersRepository = new InMemoryOrdersRepository();
    orderItemsRepository = new InMemoryOrderItemsRepository();
    productsRepository = new InMemoryProductsRepository();
    productSizesRepository = new InMemoryProductSizesRepository();
    productFillingsRepository = new InMemoryProductFillingsRepository();
    paymentsRepository = new InMemoryPaymentsRepository();
    orderAdjustmentsRepository = new InMemoryOrderAdjustmentsRepository();
    paymentGateway = new FakePaymentGateway();
    sut = new ChangeOrderItemsService(
      ordersRepository,
      orderItemsRepository,
      productsRepository,
      productSizesRepository,
      productFillingsRepository,
      paymentsRepository,
      orderAdjustmentsRepository,
      paymentGateway
    );
  });

  it('should not change an order that does not exist', async () => {
    const result = await sut.execute({
      orderId: 'non-existing-order',
      userId: USER_ID,
      operation: { action: 'remove', orderItemId: 'item-1' },
    });

    expect(result.isError()).toBe(true);
    if (result.isError()) {
      expect(result.value).toBeInstanceOf(OrderNotFoundError);
    }
  });

  it('should not change an order that belongs to another user', async () => {
    const order = makeEditableOrder({ userId: new UniqueEntityID('other') });
    await ordersRepository.create(order);

    const result = await sut.execute({
      orderId: order.id.toString(),
      userId: USER_ID,
      operation: { action: 'remove', orderItemId: 'item-1' },
    });

    expect(result.isError()).toBe(true);
    if (result.isError()) {
      expect(result.value).toBeInstanceOf(OrderDoesNotBelongToUserError);
    }
  });

  it('should not change an order when there are 24 hours or less to pickup', async () => {
    const order = makeEditableOrder({ pickupScheduledAt: inHours(23) });
    await ordersRepository.create(order);

    const result = await sut.execute({
      orderId: order.id.toString(),
      userId: USER_ID,
      operation: { action: 'remove', orderItemId: 'item-1' },
    });

    expect(result.isError()).toBe(true);
    if (result.isError()) {
      expect(result.value).toBeInstanceOf(OrderEditDeadlineExpiredError);
    }
  });

  it('should not change an order whose pickup date already passed', async () => {
    const order = makeEditableOrder({ pickupScheduledAt: inHours(-2) });
    await ordersRepository.create(order);

    const result = await sut.execute({
      orderId: order.id.toString(),
      userId: USER_ID,
      operation: { action: 'remove', orderItemId: 'item-1' },
    });

    expect(result.isError()).toBe(true);
    if (result.isError()) {
      expect(result.value).toBeInstanceOf(OrderEditDeadlineExpiredError);
    }
  });

  it('should not change an order with a blocked status', async () => {
    const order = makeEditableOrder({ status: OrderStatus.PREPARING });
    await ordersRepository.create(order);

    const result = await sut.execute({
      orderId: order.id.toString(),
      userId: USER_ID,
      operation: { action: 'remove', orderItemId: 'item-1' },
    });

    expect(result.isError()).toBe(true);
    if (result.isError()) {
      expect(result.value).toBeInstanceOf(OrderStatusNotEditableError);
    }
  });

  it('should not edit an item that does not exist', async () => {
    const order = makeEditableOrder({ subtotal: 50, total: 50 });
    await ordersRepository.create(order);
    await orderItemsRepository.create(
      makeOrderItem({ orderId: order.id, total: 50 })
    );

    const result = await sut.execute({
      orderId: order.id.toString(),
      userId: USER_ID,
      operation: { action: 'edit', orderItemId: 'non-existing', quantity: 2 },
    });

    expect(result.isError()).toBe(true);
    if (result.isError()) {
      expect(result.value).toBeInstanceOf(OrderItemNotFoundError);
    }
  });

  it('should recalculate the total when editing an item of an unpaid order', async () => {
    const product = makeProduct({ basePrice: 50, isActive: true });
    await productsRepository.create(product);

    const order = makeEditableOrder({ subtotal: 50, total: 50 });
    await ordersRepository.create(order);

    const item = makeOrderItem({
      orderId: order.id,
      productId: product.id,
      productSizeId: null,
      productFillingId: null,
      quantity: 1,
      unitPrice: 50,
      total: 50,
    });
    await orderItemsRepository.create(item);

    const result = await sut.execute({
      orderId: order.id.toString(),
      userId: USER_ID,
      operation: {
        action: 'edit',
        orderItemId: item.id.toString(),
        quantity: 3,
      },
    });

    expect(result.isSuccess()).toBe(true);
    if (result.isSuccess()) {
      expect(result.value.change.status).toBe('applied');
      expect(result.value.change.newTotal).toBe(150);
      expect(result.value.order.total).toBe(150);
      expect(ordersRepository.items[0].total).toBe(150);
    }
  });

  it('should recalculate the total and ignore any frontend price when adding an item', async () => {
    const product = makeProduct({ basePrice: 80, isActive: true });
    await productsRepository.create(product);

    const order = makeEditableOrder({ subtotal: 50, total: 50 });
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

    const result = await sut.execute({
      orderId: order.id.toString(),
      userId: USER_ID,
      operation: {
        action: 'add',
        productId: product.id.toString(),
        quantity: 2,
      },
    });

    expect(result.isSuccess()).toBe(true);
    if (result.isSuccess()) {
      expect(result.value.change.status).toBe('applied');
      expect(result.value.change.newTotal).toBe(210);
      expect(orderItemsRepository.items).toHaveLength(2);
      const addedItem = orderItemsRepository.items[1];
      expect(addedItem.unitPrice).toBe(80);
      expect(addedItem.total).toBe(160);
    }
  });

  it('should recalculate the total when removing an item', async () => {
    const order = makeEditableOrder({ subtotal: 180, total: 180 });
    await ordersRepository.create(order);
    const keptItem = makeOrderItem({
      orderId: order.id,
      quantity: 1,
      unitPrice: 50,
      total: 50,
    });
    const removedItem = makeOrderItem({
      orderId: order.id,
      quantity: 1,
      unitPrice: 130,
      total: 130,
    });
    await orderItemsRepository.create(keptItem);
    await orderItemsRepository.create(removedItem);

    const result = await sut.execute({
      orderId: order.id.toString(),
      userId: USER_ID,
      operation: { action: 'remove', orderItemId: removedItem.id.toString() },
    });

    expect(result.isSuccess()).toBe(true);
    if (result.isSuccess()) {
      expect(result.value.change.newTotal).toBe(50);
      expect(orderItemsRepository.items).toHaveLength(1);
      expect(ordersRepository.items[0].total).toBe(50);
    }
  });

  it('should not remove the last item of an order', async () => {
    const order = makeEditableOrder({ subtotal: 50, total: 50 });
    await ordersRepository.create(order);
    const item = makeOrderItem({ orderId: order.id, total: 50 });
    await orderItemsRepository.create(item);

    const result = await sut.execute({
      orderId: order.id.toString(),
      userId: USER_ID,
      operation: { action: 'remove', orderItemId: item.id.toString() },
    });

    expect(result.isError()).toBe(true);
    if (result.isError()) {
      expect(result.value).toBeInstanceOf(OrderMustHaveItemsError);
    }
  });

  it('should require an additional payment when a paid order becomes more expensive', async () => {
    const product = makeProduct({ basePrice: 130, isActive: true });
    await productsRepository.create(product);

    const order = makeEditableOrder({ subtotal: 50, total: 50 });
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
    await paymentsRepository.create(
      makePayment({ orderId: order.id, status: PaymentStatus.PAID, amount: 50 })
    );

    const result = await sut.execute({
      orderId: order.id.toString(),
      userId: USER_ID,
      operation: {
        action: 'add',
        productId: product.id.toString(),
        quantity: 1,
      },
    });

    expect(result.isSuccess()).toBe(true);
    if (result.isSuccess()) {
      expect(result.value.change.status).toBe('requires_additional_payment');
      expect(result.value.change.difference).toBe(130);
      expect(result.value.change.checkoutUrl).toBe(
        'https://app.abacatepay.com/pay/abacate-pay-checkout-1'
      );
      expect(result.value.change.payment?.amount).toBe(130);
      expect(result.value.order.total).toBe(50);
    }

    expect(orderItemsRepository.items).toHaveLength(1);
    expect(ordersRepository.items[0].total).toBe(50);
    expect(orderAdjustmentsRepository.items).toHaveLength(1);
    expect(orderAdjustmentsRepository.items[0].type).toBe(
      OrderAdjustmentType.ADDITIONAL_PAYMENT
    );
    expect(orderAdjustmentsRepository.items[0].status).toBe(
      OrderAdjustmentStatus.PENDING
    );
    expect(paymentsRepository.items).toHaveLength(2);
  });

  it('should charge AbacatePay only for the difference, not the whole order total', async () => {
    const product = makeProduct({ basePrice: 20, isActive: true });
    await productsRepository.create(product);

    const order = makeEditableOrder({ subtotal: 58, total: 58 });
    await ordersRepository.create(order);
    await orderItemsRepository.create(
      makeOrderItem({
        orderId: order.id,
        productSizeId: null,
        productFillingId: null,
        quantity: 1,
        unitPrice: 58,
        total: 58,
      })
    );
    await paymentsRepository.create(
      makePayment({ orderId: order.id, status: PaymentStatus.PAID, amount: 58 })
    );

    const result = await sut.execute({
      orderId: order.id.toString(),
      userId: USER_ID,
      operation: {
        action: 'add',
        productId: product.id.toString(),
        quantity: 1,
      },
    });

    expect(result.isSuccess()).toBe(true);
    if (result.isSuccess()) {
      expect(result.value.change.previousTotal).toBe(58);
      expect(result.value.change.newTotal).toBe(78);
      expect(result.value.change.difference).toBe(20);
    }

    expect(paymentGateway.requests).toHaveLength(1);
    expect(paymentGateway.requests[0].amount).toBe(20);
    expect(paymentGateway.requests[0].amount).not.toBe(78);
  });

  it('should relate the additional payment to the created adjustment', async () => {
    const product = makeProduct({ basePrice: 130, isActive: true });
    await productsRepository.create(product);

    const order = makeEditableOrder({ subtotal: 50, total: 50 });
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
    await paymentsRepository.create(
      makePayment({ orderId: order.id, status: PaymentStatus.PAID, amount: 50 })
    );

    const result = await sut.execute({
      orderId: order.id.toString(),
      userId: USER_ID,
      operation: {
        action: 'add',
        productId: product.id.toString(),
        quantity: 1,
      },
    });

    expect(result.isSuccess()).toBe(true);

    const adjustment = orderAdjustmentsRepository.items[0];
    const createdPayment = paymentsRepository.items.find(
      (payment) => payment.status !== PaymentStatus.PAID
    );

    expect(createdPayment).toBeDefined();
    expect(adjustment.paymentId?.toString()).toBe(
      createdPayment?.id.toString()
    );

    if (result.isSuccess()) {
      expect(result.value.change.payment?.id.toString()).toBe(
        createdPayment?.id.toString()
      );
    }
  });

  it('should return a payment gateway error and leave no broken state when AbacatePay fails', async () => {
    const product = makeProduct({ basePrice: 130, isActive: true });
    await productsRepository.create(product);

    const order = makeEditableOrder({ subtotal: 50, total: 50 });
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
    await paymentsRepository.create(
      makePayment({ orderId: order.id, status: PaymentStatus.PAID, amount: 50 })
    );

    const failingGateway = {
      providerName: 'abacate_pay',
      async createCheckoutSession() {
        throw new PaymentGatewayError('AbacatePay request failed.');
      },
    } satisfies PaymentGateway;

    sut = new ChangeOrderItemsService(
      ordersRepository,
      orderItemsRepository,
      productsRepository,
      productSizesRepository,
      productFillingsRepository,
      paymentsRepository,
      orderAdjustmentsRepository,
      failingGateway
    );

    const result = await sut.execute({
      orderId: order.id.toString(),
      userId: USER_ID,
      operation: {
        action: 'add',
        productId: product.id.toString(),
        quantity: 1,
      },
    });

    expect(result.isError()).toBe(true);
    if (result.isError()) {
      expect(result.value).toBeInstanceOf(PaymentGatewayError);
    }

    expect(paymentsRepository.items).toHaveLength(1);
    expect(orderAdjustmentsRepository.items).toHaveLength(0);
    expect(orderItemsRepository.items).toHaveLength(1);
    expect(ordersRepository.items[0].total).toBe(50);
  });

  it('should register a refund when a paid order becomes cheaper', async () => {
    const order = makeEditableOrder({ subtotal: 180, total: 180 });
    await ordersRepository.create(order);
    const keptItem = makeOrderItem({
      orderId: order.id,
      quantity: 1,
      unitPrice: 50,
      total: 50,
    });
    const removedItem = makeOrderItem({
      orderId: order.id,
      quantity: 1,
      unitPrice: 130,
      total: 130,
    });
    await orderItemsRepository.create(keptItem);
    await orderItemsRepository.create(removedItem);
    await paymentsRepository.create(
      makePayment({ orderId: order.id, status: PaymentStatus.PAID, amount: 180 })
    );

    const result = await sut.execute({
      orderId: order.id.toString(),
      userId: USER_ID,
      operation: { action: 'remove', orderItemId: removedItem.id.toString() },
    });

    expect(result.isSuccess()).toBe(true);
    if (result.isSuccess()) {
      expect(result.value.change.status).toBe('refund_required');
      expect(result.value.change.difference).toBe(-130);
      expect(result.value.order.total).toBe(50);
    }

    expect(orderItemsRepository.items).toHaveLength(1);
    expect(orderAdjustmentsRepository.items[0].type).toBe(
      OrderAdjustmentType.REFUND
    );
    expect(orderAdjustmentsRepository.items[0].status).toBe(
      OrderAdjustmentStatus.PENDING
    );
  });

  it('should apply the change immediately when a paid order keeps the same total', async () => {
    const product = makeProduct({ basePrice: 50, isActive: true });
    await productsRepository.create(product);

    const order = makeEditableOrder({ subtotal: 50, total: 50 });
    await ordersRepository.create(order);
    const item = makeOrderItem({
      orderId: order.id,
      productId: product.id,
      productSizeId: null,
      productFillingId: null,
      quantity: 1,
      unitPrice: 50,
      total: 50,
      note: 'old note',
    });
    await orderItemsRepository.create(item);
    await paymentsRepository.create(
      makePayment({ orderId: order.id, status: PaymentStatus.PAID, amount: 50 })
    );

    const result = await sut.execute({
      orderId: order.id.toString(),
      userId: USER_ID,
      operation: {
        action: 'edit',
        orderItemId: item.id.toString(),
        note: 'new note',
      },
    });

    expect(result.isSuccess()).toBe(true);
    if (result.isSuccess()) {
      expect(result.value.change.status).toBe('applied');
      expect(result.value.change.difference).toBe(0);
    }
    expect(orderItemsRepository.items[0].note).toBe('new note');
    expect(orderAdjustmentsRepository.items).toHaveLength(0);
  });

  it('should not add an inactive product to an order', async () => {
    const product = makeProduct({ basePrice: 50, isActive: false });
    await productsRepository.create(product);

    const order = makeEditableOrder({ subtotal: 50, total: 50 });
    await ordersRepository.create(order);
    await orderItemsRepository.create(
      makeOrderItem({ orderId: order.id, total: 50 })
    );

    const result = await sut.execute({
      orderId: order.id.toString(),
      userId: USER_ID,
      operation: {
        action: 'add',
        productId: product.id.toString(),
        quantity: 1,
      },
    });

    expect(result.isError()).toBe(true);
    if (result.isError()) {
      expect(result.value).toBeInstanceOf(ProductNotAvailableError);
    }
  });
});
