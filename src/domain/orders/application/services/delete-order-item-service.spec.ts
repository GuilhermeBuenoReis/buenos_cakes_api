import { beforeEach, describe, expect, it } from 'vitest';
import { makeOrderItem } from '../../../../../test/factories/make-order-item';
import { FailingOrderItemsRepository } from '../../../../../test/repositories/failures/failing-order-items-repository';
import { InMemoryOrderItemsRepository } from '../../../../../test/repositories/in-memory-order-items-repository';
import { UnexpectedError } from '../../../../core/errors/unexpected-error';
import { OrderItemNotFoundError } from '../errors/order-item-not-found-error';
import { DeleteOrderItemService } from './delete-order-item-service';

let inMemoryOrderItemsRepository: InMemoryOrderItemsRepository;
let failingOrderItemsRepository: FailingOrderItemsRepository;
let sut: DeleteOrderItemService;

describe('DeleteOrderItemService', () => {
  beforeEach(() => {
    inMemoryOrderItemsRepository = new InMemoryOrderItemsRepository();
    failingOrderItemsRepository = new FailingOrderItemsRepository();
    sut = new DeleteOrderItemService(inMemoryOrderItemsRepository);
  });

  it('should delete an order item', async () => {
    const orderItem = makeOrderItem();

    await inMemoryOrderItemsRepository.create(orderItem);

    const result = await sut.execute({
      orderItemId: orderItem.id.toString(),
    });

    expect(result.isSuccess()).toBe(true);
    expect(inMemoryOrderItemsRepository.items).toHaveLength(0);

    if (result.isSuccess()) {
      expect(result.value.message).toBe('Order item deleted successfully.');
    }
  });

  it('should not delete an order item when it does not exist', async () => {
    const result = await sut.execute({
      orderItemId: 'non-existing-order-item-id',
    });

    expect(result.isError()).toBe(true);

    if (result.isError()) {
      expect(result.value).toBeInstanceOf(OrderItemNotFoundError);
    }
  });

  it('should return an unexpected error when something goes wrong', async () => {
    sut = new DeleteOrderItemService(failingOrderItemsRepository);

    const result = await sut.execute({
      orderItemId: 'order-item-1',
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
