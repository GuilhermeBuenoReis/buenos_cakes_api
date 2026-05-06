import { beforeEach, describe, expect, it } from 'vitest';
import { makeOrder } from '../../../../../test/factories/make-order';
import { FailingOrdersRepository } from '../../../../../test/repositories/failures/failing-orders-repository';
import { InMemoryOrdersRepository } from '../../../../../test/repositories/in-memory-orders-repository';
import { UnexpectedError } from '../../../../core/errors/unexpected-error';
import { OrderNotFoundError } from '../errors/order-not-found-error';
import { DeleteOrderService } from './delete-order-service';

let inMemoryOrdersRepository: InMemoryOrdersRepository;
let failingOrdersRepository: FailingOrdersRepository;
let sut: DeleteOrderService;

describe('DeleteOrderService', () => {
  beforeEach(() => {
    inMemoryOrdersRepository = new InMemoryOrdersRepository();
    failingOrdersRepository = new FailingOrdersRepository();
    sut = new DeleteOrderService(inMemoryOrdersRepository);
  });

  it('should delete an order', async () => {
    const order = makeOrder();

    await inMemoryOrdersRepository.create(order);

    const result = await sut.execute({
      orderId: order.id.toString(),
    });

    expect(result.isSuccess()).toBe(true);
    expect(inMemoryOrdersRepository.items).toHaveLength(0);
  });

  it('should not delete an order when it does not exist', async () => {
    const result = await sut.execute({
      orderId: 'non-existing-order-id',
    });

    expect(result.isError()).toBe(true);

    if (result.isError()) {
      expect(result.value).toBeInstanceOf(OrderNotFoundError);
    }
  });

  it('should return an unexpected error when repository fails', async () => {
    sut = new DeleteOrderService(failingOrdersRepository);

    const result = await sut.execute({
      orderId: 'order-1',
    });

    expect(result.isError()).toBe(true);

    if (result.isError()) {
      expect(result.value).toBeInstanceOf(UnexpectedError);
    }
  });
});
