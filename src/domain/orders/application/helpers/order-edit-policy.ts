import type { Order } from '../../enterprise/entities/order';
import { OrderStatus } from '../../enterprise/entities/order';
import { OrderEditDeadlineExpiredError } from '../errors/order-edit-deadline-expired-error';
import { OrderStatusNotEditableError } from '../errors/order-status-not-editable-error';

export const ORDER_EDIT_DEADLINE_HOURS = 24;

const ORDER_EDIT_DEADLINE_IN_MS = ORDER_EDIT_DEADLINE_HOURS * 60 * 60 * 1000;

export const EDITABLE_ORDER_STATUSES: OrderStatus[] = [
  OrderStatus.PENDING,
  OrderStatus.CONFIRMED,
];

export function isOrderStatusEditable(status: OrderStatus): boolean {
  return EDITABLE_ORDER_STATUSES.includes(status);
}

export function getOrderEditViolation(
  order: Order,
  now: Date = new Date()
): OrderStatusNotEditableError | OrderEditDeadlineExpiredError | null {
  if (!isOrderStatusEditable(order.status)) {
    return new OrderStatusNotEditableError(order.status);
  }

  const scheduledAt = order.pickupScheduledAt;

  if (!scheduledAt) {
    return new OrderEditDeadlineExpiredError();
  }

  const remainingInMs = scheduledAt.getTime() - now.getTime();

  if (remainingInMs <= ORDER_EDIT_DEADLINE_IN_MS) {
    return new OrderEditDeadlineExpiredError();
  }

  return null;
}
