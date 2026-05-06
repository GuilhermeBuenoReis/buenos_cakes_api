import { type Either, error, success } from '../../../../core/either';
import { UnexpectedError } from '../../../../core/errors/unexpected-error';
import { OrderNotFoundError } from '../errors/order-not-found-error';
import type { OrdersRepository } from '../repositories/orders-repository';

export interface DeleteOrderServiceRequest {
  orderId: string;
}

export type DeleteOrderServiceResponse = Either<
  OrderNotFoundError | UnexpectedError,
  {
    message: string;
  }
>;

export class DeleteOrderService {
  constructor(private ordersRepository: OrdersRepository) {}

  async execute({
    orderId,
  }: DeleteOrderServiceRequest): Promise<DeleteOrderServiceResponse> {
    try {
      const order = await this.ordersRepository.findById(orderId);

      if (!order) {
        return error(new OrderNotFoundError(orderId));
      }

      await this.ordersRepository.delete(order);

      return success({
        message: 'Order deleted successfully.',
      });
    } catch {
      return error(new UnexpectedError());
    }
  }
}
