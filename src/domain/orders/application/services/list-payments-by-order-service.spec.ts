import { beforeEach, describe, expect, it } from 'vitest';
import { makePayment } from '../../../../../test/factories/make-payment';
import { FailingPaymentsRepository } from '../../../../../test/repositories/failures/failing-payments-repository';
import { InMemoryPaymentsRepository } from '../../../../../test/repositories/in-memory-payments-repository';
import { UniqueEntityID } from '../../../../core/entities/unique-entity-id';
import { UnexpectedError } from '../../../../core/errors/unexpected-error';
import { ListPaymentsByOrderService } from './list-payments-by-order-service';

let inMemoryPaymentsRepository: InMemoryPaymentsRepository;
let failingPaymentsRepository: FailingPaymentsRepository;
let sut: ListPaymentsByOrderService;

describe('ListPaymentsByOrderService', () => {
  beforeEach(() => {
    inMemoryPaymentsRepository = new InMemoryPaymentsRepository();
    failingPaymentsRepository = new FailingPaymentsRepository();
    sut = new ListPaymentsByOrderService(inMemoryPaymentsRepository);
  });

  it('should list only payments from the requested order', async () => {
    const orderId = new UniqueEntityID('order-1');
    const firstPayment = makePayment({ orderId });
    const secondPayment = makePayment({ orderId });
    const otherPayment = makePayment({
      orderId: new UniqueEntityID('order-2'),
    });

    await inMemoryPaymentsRepository.create(firstPayment);
    await inMemoryPaymentsRepository.create(secondPayment);
    await inMemoryPaymentsRepository.create(otherPayment);

    const result = await sut.execute({
      orderId: orderId.toString(),
    });

    expect(result.isSuccess()).toBe(true);

    if (result.isSuccess()) {
      expect(result.value.payments).toHaveLength(2);
      expect(result.value.payments.map((payment) => payment.id)).toEqual([
        firstPayment.id,
        secondPayment.id,
      ]);
    }
  });

  it('should return an unexpected error when something goes wrong', async () => {
    sut = new ListPaymentsByOrderService(failingPaymentsRepository);

    const result = await sut.execute({
      orderId: 'order-1',
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
