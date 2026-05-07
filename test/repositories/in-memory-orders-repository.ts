import type { PaginationParams } from '../../src/core/repositories/pagination-params';
import type { OrdersRepository } from '../../src/domain/orders/application/repositories/orders-repository';
import type { Order } from '../../src/domain/orders/enterprise/entities/order';

export class InMemoryOrdersRepository implements OrdersRepository {
  public items: Order[] = [];

  async findById(id: string): Promise<Order | null> {
    const order = this.items.find((item) => item.id.toString() === id);

    if (!order) {
      return null;
    }

    return order;
  }

  async findManyByUserId(
    userId: string,
    { page }: PaginationParams
  ): Promise<Order[]> {
    const orders = this.items.filter((item) => item.userId.toString() === userId);

    return orders.slice((page - 1) * 20, page * 20);
  }

  async findMany({ page }: PaginationParams): Promise<Order[]> {
    return this.items.slice((page - 1) * 20, page * 20);
  }

  async create(order: Order): Promise<Order> {
    this.items.push(order);

    return order;
  }

  async save(order: Order): Promise<Order> {
    const orderIndex = this.items.findIndex((item) => item.id.equals(order.id));

    this.items[orderIndex] = order;

    return order;
  }

  async delete(order: Order): Promise<void> {
    const orderIndex = this.items.findIndex((item) => item.id.equals(order.id));

    this.items.splice(orderIndex, 1);
  }
}
