import { eq } from 'drizzle-orm';

import type { OrderAdjustmentsRepository } from '@/domain/orders/application/repositories/order-adjustments-repository';
import type { OrderAdjustment } from '@/domain/orders/enterprise/entities/order-adjustment';
import { OrderAdjustmentPresenter } from '@/infra/presenters/order-adjustment-presenter';
import { db } from '..';
import { orderAdjustments } from '../schema/order-adjustments';

export class DrizzleOrderAdjustmentsRepository
  implements OrderAdjustmentsRepository
{
  async findById(id: string): Promise<OrderAdjustment | null> {
    const orderAdjustment = await db.query.orderAdjustments.findFirst({
      where: eq(orderAdjustments.id, id),
    });

    if (!orderAdjustment) {
      return null;
    }

    return OrderAdjustmentPresenter.toDomain(orderAdjustment);
  }

  async findByPaymentId(paymentId: string): Promise<OrderAdjustment | null> {
    const orderAdjustment = await db.query.orderAdjustments.findFirst({
      where: eq(orderAdjustments.paymentId, paymentId),
    });

    if (!orderAdjustment) {
      return null;
    }

    return OrderAdjustmentPresenter.toDomain(orderAdjustment);
  }

  async findManyByOrderId(orderId: string): Promise<OrderAdjustment[]> {
    const orderOrderAdjustments = await db.query.orderAdjustments.findMany({
      where: eq(orderAdjustments.orderId, orderId),
    });

    return orderOrderAdjustments.map(OrderAdjustmentPresenter.toDomain);
  }

  async create(orderAdjustment: OrderAdjustment): Promise<OrderAdjustment> {
    const [created] = await db
      .insert(orderAdjustments)
      .values({
        id: orderAdjustment.id.toString(),
        orderId: orderAdjustment.orderId.toString(),
        requestedByUserId: orderAdjustment.requestedByUserId.toString(),
        type: orderAdjustment.type,
        status: orderAdjustment.status,
        previousTotal: orderAdjustment.previousTotal,
        newTotal: orderAdjustment.newTotal,
        difference: orderAdjustment.difference,
        paymentId: orderAdjustment.paymentId?.toString() ?? null,
        operation: orderAdjustment.operation,
        reason: orderAdjustment.reason,
        createdAt: orderAdjustment.createdAt,
        confirmedAt: orderAdjustment.confirmedAt,
        updatedAt: orderAdjustment.updatedAt,
      })
      .returning();

    if (!created) {
      throw new Error('Failed to create order adjustment.');
    }

    return OrderAdjustmentPresenter.toDomain(created);
  }

  async save(orderAdjustment: OrderAdjustment): Promise<OrderAdjustment> {
    const [updated] = await db
      .update(orderAdjustments)
      .set({
        type: orderAdjustment.type,
        status: orderAdjustment.status,
        previousTotal: orderAdjustment.previousTotal,
        newTotal: orderAdjustment.newTotal,
        difference: orderAdjustment.difference,
        paymentId: orderAdjustment.paymentId?.toString() ?? null,
        operation: orderAdjustment.operation,
        reason: orderAdjustment.reason,
        confirmedAt: orderAdjustment.confirmedAt,
        updatedAt: new Date(),
      })
      .where(eq(orderAdjustments.id, orderAdjustment.id.toString()))
      .returning();

    if (!updated) {
      throw new Error('Failed to update order adjustment.');
    }

    return OrderAdjustmentPresenter.toDomain(updated);
  }
}
