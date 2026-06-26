import { beforeEach, describe, expect, it } from 'vitest';
import { makeOrder } from '../../../../../test/factories/make-order';
import { makeOrderItem } from '../../../../../test/factories/make-order-item';
import { makePayment } from '../../../../../test/factories/make-payment';
import { makeProduct } from '../../../../../test/factories/make-product';
import { FailingPaymentsRepository } from '../../../../../test/repositories/failures/failing-payments-repository';
import { InMemoryOrderAdjustmentsRepository } from '../../../../../test/repositories/in-memory-order-adjustments-repository';
import { InMemoryOrderItemsRepository } from '../../../../../test/repositories/in-memory-order-items-repository';
import { InMemoryOrdersRepository } from '../../../../../test/repositories/in-memory-orders-repository';
import { InMemoryPaymentsRepository } from '../../../../../test/repositories/in-memory-payments-repository';
import { InMemoryProductFillingsRepository } from '../../../../../test/repositories/in-memory-product-fillings-repository';
import { InMemoryProductSizesRepository } from '../../../../../test/repositories/in-memory-product-sizes-repository';
import { InMemoryProductsRepository } from '../../../../../test/repositories/in-memory-products-repository';
import { UniqueEntityID } from '../../../../core/entities/unique-entity-id';
import { UnexpectedError } from '../../../../core/errors/unexpected-error';
import {
  OrderFulfillmentMethod,
  OrderStatus,
} from '../../enterprise/entities/order';
import {
  OrderAdjustment,
  OrderAdjustmentStatus,
  OrderAdjustmentType,
} from '../../enterprise/entities/order-adjustment';
import { PaymentStatus } from '../../enterprise/entities/payment';
import { PaymentNotFoundError } from '../errors/payment-not-found-error';
import type { PaymentGatewayWebhookEvent } from '../gateways/payment-gateway';
import { ApplyOrderAdjustmentService } from './apply-order-adjustment-service';
import { HandlePaymentGatewayWebhookService } from './handle-payment-gateway-webhook-service';

let inMemoryPaymentsRepository: InMemoryPaymentsRepository;
let failingPaymentsRepository: FailingPaymentsRepository;
let sut: HandlePaymentGatewayWebhookService;

