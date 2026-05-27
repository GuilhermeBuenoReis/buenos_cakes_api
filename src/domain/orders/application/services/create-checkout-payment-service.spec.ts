import { beforeEach, describe, expect, it } from 'vitest';
import { makeOrder } from '../../../../../test/factories/make-order';
import { FailingPaymentGateway } from '../../../../../test/payment/failing-payment-gateway';
import { FakePaymentGateway } from '../../../../../test/payment/fake-payment-gateway';
import { FailingOrdersRepository } from '../../../../../test/repositories/failures/failing-orders-repository';
import { InMemoryOrdersRepository } from '../../../../../test/repositories/in-memory-orders-repository';
import { InMemoryPaymentsRepository } from '../../../../../test/repositories/in-memory-payments-repository';
import { UnexpectedError } from '../../../../core/errors/unexpected-error';
import { PaymentStatus } from '../../enterprise/entities/payment';
import { OrderNotFoundError } from '../errors/order-not-found-error';
import { PaymentGatewayError } from '../errors/payment-gateway-error';
import type { PaymentGateway } from '../gateways/payment-gateway';
import { CreateCheckoutPaymentService } from './create-checkout-payment-service';

let inMemoryPaymentsRepository: InMemoryPaymentsRepository;
let inMemoryOrdersRepository: InMemoryOrdersRepository;
let failingOrdersRepository: FailingOrdersRepository;
let fakePaymentGateway: FakePaymentGateway;
let failingPaymentGateway: FailingPaymentGateway;
let sut: CreateCheckoutPaymentService;

describe('CreateCheckoutPaymentService', () => {
  beforeEach(() => {
    inMemoryPaymentsRepository = new InMemoryPaymentsRepository();
    inMemoryOrdersRepository = new InMemoryOrdersRepository();
    failingOrdersRepository = new FailingOrdersRepository();
    fakePaymentGateway = new FakePaymentGateway();
    failingPaymentGateway = new FailingPaymentGateway();
    sut = new CreateCheckoutPaymentService(
      inMemoryPaymentsRepository,
      inMemoryOrdersRepository,
      fakePaymentGateway
    );
  });

  it('should create a checkout payment', async () => {
    const order = makeOrder({ total: 120 });

    await inMemoryOrdersRepository.create(order);

    const result = await sut.execute({
      orderId: order.id.toString(),
      successUrl: 'https://buenos-cakes.com/success',
      cancelUrl: 'https://buenos-cakes.com/cancel',
      customerEmail: 'customer@example.com',
    });

    expect(result.isSuccess()).toBe(true);
    expect(inMemoryPaymentsRepository.items).toHaveLength(1);
    expect(fakePaymentGateway.requests).toHaveLength(1);

    if (result.isSuccess()) {
      const [gatewayRequest] = fakePaymentGateway.requests;

      expect(result.value.checkoutUrl).toBe(
        'https://app.abacatepay.com/pay/abacate-pay-checkout-1'
      );
      expect(result.value.payment.orderId.toString()).toBe(
        order.id.toString()
      );
      expect(result.value.payment.amount).toBe(120);
      expect(result.value.payment.method).toBeNull();
      expect(result.value.payment.status).toBe(PaymentStatus.PROCESSING);
      expect(result.value.payment.providerName).toBe('abacate_pay');
      expect(result.value.payment.providerSessionId).toBe(
        'abacate-pay-checkout-1'
      );
      expect(result.value.payment.providerReferenceId).toBe(
        'abacate-pay-checkout-1'
      );
      expect(result.value.payment.providerCustomerId).toBe('customer-1');
      expect(result.value.payment.providerPaymentMethodId).toBe(
        'visa'
      );
      expect(result.value.payment.providerClientSecret).toBe(
        'client-secret-1'
      );
      expect(result.value.payment.expiresAt).toEqual(
        new Date('2026-01-01T10:30:00.000Z')
      );
      expect(gatewayRequest.orderId).toBe(order.id.toString());
      expect(gatewayRequest.paymentId).toBe(
        result.value.payment.id.toString()
      );
      expect(gatewayRequest.amount).toBe(120);
      expect(gatewayRequest.currency).toBe('brl');
      expect(gatewayRequest.successUrl).toBe(
        'https://buenos-cakes.com/success'
      );
      expect(gatewayRequest.cancelUrl).toBe('https://buenos-cakes.com/cancel');
      expect(gatewayRequest.customerEmail).toBe('customer@example.com');
    }
  });

  it('should not create a checkout payment when order does not exist', async () => {
    const result = await sut.execute({
      orderId: 'non-existing-order-id',
    });

    expect(result.isError()).toBe(true);
    expect(inMemoryPaymentsRepository.items).toHaveLength(0);

    if (result.isError()) {
      expect(result.value).toBeInstanceOf(OrderNotFoundError);
    }
  });

  it('should return an unexpected error when orders repository fails', async () => {
    sut = new CreateCheckoutPaymentService(
      inMemoryPaymentsRepository,
      failingOrdersRepository,
      fakePaymentGateway
    );

    const result = await sut.execute({
      orderId: 'order-1',
    });

    expect(result.isError()).toBe(true);

    if (result.isError()) {
      expect(result.value).toBeInstanceOf(UnexpectedError);
    }
  });

  it('should return an unexpected error when gateway fails', async () => {
    const order = makeOrder({ total: 120 });

    await inMemoryOrdersRepository.create(order);

    sut = new CreateCheckoutPaymentService(
      inMemoryPaymentsRepository,
      inMemoryOrdersRepository,
      failingPaymentGateway
    );

    const result = await sut.execute({
      orderId: order.id.toString(),
    });

    expect(result.isError()).toBe(true);
    expect(inMemoryPaymentsRepository.items).toHaveLength(0);

    if (result.isError()) {
      expect(result.value).toBeInstanceOf(UnexpectedError);
    }
  });

  it('should return a payment gateway error when provider request fails', async () => {
    const order = makeOrder({ total: 120 });
    const paymentGateway = {
      providerName: 'abacate_pay',
      async createCheckoutSession() {
        throw new PaymentGatewayError(
          'AbacatePay request failed'
        );
      },
    } satisfies PaymentGateway;

    await inMemoryOrdersRepository.create(order);

    sut = new CreateCheckoutPaymentService(
      inMemoryPaymentsRepository,
      inMemoryOrdersRepository,
      paymentGateway
    );

    const result = await sut.execute({
      orderId: order.id.toString(),
    });

    expect(result.isError()).toBe(true);
    expect(inMemoryPaymentsRepository.items).toHaveLength(0);

    if (result.isError()) {
      expect(result.value).toBeInstanceOf(PaymentGatewayError);
      expect(result.value.message).toBe(
        'AbacatePay request failed'
      );
    }
  });
});
