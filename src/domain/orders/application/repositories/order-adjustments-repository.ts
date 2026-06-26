import type { OrderAdjustment } from '../../enterprise/entities/order-adjustment';

export interface OrderAdjustmentsRepository {
  findById(id: string): Promise<OrderAdjustment | null>;
  findByPaymentId(paymentId: string): Promise<OrderAdjustment | null>;
  findManyByOrderId(orderId: string): Promise<OrderAdjustment[]>;
  create(orderAdjustment: OrderAdjustment): Promise<OrderAdjustment>;
  save(orderAdjustment: OrderAdjustment): Promise<OrderAdjustment>;
}
