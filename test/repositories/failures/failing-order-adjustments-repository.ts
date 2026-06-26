import type { OrderAdjustmentsRepository } from '../../../src/domain/orders/application/repositories/order-adjustments-repository';
import type { OrderAdjustment } from '../../../src/domain/orders/enterprise/entities/order-adjustment';

export class FailingOrderAdjustmentsRepository
  implements OrderAdjustmentsRepository
{
  async findById(_id: string): Promise<OrderAdjustment | null> {
    throw new Error('Unexpected repository error.');
  }

  async findByPaymentId(_paymentId: string): Promise<OrderAdjustment | null> {
    throw new Error('Unexpected repository error.');
  }

  async findManyByOrderId(_orderId: string): Promise<OrderAdjustment[]> {
    throw new Error('Unexpected repository error.');
  }

  async create(_orderAdjustment: OrderAdjustment): Promise<OrderAdjustment> {
    throw new Error('Unexpected repository error.');
  }

  async save(_orderAdjustment: OrderAdjustment): Promise<OrderAdjustment> {
    throw new Error('Unexpected repository error.');
  }
}
