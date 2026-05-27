import { beforeEach, describe, expect, it } from 'vitest';
import { makePayment } from '../../../../../test/factories/make-payment';
import { FailingPaymentsRepository } from '../../../../../test/repositories/failures/failing-payments-repository';
import { InMemoryPaymentsRepository } from '../../../../../test/repositories/in-memory-payments-repository';
import { UnexpectedError } from '../../../../core/errors/unexpected-error';
import { PaymentStatus } from '../../enterprise/entities/payment';
import { PaymentNotFoundError } from '../errors/payment-not-found-error';
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
});
