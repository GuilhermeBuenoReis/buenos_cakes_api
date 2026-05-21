import { eq } from 'drizzle-orm';

import type { PaginationParams } from '@/core/repositories/pagination-params';
import type { OrdersRepository } from '@/domain/orders/application/repositories/orders-repository';
import type { Order } from '@/domain/orders/enterprise/entities/order';
import { OrderPresenter } from '@/infra/presenters/order-presenter';
import { db } from '..';
import { orders } from '../schema/orders';

const ORDERS_PER_PAGE = 20;

export class DrizzleOrdersRepository implements OrdersRepository {
  async findById(id: string): Promise<Order | null> {
    const order = await db.query.orders.findFirst({
      where: eq(orders.id, id),
    });

    if (!order) {
      return null;
    }

    return OrderPresenter.toDomain(order);
  }

  async findManyByUserId(
    userId: string,
    { page }: PaginationParams
  ): Promise<Order[]> {
    const userOrders = await db.query.orders.findMany({
      where: eq(orders.userId, userId),
      limit: ORDERS_PER_PAGE,
      offset: (page - 1) * ORDERS_PER_PAGE,
    });

    return userOrders.map(OrderPresenter.toDomain);
  }

  async findMany({ page }: PaginationParams): Promise<Order[]> {
    const allOrders = await db.query.orders.findMany({
      limit: ORDERS_PER_PAGE,
      offset: (page - 1) * ORDERS_PER_PAGE,
    });

    return allOrders.map(OrderPresenter.toDomain);
  }

  async create(order: Order): Promise<Order> {
    const [created] = await db
      .insert(orders)
      .values({
        id: order.id.toString(),
        userId: order.userId.toString(),
        status: order.status,
        fulfillmentMethod: order.fulfillmentMethod,
        deliveryAddressId: order.deliveryAddressId?.toString() ?? null,
        pickupScheduledAt: order.pickupScheduledAt,
        customerNote: order.customerNote,
        subtotal: order.subtotal,
        deliveryFee: order.deliveryFee,
        total: order.total,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      })
      .returning();

    if (!created) {
      throw new Error('Failed to create order.');
    }

    return OrderPresenter.toDomain(created);
  }

  async save(order: Order): Promise<Order> {
    const [updatedOrder] = await db
      .update(orders)
      .set({
        userId: order.userId.toString(),
        status: order.status,
        fulfillmentMethod: order.fulfillmentMethod,
        deliveryAddressId: order.deliveryAddressId?.toString() ?? null,
        pickupScheduledAt: order.pickupScheduledAt,
        customerNote: order.customerNote,
        subtotal: order.subtotal,
        deliveryFee: order.deliveryFee,
        total: order.total,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, order.id.toString()))
      .returning();

    if (!updatedOrder) {
      throw new Error('Failed to update order.');
    }

    return OrderPresenter.toDomain(updatedOrder);
  }

  async delete(order: Order): Promise<void> {
    await db.delete(orders).where(eq(orders.id, order.id.toString()));
  }
}
