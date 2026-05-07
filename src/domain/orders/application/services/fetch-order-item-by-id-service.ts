import { type Either, error, success } from '../../../../core/either';
import { UnexpectedError } from '../../../../core/errors/unexpected-error';
import type { OrderItem } from '../../enterprise/entities/order-item';
import { OrderItemNotFoundError } from '../errors/order-item-not-found-error';
import type { OrderItemsRepository } from '../repositories/order-items-repository';

export interface FetchOrderItemByIdServiceRequest {
  orderItemId: string;
}

export type FetchOrderItemByIdServiceResponse = Either<
  OrderItemNotFoundError | UnexpectedError,
  {
    orderItem: OrderItem;
  }
>;

export class FetchOrderItemByIdService {
  constructor(private orderItemsRepository: OrderItemsRepository) {}

  async execute({
    orderItemId,
  }: FetchOrderItemByIdServiceRequest): Promise<FetchOrderItemByIdServiceResponse> {
    try {
      const orderItem = await this.orderItemsRepository.findById(orderItemId);

      if (!orderItem) {
        return error(new OrderItemNotFoundError(orderItemId));
      }

      return success({
        orderItem,
      });
    } catch {
      return error(new UnexpectedError());
    }
  }
}