describe('HandlePaymentGatewayWebhookService', () => {
  beforeEach(() => {
    inMemoryPaymentsRepository = new InMemoryPaymentsRepository();
    failingPaymentsRepository = new FailingPaymentsRepository();
    sut = new HandlePaymentGatewayWebhookService(inMemoryPaymentsRepository);
  });

  it('should update a payment from a provider session webhook', async () => {
    const payment = makePayment({
      providerName: 'abacate_pay',
      providerSessionId: 'abacate-pay-checkout-1',
      providerReferenceId: null,
    });
    const paidAt = new Date('2026-01-01T10:00:00.000Z');

    await inMemoryPaymentsRepository.create(payment);

    const result = await sut.execute({
      event: {
        providerName: 'abacate_pay',
        providerSessionId: 'abacate-pay-checkout-1',
        providerReferenceId: 'abacate-pay-checkout-1',
        providerCustomerId: 'customer-1',
        providerPaymentMethodId: 'visa',
        status: PaymentStatus.PAID,
        providerStatus: 'PAID',
        occurredAt: paidAt,
      },
    });

    expect(result.isSuccess()).toBe(true);

    if (result.isSuccess()) {
      expect(result.value.payment.status).toBe(PaymentStatus.PAID);
      expect(result.value.payment.providerReferenceId).toBe(
        'abacate-pay-checkout-1'
      );
      expect(result.value.payment.providerCustomerId).toBe('customer-1');
      expect(result.value.payment.providerPaymentMethodId).toBe('visa');
      expect(result.value.payment.providerStatus).toBe('PAID');
      expect(result.value.payment.paidAt).toEqual(paidAt);
    }
  });

  it('should update a payment from a provider reference webhook', async () => {
    const payment = makePayment({
      providerName: 'abacate_pay',
      providerReferenceId: 'abacate-pay-checkout-1',
      providerSessionId: null,
    });

    await inMemoryPaymentsRepository.create(payment);

    const result = await sut.execute({
      event: {
        providerName: 'abacate_pay',
        providerReferenceId: 'abacate-pay-checkout-1',
        status: PaymentStatus.FAILED,
        providerStatus: 'DISPUTED',
        failureReason: 'requested_by_customer',
      },
    });

    expect(result.isSuccess()).toBe(true);

    if (result.isSuccess()) {
      expect(result.value.payment.status).toBe(PaymentStatus.FAILED);
      expect(result.value.payment.providerStatus).toBe('DISPUTED');
      expect(result.value.payment.failureReason).toBe('requested_by_customer');
    }
  });

  it('should return not found when provider identifiers do not exist', async () => {
    const result = await sut.execute({
      event: {
        providerName: 'abacate_pay',
        providerSessionId: 'abacate-pay-checkout-1',
        status: PaymentStatus.CANCELED,
      },
    });

    expect(result.isError()).toBe(true);

    if (result.isError()) {
      expect(result.value).toBeInstanceOf(PaymentNotFoundError);
    }
  });

  it('should return an unexpected error when repository fails', async () => {
    sut = new HandlePaymentGatewayWebhookService(failingPaymentsRepository);

    const result = await sut.execute({
      event: {
        providerName: 'abacate_pay',
        providerSessionId: 'abacate-pay-checkout-1',
        status: PaymentStatus.PAID,
      },
    });

    expect(result.isError()).toBe(true);

    if (result.isError()) {
      expect(result.value).toBeInstanceOf(UnexpectedError);
    }
  });

  it('should confirm the adjustment when an additional payment webhook is paid', async () => {
    const ordersRepository = new InMemoryOrdersRepository();
    const orderItemsRepository = new InMemoryOrderItemsRepository();
    const productsRepository = new InMemoryProductsRepository();
    const productSizesRepository = new InMemoryProductSizesRepository();
    const productFillingsRepository = new InMemoryProductFillingsRepository();
    const orderAdjustmentsRepository = new InMemoryOrderAdjustmentsRepository();

    const product = makeProduct({ basePrice: 20, isActive: true });
    await productsRepository.create(product);

    const order = makeOrder({
      status: OrderStatus.PENDING,
      fulfillmentMethod: OrderFulfillmentMethod.PICKUP,
      deliveryFee: 0,
      subtotal: 58,
      total: 58,
    });
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

    const additionalPayment = makePayment({
      orderId: order.id,
      status: PaymentStatus.PROCESSING,
      amount: 20,
      providerName: 'abacate_pay',
      providerSessionId: 'abacate-pay-checkout-2',
      providerReferenceId: null,
    });
    await inMemoryPaymentsRepository.create(additionalPayment);

    const adjustment = OrderAdjustment.create({
      orderId: order.id,
      requestedByUserId: new UniqueEntityID('user-1'),
      type: OrderAdjustmentType.ADDITIONAL_PAYMENT,
      previousTotal: 58,
      newTotal: 78,
      difference: 20,
      paymentId: additionalPayment.id,
      operation: {
        action: 'add',
        productId: product.id.toString(),
        quantity: 1,
      },
    });
    await orderAdjustmentsRepository.create(adjustment);

    const applyOrderAdjustmentService = new ApplyOrderAdjustmentService(
      orderAdjustmentsRepository,
      ordersRepository,
      orderItemsRepository,
      productsRepository,
      productSizesRepository,
      productFillingsRepository
    );
    sut = new HandlePaymentGatewayWebhookService(
      inMemoryPaymentsRepository,
      applyOrderAdjustmentService
    );

    const event: PaymentGatewayWebhookEvent = {
      providerName: 'abacate_pay',
      providerSessionId: 'abacate-pay-checkout-2',
      status: PaymentStatus.PAID,
      providerStatus: 'PAID',
      occurredAt: new Date('2026-01-01T10:00:00.000Z'),
    };

    const result = await sut.execute({ event });

    expect(result.isSuccess()).toBe(true);
    if (result.isSuccess()) {
      expect(result.value.payment.status).toBe(PaymentStatus.PAID);
    }

    expect(orderAdjustmentsRepository.items[0].status).toBe(
      OrderAdjustmentStatus.CONFIRMED
    );
    expect(orderAdjustmentsRepository.items[0].confirmedAt).toBeInstanceOf(Date);
    expect(orderItemsRepository.items).toHaveLength(2);
    expect(ordersRepository.items[0].total).toBe(78);

    await sut.execute({ event });

    expect(orderItemsRepository.items).toHaveLength(2);
    expect(ordersRepository.items[0].total).toBe(78);
    expect(orderAdjustmentsRepository.items[0].status).toBe(
      OrderAdjustmentStatus.CONFIRMED
    );
  });
});
