import { beforeEach, describe, expect, it } from 'vitest';
import { makeOrderItem } from '../../../../../test/factories/make-order-item';
import { FailingOrderItemsRepository } from '../../../../../test/repositories/failures/failing-order-items-repository';
import { InMemoryOrderItemsRepository } from '../../../../../test/repositories/in-memory-order-items-repository';
import { UniqueEntityID } from '../../../../core/entities/unique-entity-id';
import { UnexpectedError } from '../../../../core/errors/unexpected-error';
import { ListOrderItemsByOrderService } from './list-order-items-by-order-service';

let inMemoryOrderItemsRepository: InMemoryOrderItemsRepository;
let failingOrderItemsRepository: FailingOrderItemsRepository;
let sut: ListOrderItemsByOrderService;

describe('ListOrderItemsByOrderService', () => {
  beforeEach(() => {
    inMemoryOrderItemsRepository = new InMemoryOrderItemsRepository();
    failingOrderItemsRepository = new FailingOrderItemsRepository();
    sut = new ListOrderItemsByOrderService(inMemoryOrderItemsRepository);
  });

  it('should list only order items from the requested order', async () => {
    const orderId = new UniqueEntityID('order-1');

    const firstOrderItem = makeOrderItem({ orderId });
    const secondOrderItem = makeOrderItem({ orderId });
    const otherOrderItem = makeOrderItem({
      orderId: new UniqueEntityID('order-2'),
    });

    await inMemoryOrderItemsRepository.create(firstOrderItem);
    await inMemoryOrderItemsRepository.create(secondOrderItem);
    await inMemoryOrderItemsRepository.create(otherOrderItem);

    const result = await sut.execute({
      orderId: orderId.toString(),
    });

    expect(result.isSuccess()).toBe(true);

    if (result.isSuccess()) {
      expect(result.value.orderItems).toHaveLength(2);
      expect(result.value.orderItems.map((orderItem) => orderItem.id)).toEqual([
        firstOrderItem.id,
        secondOrderItem.id,
      ]);
    }
  });

  it('should return an unexpected error when something goes wrong', async () => {
    sut = new ListOrderItemsByOrderService(failingOrderItemsRepository);

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
