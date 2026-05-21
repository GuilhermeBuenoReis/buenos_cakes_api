import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import {
  Order,
  type OrderFulfillmentMethod,
  type OrderStatus,
} from '@/domain/orders/enterprise/entities/order';
import type { orders } from '../db/schema/orders';

type DrizzleOrder = typeof orders.$inferSelect;

export class OrderPresenter {
  static toDomain(order: DrizzleOrder): Order {
    return Order.create(
      {
        userId: new UniqueEntityID(order.userId),
        status: order.status as OrderStatus,
        fulfillmentMethod: order.fulfillmentMethod as OrderFulfillmentMethod,
        deliveryAddressId: order.deliveryAddressId
          ? new UniqueEntityID(order.deliveryAddressId)
          : null,
        pickupScheduledAt: order.pickupScheduledAt,
        customerNote: order.customerNote,
        subtotal: order.subtotal,
        deliveryFee: order.deliveryFee,
        total: order.total,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      },
      new UniqueEntityID(order.id)
    );
  }

  static toHTTP(order: Order) {
    return {
      id: order.id.toString(),
      userId: order.userId.toString(),
      status: order.status,
      fulfillmentMethod: order.fulfillmentMethod,
      deliveryAddressId: order.deliveryAddressId?.toString() ?? null,
      pickupScheduledAt: order.pickupScheduledAt?.toISOString() ?? null,
      customerNote: order.customerNote,
      subtotal: order.subtotal,
      deliveryFee: order.deliveryFee,
      total: order.total,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt?.toISOString() ?? null,
    };
  }
}
