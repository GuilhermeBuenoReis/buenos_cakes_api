import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import {
  OrderAdjustment,
  type OrderAdjustmentStatus,
  type OrderAdjustmentType,
  type OrderChangeOperationSnapshot,
} from '@/domain/orders/enterprise/entities/order-adjustment';
import type { orderAdjustments } from '../db/schema/order-adjustments';

type DrizzleOrderAdjustment = typeof orderAdjustments.$inferSelect;

export class OrderAdjustmentPresenter {
  static toDomain(orderAdjustment: DrizzleOrderAdjustment): OrderAdjustment {
    return OrderAdjustment.create(
      {
        orderId: new UniqueEntityID(orderAdjustment.orderId),
        requestedByUserId: new UniqueEntityID(
          orderAdjustment.requestedByUserId
        ),
        type: orderAdjustment.type as OrderAdjustmentType,
        status: orderAdjustment.status as OrderAdjustmentStatus,
        previousTotal: orderAdjustment.previousTotal,
        newTotal: orderAdjustment.newTotal,
        difference: orderAdjustment.difference,
        paymentId: orderAdjustment.paymentId
          ? new UniqueEntityID(orderAdjustment.paymentId)
          : null,
        operation:
          orderAdjustment.operation as OrderChangeOperationSnapshot,
        reason: orderAdjustment.reason,
        createdAt: orderAdjustment.createdAt,
        confirmedAt: orderAdjustment.confirmedAt,
        updatedAt: orderAdjustment.updatedAt,
      },
      new UniqueEntityID(orderAdjustment.id)
    );
  }

  static toHTTP(orderAdjustment: OrderAdjustment) {
    return {
      id: orderAdjustment.id.toString(),
      orderId: orderAdjustment.orderId.toString(),
      requestedByUserId: orderAdjustment.requestedByUserId.toString(),
      type: orderAdjustment.type,
      status: orderAdjustment.status,
      previousTotal: orderAdjustment.previousTotal,
      newTotal: orderAdjustment.newTotal,
      difference: orderAdjustment.difference,
      paymentId: orderAdjustment.paymentId?.toString() ?? null,
      reason: orderAdjustment.reason,
      createdAt: orderAdjustment.createdAt.toISOString(),
      confirmedAt: orderAdjustment.confirmedAt?.toISOString() ?? null,
      updatedAt: orderAdjustment.updatedAt?.toISOString() ?? null,
    };
  }
}
