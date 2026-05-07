import { beforeEach, describe, expect, it } from 'vitest';
import { makePayment } from '../../../../../test/factories/make-payment';
import { FailingPaymentsRepository } from '../../../../../test/repositories/failures/failing-payments-repository';
import { InMemoryPaymentsRepository } from '../../../../../test/repositories/in-memory-payments-repository';
import { UnexpectedError } from '../../../../core/errors/unexpected-error';
import { PaymentNotFoundError } from '../errors/payment-not-found-error';
import { DeletePaymentService } from './delete-payment-service';

let inMemoryPaymentsRepository: InMemoryPaymentsRepository;
let failingPaymentsRepository: FailingPaymentsRepository;
let sut: DeletePaymentService;

describe('DeletePaymentService', () => {
  beforeEach(() => {
    inMemoryPaymentsRepository = new InMemoryPaymentsRepository();
    failingPaymentsRepository = new FailingPaymentsRepository();
    sut = new DeletePaymentService(inMemoryPaymentsRepository);
  });

  it('should delete a payment', async () => {
    const payment = makePayment();

    await inMemoryPaymentsRepository.create(payment);

    const result = await sut.execute({
      paymentId: payment.id.toString(),
    });

    expect(result.isSuccess()).toBe(true);
    expect(inMemoryPaymentsRepository.items).toHaveLength(0);

    if (result.isSuccess()) {
      expect(result.value.message).toBe('Payment deleted successfully.');
    }
  });

  it('should not delete a payment when it does not exist', async () => {
    const result = await sut.execute({
      paymentId: 'non-existing-payment-id',
    });

    expect(result.isError()).toBe(true);

    if (result.isError()) {
      expect(result.value).toBeInstanceOf(PaymentNotFoundError);
    }
  });

  it('should return an unexpected error when something goes wrong', async () => {
    sut = new DeletePaymentService(failingPaymentsRepository);

    const result = await sut.execute({
      paymentId: 'payment-1',
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
