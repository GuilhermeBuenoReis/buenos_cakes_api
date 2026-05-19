import { type Either, error, success } from '../../../../core/either';
import { UnexpectedError } from '../../../../core/errors/unexpected-error';
import type { Order, OrderStatus } from '../../enterprise/entities/order';
import { OrderNotFoundError } from '../errors/order-not-found-error';
import type { OrdersRepository } from '../repositories/orders-repository';

export interface UpdateOrderStatusServiceRequest {
  orderId: string;
  status: OrderStatus;
}

export type UpdateOrderStatusServiceResponse = Either<
  OrderNotFoundError | UnexpectedError,
  {
    order: Order;
  }
>;

export class UpdateOrderStatusService {
  constructor(private ordersRepository: OrdersRepository) {}

  async execute({
    orderId,
    status,
  }: UpdateOrderStatusServiceRequest): Promise<UpdateOrderStatusServiceResponse> {
    try {
      const order = await this.ordersRepository.findById(orderId);

      if (!order) {
        return error(new OrderNotFoundError(orderId));
      }

      order.status = status;

      await this.ordersRepository.save(order);

      return success({
        order,
      });
    } catch {
      return error(new UnexpectedError());
    }
  }
}
