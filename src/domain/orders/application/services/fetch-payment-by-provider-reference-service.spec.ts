import { beforeEach, describe, expect, it } from 'vitest';
import { makePayment } from '../../../../../test/factories/make-payment';
import { FailingPaymentsRepository } from '../../../../../test/repositories/failures/failing-payments-repository';
import { InMemoryPaymentsRepository } from '../../../../../test/repositories/in-memory-payments-repository';
import { UnexpectedError } from '../../../../core/errors/unexpected-error';
import { PaymentNotFoundError } from '../errors/payment-not-found-error';
import { FetchPaymentByProviderReferenceService } from './fetch-payment-by-provider-reference-service';

let inMemoryPaymentsRepository: InMemoryPaymentsRepository;
let failingPaymentsRepository: FailingPaymentsRepository;
let sut: FetchPaymentByProviderReferenceService;

describe('FetchPaymentByProviderReferenceService', () => {
  beforeEach(() => {
    inMemoryPaymentsRepository = new InMemoryPaymentsRepository();
    failingPaymentsRepository = new FailingPaymentsRepository();
    sut = new FetchPaymentByProviderReferenceService(
      inMemoryPaymentsRepository
    );
  });

  it('should fetch a payment by provider reference id', async () => {
    const payment = makePayment({
      providerName: 'stripe',
      providerReferenceId: 'payment-intent-1',
    });

    await inMemoryPaymentsRepository.create(payment);

    const result = await sut.execute({
      providerName: 'stripe',
      providerReferenceId: 'payment-intent-1',
    });

    expect(result.isSuccess()).toBe(true);

    if (result.isSuccess()) {
      expect(result.value.payment.id).toEqual(payment.id);
    }
  });

  it('should not fetch a payment when provider reference id does not exist', async () => {
    const result = await sut.execute({
      providerName: 'stripe',
      providerReferenceId: 'non-existing-provider-reference-id',
    });

    expect(result.isError()).toBe(true);

    if (result.isError()) {
      expect(result.value).toBeInstanceOf(PaymentNotFoundError);
    }
  });

  it('should return an unexpected error when something goes wrong', async () => {
    sut = new FetchPaymentByProviderReferenceService(failingPaymentsRepository);

    const result = await sut.execute({
      providerName: 'stripe',
      providerReferenceId: 'payment-intent-1',
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
