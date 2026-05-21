import { eq } from 'drizzle-orm';

import type { OrderItemsRepository } from '@/domain/orders/application/repositories/order-items-repository';
import type { OrderItem } from '@/domain/orders/enterprise/entities/order-item';
import { OrderItemPresenter } from '@/infra/presenters/order-item-presenter';
import { db } from '..';
import { orderItems } from '../schema/order-items';

export class DrizzleOrderItemsRepository implements OrderItemsRepository {
  async findById(id: string): Promise<OrderItem | null> {
    const orderItem = await db.query.orderItems.findFirst({
      where: eq(orderItems.id, id),
    });

    if (!orderItem) {
      return null;
    }

    return OrderItemPresenter.toDomain(orderItem);
  }

  async findManyByOrderId(orderId: string): Promise<OrderItem[]> {
    const orderOrderItems = await db.query.orderItems.findMany({
      where: eq(orderItems.orderId, orderId),
    });

    return orderOrderItems.map(OrderItemPresenter.toDomain);
  }

  async create(orderItem: OrderItem): Promise<OrderItem> {
    const [created] = await db
      .insert(orderItems)
      .values({
        id: orderItem.id.toString(),
        orderId: orderItem.orderId.toString(),
        productId: orderItem.productId.toString(),
        productSizeId: orderItem.productSizeId?.toString() ?? null,
        productFillingId: orderItem.productFillingId?.toString() ?? null,
        quantity: orderItem.quantity,
        unitPrice: orderItem.unitPrice,
        total: orderItem.total,
        note: orderItem.note,
        createdAt: orderItem.createdAt,
        updatedAt: orderItem.updatedAt,
      })
      .returning();

    if (!created) {
      throw new Error('Failed to create order item.');
    }

    return OrderItemPresenter.toDomain(created);
  }

  async save(orderItem: OrderItem): Promise<OrderItem> {
    const [updatedOrderItem] = await db
      .update(orderItems)
      .set({
        orderId: orderItem.orderId.toString(),
        productId: orderItem.productId.toString(),
        productSizeId: orderItem.productSizeId?.toString() ?? null,
        productFillingId: orderItem.productFillingId?.toString() ?? null,
        quantity: orderItem.quantity,
        unitPrice: orderItem.unitPrice,
        total: orderItem.total,
        note: orderItem.note,
        updatedAt: new Date(),
      })
      .where(eq(orderItems.id, orderItem.id.toString()))
      .returning();

    if (!updatedOrderItem) {
      throw new Error('Failed to update order item.');
    }

    return OrderItemPresenter.toDomain(updatedOrderItem);
  }

  async delete(orderItem: OrderItem): Promise<void> {
    await db
      .delete(orderItems)
      .where(eq(orderItems.id, orderItem.id.toString()));
  }
}
