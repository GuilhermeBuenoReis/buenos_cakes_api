import type { PaginationParams } from '../../../../core/repositories/pagination-params';
import type { Order } from '../../enterprise/entities/order';

export interface OrdersRepository {
  findById(id: string): Promise<Order | null>;
  findManyByUserId(
    userId: string,
    params: PaginationParams
  ): Promise<Order[]>;
  findMany(params: PaginationParams): Promise<Order[]>;
  create(order: Order): Promise<Order>;
  save(order: Order): Promise<Order>;
  delete(order: Order): Promise<void>;
}
