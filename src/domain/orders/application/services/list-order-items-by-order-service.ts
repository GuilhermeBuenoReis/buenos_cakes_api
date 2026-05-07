import { type Either, error, success } from '../../../../core/either';
import { UnexpectedError } from '../../../../core/errors/unexpected-error';
import type { OrderItem } from '../../enterprise/entities/order-item';
import type { OrderItemsRepository } from '../repositories/order-items-repository';

export interface ListOrderItemsByOrderServiceRequest {
  orderId: string;
}

export type ListOrderItemsByOrderServiceResponse = Either<
  UnexpectedError,
  {
    orderItems: OrderItem[];
  }
>;

export class ListOrderItemsByOrderService {
  constructor(private orderItemsRepository: OrderItemsRepository) {}

  async execute({
    orderId,
  }: ListOrderItemsByOrderServiceRequest): Promise<ListOrderItemsByOrderServiceResponse> {
    try {
      const orderItems =
        await this.orderItemsRepository.findManyByOrderId(orderId);

      return success({
        orderItems,
      });
    } catch {
      return error(new UnexpectedError());
    }
  }
}
