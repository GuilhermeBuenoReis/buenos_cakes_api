import { beforeEach, describe, expect, it } from 'vitest';
import { makeOrder } from '../../../../../test/factories/make-order';
import { FailingOrdersRepository } from '../../../../../test/repositories/failures/failing-orders-repository';
import { FailingPaymentsRepository } from '../../../../../test/repositories/failures/failing-payments-repository';
import { InMemoryOrdersRepository } from '../../../../../test/repositories/in-memory-orders-repository';
import { InMemoryPaymentsRepository } from '../../../../../test/repositories/in-memory-payments-repository';
import { UnexpectedError } from '../../../../core/errors/unexpected-error';
import {
  PaymentMethod,
  PaymentProvider,
} from '../../enterprise/entities/payment';
import { OrderNotFoundError } from '../errors/order-not-found-error';
import { CreatePaymentService } from './create-payment-service';

let inMemoryPaymentsRepository: InMemoryPaymentsRepository;
let inMemoryOrdersRepository: InMemoryOrdersRepository;
let failingPaymentsRepository: FailingPaymentsRepository;
let failingOrdersRepository: FailingOrdersRepository;
let sut: CreatePaymentService;

describe('CreatePaymentService', () => {
  beforeEach(() => {
    inMemoryPaymentsRepository = new InMemoryPaymentsRepository();
    inMemoryOrdersRepository = new InMemoryOrdersRepository();
    failingPaymentsRepository = new FailingPaymentsRepository();
    failingOrdersRepository = new FailingOrdersRepository();
    sut = new CreatePaymentService(
      inMemoryPaymentsRepository,
      inMemoryOrdersRepository
    );
  });

  it('should create a payment', async () => {
    const order = makeOrder({ total: 120 });

    await inMemoryOrdersRepository.create(order);

    const result = await sut.execute({
      orderId: order.id.toString(),
      method: PaymentMethod.PIX,
      amount: 120,
      providerName: 'stripe',
      providerReferenceId: 'payment-intent-1',
      providerSessionId: 'checkout-session-1',
      providerClientSecret: 'client-secret-1',
      pixQrCode: 'pix-code',
      pixQrCodeUrl: 'https://example.com/pix.png',
    });

    expect(result.isSuccess()).toBe(true);
    expect(inMemoryPaymentsRepository.items).toHaveLength(1);

    if (result.isSuccess()) {
      expect(result.value.payment.orderId.toString()).toBe(order.id.toString());
      expect(result.value.payment.method).toBe(PaymentMethod.PIX);
      expect(result.value.payment.provider).toBe(PaymentProvider.EXTERNAL);
      expect(result.value.payment.currency).toBe('brl');
      expect(result.value.payment.amount).toBe(120);
      expect(result.value.payment.providerName).toBe('stripe');
      expect(result.value.payment.providerReferenceId).toBe('payment-intent-1');
      expect(result.value.payment.providerSessionId).toBe('checkout-session-1');
      expect(result.value.payment.providerClientSecret).toBe('client-secret-1');
      expect(result.value.payment.pixQrCode).toBe('pix-code');
      expect(result.value.payment.pixQrCodeUrl).toBe(
        'https://example.com/pix.png'
      );
    }
  });

  it('should not create a payment when order does not exist', async () => {
    const result = await sut.execute({
      orderId: 'non-existing-order-id',
      method: PaymentMethod.CASH,
      amount: 120,
    });

    expect(result.isError()).toBe(true);

    if (result.isError()) {
      expect(result.value).toBeInstanceOf(OrderNotFoundError);
    }
  });

  it('should return an unexpected error when orders repository fails', async () => {
    sut = new CreatePaymentService(
      inMemoryPaymentsRepository,
      failingOrdersRepository
    );

    const result = await sut.execute({
      orderId: 'order-1',
      method: PaymentMethod.CASH,
      amount: 120,
    });

    expect(result.isError()).toBe(true);

    if (result.isError()) {
      expect(result.value).toBeInstanceOf(UnexpectedError);
      expect(result.value.message).toBe(
        'Something went wrong. Please try again later.'
      );
    }
  });

  it('should return an unexpected error when payments repository fails', async () => {
    const order = makeOrder({ total: 120 });

    await inMemoryOrdersRepository.create(order);

    sut = new CreatePaymentService(
      failingPaymentsRepository,
      inMemoryOrdersRepository
    );

    const result = await sut.execute({
      orderId: order.id.toString(),
      method: PaymentMethod.CASH,
      amount: 120,
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
