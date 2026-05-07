import type { OrderItemsRepository } from '../../../src/domain/orders/application/repositories/order-items-repository';
import type { OrderItem } from '../../../src/domain/orders/enterprise/entities/order-item';

export class FailingOrderItemsRepository implements OrderItemsRepository {
  async findById(_id: string): Promise<OrderItem | null> {
    throw new Error('Unexpected repository error.');
  }

  async findManyByOrderId(_orderId: string): Promise<OrderItem[]> {
    throw new Error('Unexpected repository error.');
  }

  async create(_orderItem: OrderItem): Promise<OrderItem> {
    throw new Error('Unexpected repository error.');
  }

  async save(_orderItem: OrderItem): Promise<OrderItem> {
    throw new Error('Unexpected repository error.');
  }

  async delete(_orderItem: OrderItem): Promise<void> {
    throw new Error('Unexpected repository error.');
  }
}
