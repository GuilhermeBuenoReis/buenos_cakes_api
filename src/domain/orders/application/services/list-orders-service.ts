import { type Either, error, success } from '../../../../core/either';
import { UnexpectedError } from '../../../../core/errors/unexpected-error';
import type { Order } from '../../enterprise/entities/order';
import type { OrdersRepository } from '../repositories/orders-repository';

export interface ListOrdersServiceRequest {
  page: number;
}

export type ListOrdersServiceResponse = Either<
  UnexpectedError,
  {
    orders: Order[];
  }
>;

export class ListOrdersService {
  constructor(private ordersRepository: OrdersRepository) {}

  async execute({
    page,
  }: ListOrdersServiceRequest): Promise<ListOrdersServiceResponse> {
    try {
      const orders = await this.ordersRepository.findMany({
        page,
      });

      return success({
        orders,
      });
    } catch {
      return error(new UnexpectedError());
    }
  }
}
