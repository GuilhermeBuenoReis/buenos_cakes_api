import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { OrderItem } from '@/domain/orders/enterprise/entities/order-item';
import type { orderItems } from '../db/schema/order-items';

type DrizzleOrderItem = typeof orderItems.$inferSelect;

export class OrderItemPresenter {
  static toDomain(orderItem: DrizzleOrderItem): OrderItem {
    return OrderItem.create(
      {
        orderId: new UniqueEntityID(orderItem.orderId),
        productId: new UniqueEntityID(orderItem.productId),
        productSizeId: orderItem.productSizeId
          ? new UniqueEntityID(orderItem.productSizeId)
          : null,
        productFillingId: orderItem.productFillingId
          ? new UniqueEntityID(orderItem.productFillingId)
          : null,
        quantity: orderItem.quantity,
        unitPrice: orderItem.unitPrice,
        total: orderItem.total,
        note: orderItem.note,
        createdAt: orderItem.createdAt,
        updatedAt: orderItem.updatedAt,
      },
      new UniqueEntityID(orderItem.id)
    );
  }

  static toHTTP(orderItem: OrderItem) {
    return {
      id: orderItem.id.toString(),
      orderId: orderItem.orderId.toString(),
      productId: orderItem.productId.toString(),
      productSizeId: orderItem.productSizeId?.toString() ?? null,
      productFillingId: orderItem.productFillingId?.toString() ?? null,
      quantity: orderItem.quantity,
      unitPrice: orderItem.unitPrice,
      total: orderItem.total,
      note: orderItem.note,
      createdAt: orderItem.createdAt.toISOString(),
      updatedAt: orderItem.updatedAt?.toISOString() ?? null,
    };
  }
}
