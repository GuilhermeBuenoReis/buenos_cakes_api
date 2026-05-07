import { type Either, error, success } from '../../../../core/either';
import { UnexpectedError } from '../../../../core/errors/unexpected-error';
import { OrderItemNotFoundError } from '../errors/order-item-not-found-error';
import type { OrderItemsRepository } from '../repositories/order-items-repository';

export interface DeleteOrderItemServiceRequest {
  orderItemId: string;
}

export type DeleteOrderItemServiceResponse = Either<
  OrderItemNotFoundError | UnexpectedError,
  {
    message: string;
  }
>;

export class DeleteOrderItemService {
  constructor(private orderItemsRepository: OrderItemsRepository) {}

  async execute({
    orderItemId,
  }: DeleteOrderItemServiceRequest): Promise<DeleteOrderItemServiceResponse> {
    try {
      const orderItem = await this.orderItemsRepository.findById(orderItemId);

      if (!orderItem) {
        return error(new OrderItemNotFoundError(orderItemId));
      }

      await this.orderItemsRepository.delete(orderItem);

      return success({
        message: 'Order item deleted successfully.',
      });
    } catch {
      return error(new UnexpectedError());
    }
  }
}
