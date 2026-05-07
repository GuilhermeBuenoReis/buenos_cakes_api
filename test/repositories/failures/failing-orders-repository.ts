import type { PaginationParams } from '../../../src/core/repositories/pagination-params';
import type { OrdersRepository } from '../../../src/domain/orders/application/repositories/orders-repository';
import type { Order } from '../../../src/domain/orders/enterprise/entities/order';

export class FailingOrdersRepository implements OrdersRepository {
  async findById(_id: string): Promise<Order | null> {
    throw new Error('Unexpected repository error.');
  }

  async findManyByUserId(
    _userId: string,
    _params: PaginationParams
  ): Promise<Order[]> {
    throw new Error('Unexpected repository error.');
  }

  async findMany(_params: PaginationParams): Promise<Order[]> {
    throw new Error('Unexpected repository error.');
  }

  async create(_order: Order): Promise<Order> {
    throw new Error('Unexpected repository error.');
  }

  async save(_order: Order): Promise<Order> {
    throw new Error('Unexpected repository error.');
  }

  async delete(_order: Order): Promise<void> {
    throw new Error('Unexpected repository error.');
  }
}
