import type { OrderItem } from '../../enterprise/entities/order-item';

export interface OrderItemsRepository {
  findById(id: string): Promise<OrderItem | null>;
  findManyByOrderId(orderId: string): Promise<OrderItem[]>;
  create(orderItem: OrderItem): Promise<OrderItem>;
  save(orderItem: OrderItem): Promise<OrderItem>;
  delete(orderItem: OrderItem): Promise<void>;
}
