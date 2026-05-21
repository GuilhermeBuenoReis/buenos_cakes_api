import { beforeEach, describe, expect, it } from 'vitest';
import { makePayment } from '../../../../../test/factories/make-payment';
import { FailingPaymentsRepository } from '../../../../../test/repositories/failures/failing-payments-repository';
import { InMemoryPaymentsRepository } from '../../../../../test/repositories/in-memory-payments-repository';
import { UnexpectedError } from '../../../../core/errors/unexpected-error';
import {
  PaymentMethod,
  PaymentProvider,
} from '../../enterprise/entities/payment';
import { PaymentNotFoundError } from '../errors/payment-not-found-error';
import { UpdatePaymentService } from './update-payment-service';

let inMemoryPaymentsRepository: InMemoryPaymentsRepository;
let failingPaymentsRepository: FailingPaymentsRepository;
let sut: UpdatePaymentService;

describe('UpdatePaymentService', () => {
  beforeEach(() => {
    inMemoryPaymentsRepository = new InMemoryPaymentsRepository();
    failingPaymentsRepository = new FailingPaymentsRepository();
    sut = new UpdatePaymentService(inMemoryPaymentsRepository);
  });

  it('should update a payment', async () => {
    const payment = makePayment();
    const expiresAt = new Date('2026-01-01T10:00:00.000Z');

    await inMemoryPaymentsRepository.create(payment);

    const result = await sut.execute({
      paymentId: payment.id.toString(),
      method: PaymentMethod.CREDIT_CARD,
      provider: PaymentProvider.EXTERNAL,
      amount: 150,
      currency: 'usd',
      providerName: 'pagarme',
      providerReferenceId: 'provider-reference-1',
      providerSessionId: 'provider-session-1',
      providerCustomerId: 'provider-customer-1',
      providerPaymentMethodId: 'provider-method-1',
      providerClientSecret: 'client-secret-1',
      providerStatus: 'requires_payment_method',
      pixQrCode: null,
      pixQrCodeUrl: null,
      expiresAt,
    });

    expect(result.isSuccess()).toBe(true);

    if (result.isSuccess()) {
      expect(result.value.payment.method).toBe(PaymentMethod.CREDIT_CARD);
      expect(result.value.payment.provider).toBe(PaymentProvider.EXTERNAL);
      expect(result.value.payment.amount).toBe(150);
      expect(result.value.payment.currency).toBe('usd');
      expect(result.value.payment.providerName).toBe('pagarme');
      expect(result.value.payment.providerReferenceId).toBe(
        'provider-reference-1'
      );
      expect(result.value.payment.providerSessionId).toBe('provider-session-1');
      expect(result.value.payment.providerCustomerId).toBe(
        'provider-customer-1'
      );
      expect(result.value.payment.providerPaymentMethodId).toBe(
        'provider-method-1'
      );
      expect(result.value.payment.providerClientSecret).toBe('client-secret-1');
      expect(result.value.payment.providerStatus).toBe(
        'requires_payment_method'
      );
      expect(result.value.payment.pixQrCode).toBeNull();
      expect(result.value.payment.pixQrCodeUrl).toBeNull();
      expect(result.value.payment.expiresAt).toEqual(expiresAt);
      expect(result.value.payment.updatedAt).toBeInstanceOf(Date);
    }
  });

  it('should not update a payment when it does not exist', async () => {
    const result = await sut.execute({
      paymentId: 'non-existing-payment-id',
      amount: 150,
    });

    expect(result.isError()).toBe(true);

    if (result.isError()) {
      expect(result.value).toBeInstanceOf(PaymentNotFoundError);
    }
  });

  it('should return an unexpected error when something goes wrong', async () => {
    sut = new UpdatePaymentService(failingPaymentsRepository);

    const result = await sut.execute({
      paymentId: 'payment-1',
      amount: 150,
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
