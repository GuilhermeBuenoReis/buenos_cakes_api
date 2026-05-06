import { type Either, error, success } from '../../../../core/either';
import { UnexpectedError } from '../../../../core/errors/unexpected-error';
import type { Order } from '../../enterprise/entities/order';
import { OrderNotFoundError } from '../errors/order-not-found-error';
import type { OrdersRepository } from '../repositories/orders-repository';

export interface FetchOrderByIdServiceRequest {
  orderId: string;
}

export type FetchOrderByIdServiceResponse = Either<
  OrderNotFoundError | UnexpectedError,
  {
    order: Order;
  }
>;

export class FetchOrderByIdService {
  constructor(private ordersRepository: OrdersRepository) {}

  async execute({
    orderId,
  }: FetchOrderByIdServiceRequest): Promise<FetchOrderByIdServiceResponse> {
    try {
      const order = await this.ordersRepository.findById(orderId);

      if (!order) {
        return error(new OrderNotFoundError(orderId));
      }

      return success({
        order,
      });
    } catch {
      return error(new UnexpectedError());
    }
  }
}
