import { beforeEach, describe, expect, it } from 'vitest';
import { makeOrder } from '../../../../../test/factories/make-order';
import { FailingOrdersRepository } from '../../../../../test/repositories/failures/failing-orders-repository';
import { InMemoryOrdersRepository } from '../../../../../test/repositories/in-memory-orders-repository';
import { UnexpectedError } from '../../../../core/errors/unexpected-error';
import { OrderStatus } from '../../enterprise/entities/order';
import { OrderNotFoundError } from '../errors/order-not-found-error';
import { UpdateOrderStatusService } from './update-order-status-service';

let inMemoryOrdersRepository: InMemoryOrdersRepository;
let failingOrdersRepository: FailingOrdersRepository;
let sut: UpdateOrderStatusService;

describe('UpdateOrderStatusService', () => {
  beforeEach(() => {
    inMemoryOrdersRepository = new InMemoryOrdersRepository();
    failingOrdersRepository = new FailingOrdersRepository();
    sut = new UpdateOrderStatusService(inMemoryOrdersRepository);
  });

  it('should update an order status', async () => {
    const order = makeOrder({
      status: OrderStatus.PENDING,
    });

    await inMemoryOrdersRepository.create(order);

    const result = await sut.execute({
      orderId: order.id.toString(),
      status: OrderStatus.CONFIRMED,
    });

    expect(result.isSuccess()).toBe(true);

    if (result.isSuccess()) {
      expect(result.value.order.status).toBe(OrderStatus.CONFIRMED);
      expect(result.value.order.updatedAt).toBeInstanceOf(Date);
    }
  });

  it('should not update an order status when it does not exist', async () => {
    const result = await sut.execute({
      orderId: 'non-existing-order-id',
      status: OrderStatus.CONFIRMED,
    });

    expect(result.isError()).toBe(true);

    if (result.isError()) {
      expect(result.value).toBeInstanceOf(OrderNotFoundError);
    }
  });

  it('should return an unexpected error when repository fails', async () => {
    sut = new UpdateOrderStatusService(failingOrdersRepository);

    const result = await sut.execute({
      orderId: 'order-1',
      status: OrderStatus.CONFIRMED,
    });

    expect(result.isError()).toBe(true);

    if (result.isError()) {
      expect(result.value).toBeInstanceOf(UnexpectedError);
    }
  });
});
