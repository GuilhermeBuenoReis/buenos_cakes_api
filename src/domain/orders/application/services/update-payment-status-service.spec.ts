import { beforeEach, describe, expect, it } from 'vitest';
import { makePayment } from '../../../../../test/factories/make-payment';
import { FailingPaymentsRepository } from '../../../../../test/repositories/failures/failing-payments-repository';
import { InMemoryPaymentsRepository } from '../../../../../test/repositories/in-memory-payments-repository';
import { UnexpectedError } from '../../../../core/errors/unexpected-error';
import { PaymentStatus } from '../../enterprise/entities/payment';
import { PaymentNotFoundError } from '../errors/payment-not-found-error';
import { UpdatePaymentStatusService } from './update-payment-status-service';

let inMemoryPaymentsRepository: InMemoryPaymentsRepository;
let failingPaymentsRepository: FailingPaymentsRepository;
let sut: UpdatePaymentStatusService;

describe('UpdatePaymentStatusService', () => {
  beforeEach(() => {
    inMemoryPaymentsRepository = new InMemoryPaymentsRepository();
    failingPaymentsRepository = new FailingPaymentsRepository();
    sut = new UpdatePaymentStatusService(inMemoryPaymentsRepository);
  });

  it('should mark a payment as processing', async () => {
    const payment = makePayment();

    await inMemoryPaymentsRepository.create(payment);

    const result = await sut.execute({
      paymentId: payment.id.toString(),
      status: PaymentStatus.PROCESSING,
      providerStatus: 'processing',
    });

    expect(result.isSuccess()).toBe(true);

    if (result.isSuccess()) {
      expect(result.value.payment.status).toBe(PaymentStatus.PROCESSING);
      expect(result.value.payment.providerStatus).toBe('processing');
      expect(result.value.payment.failureReason).toBeNull();
    }
  });

  it('should mark a payment as paid', async () => {
    const payment = makePayment();
    const paidAt = new Date('2026-01-01T10:00:00.000Z');

    await inMemoryPaymentsRepository.create(payment);

    const result = await sut.execute({
      paymentId: payment.id.toString(),
      status: PaymentStatus.PAID,
      providerStatus: 'succeeded',
      occurredAt: paidAt,
    });

    expect(result.isSuccess()).toBe(true);

    if (result.isSuccess()) {
      expect(result.value.payment.status).toBe(PaymentStatus.PAID);
      expect(result.value.payment.providerStatus).toBe('succeeded');
      expect(result.value.payment.paidAt).toEqual(paidAt);
      expect(result.value.payment.failureReason).toBeNull();
    }
  });

  it('should mark a payment as failed', async () => {
    const payment = makePayment();

    await inMemoryPaymentsRepository.create(payment);

    const result = await sut.execute({
      paymentId: payment.id.toString(),
      status: PaymentStatus.FAILED,
      providerStatus: 'payment_failed',
      failureReason: 'Insufficient funds.',
    });

    expect(result.isSuccess()).toBe(true);

    if (result.isSuccess()) {
      expect(result.value.payment.status).toBe(PaymentStatus.FAILED);
      expect(result.value.payment.providerStatus).toBe('payment_failed');
      expect(result.value.payment.failureReason).toBe('Insufficient funds.');
    }
  });

  it('should mark a payment as canceled', async () => {
    const payment = makePayment();
    const canceledAt = new Date('2026-01-01T10:00:00.000Z');

    await inMemoryPaymentsRepository.create(payment);

    const result = await sut.execute({
      paymentId: payment.id.toString(),
      status: PaymentStatus.CANCELED,
      providerStatus: 'canceled',
      occurredAt: canceledAt,
    });

    expect(result.isSuccess()).toBe(true);

    if (result.isSuccess()) {
      expect(result.value.payment.status).toBe(PaymentStatus.CANCELED);
      expect(result.value.payment.providerStatus).toBe('canceled');
      expect(result.value.payment.canceledAt).toEqual(canceledAt);
    }
  });

  it('should mark a payment as refunded', async () => {
    const payment = makePayment();
    const refundedAt = new Date('2026-01-01T10:00:00.000Z');

    await inMemoryPaymentsRepository.create(payment);

    const result = await sut.execute({
      paymentId: payment.id.toString(),
      status: PaymentStatus.REFUNDED,
      providerStatus: 'refunded',
      occurredAt: refundedAt,
    });

    expect(result.isSuccess()).toBe(true);

    if (result.isSuccess()) {
      expect(result.value.payment.status).toBe(PaymentStatus.REFUNDED);
      expect(result.value.payment.providerStatus).toBe('refunded');
      expect(result.value.payment.refundedAt).toEqual(refundedAt);
    }
  });

  it('should not update status when payment does not exist', async () => {
    const result = await sut.execute({
      paymentId: 'non-existing-payment-id',
      status: PaymentStatus.PAID,
    });

    expect(result.isError()).toBe(true);

    if (result.isError()) {
      expect(result.value).toBeInstanceOf(PaymentNotFoundError);
    }
  });

  it('should return an unexpected error when something goes wrong', async () => {
    sut = new UpdatePaymentStatusService(failingPaymentsRepository);

    const result = await sut.execute({
      paymentId: 'payment-1',
      status: PaymentStatus.PAID,
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
