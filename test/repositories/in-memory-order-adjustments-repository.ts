import type { OrderAdjustmentsRepository } from '../../src/domain/orders/application/repositories/order-adjustments-repository';
import type { OrderAdjustment } from '../../src/domain/orders/enterprise/entities/order-adjustment';

export class InMemoryOrderAdjustmentsRepository
  implements OrderAdjustmentsRepository
{
  public items: OrderAdjustment[] = [];

  async findById(id: string): Promise<OrderAdjustment | null> {
    const adjustment = this.items.find((item) => item.id.toString() === id);

    if (!adjustment) {
      return null;
    }

    return adjustment;
  }

  async findByPaymentId(paymentId: string): Promise<OrderAdjustment | null> {
    const adjustment = this.items.find(
      (item) => item.paymentId?.toString() === paymentId
    );

    if (!adjustment) {
      return null;
    }

    return adjustment;
  }

  async findManyByOrderId(orderId: string): Promise<OrderAdjustment[]> {
    return this.items.filter((item) => item.orderId.toString() === orderId);
  }

  async create(orderAdjustment: OrderAdjustment): Promise<OrderAdjustment> {
    this.items.push(orderAdjustment);

    return orderAdjustment;
  }

  async save(orderAdjustment: OrderAdjustment): Promise<OrderAdjustment> {
    const index = this.items.findIndex((item) =>
      item.id.equals(orderAdjustment.id)
    );

    this.items[index] = orderAdjustment;

    return orderAdjustment;
  }
}
