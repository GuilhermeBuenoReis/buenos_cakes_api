import type { OrderItemsRepository } from '../../src/domain/orders/application/repositories/order-items-repository';
import type { OrderItem } from '../../src/domain/orders/enterprise/entities/order-item';

export class InMemoryOrderItemsRepository implements OrderItemsRepository {
  public items: OrderItem[] = [];

  async findById(id: string): Promise<OrderItem | null> {
    const orderItem = this.items.find((item) => item.id.toString() === id);

    if (!orderItem) {
      return null;
    }

    return orderItem;
  }

  async findManyByOrderId(orderId: string): Promise<OrderItem[]> {
    return this.items.filter((item) => item.orderId.toString() === orderId);
  }

  async create(orderItem: OrderItem): Promise<OrderItem> {
    this.items.push(orderItem);

    return orderItem;
  }

  async save(orderItem: OrderItem): Promise<OrderItem> {
    const orderItemIndex = this.items.findIndex((item) =>
      item.id.equals(orderItem.id)
    );

    this.items[orderItemIndex] = orderItem;

    return orderItem;
  }

  async delete(orderItem: OrderItem): Promise<void> {
    const orderItemIndex = this.items.findIndex((item) =>
      item.id.equals(orderItem.id)
    );

    this.items.splice(orderItemIndex, 1);
  }
}
