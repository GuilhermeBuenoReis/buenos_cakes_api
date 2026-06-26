import { describe, expect, it } from 'vitest';
import { makeOrder } from '../../../../../test/factories/make-order';
import { UniqueEntityID } from '../../../../core/entities/unique-entity-id';
import { OrderFulfillmentMethod, OrderStatus } from '../../enterprise/entities/order';
import { OrderEditDeadlineExpiredError } from '../errors/order-edit-deadline-expired-error';
import { OrderStatusNotEditableError } from '../errors/order-status-not-editable-error';
import { getOrderEditViolation, isOrderStatusEditable } from './order-edit-policy';

function inHours(hours: number) {
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}

describe('order-edit-policy', () => {
  it('should consider pending and confirmed orders editable', () => {
    expect(isOrderStatusEditable(OrderStatus.PENDING)).toBe(true);
    expect(isOrderStatusEditable(OrderStatus.CONFIRMED)).toBe(true);
    expect(isOrderStatusEditable(OrderStatus.PREPARING)).toBe(false);
    expect(isOrderStatusEditable(OrderStatus.CANCELED)).toBe(false);
  });

  it('should allow changes when there are more than 24 hours to pickup', () => {
    const order = makeOrder({
      userId: new UniqueEntityID('user-1'),
      status: OrderStatus.PENDING,
      fulfillmentMethod: OrderFulfillmentMethod.PICKUP,
      pickupScheduledAt: inHours(48),
    });

    expect(getOrderEditViolation(order)).toBeNull();
  });

  it('should block changes within the 24 hours window', () => {
    const order = makeOrder({
      userId: new UniqueEntityID('user-1'),
      status: OrderStatus.PENDING,
      fulfillmentMethod: OrderFulfillmentMethod.PICKUP,
      pickupScheduledAt: inHours(10),
    });

    expect(getOrderEditViolation(order)).toBeInstanceOf(
      OrderEditDeadlineExpiredError
    );
  });

  it('should block changes when the schedule is not defined', () => {
    const order = makeOrder({
      userId: new UniqueEntityID('user-1'),
      status: OrderStatus.PENDING,
      fulfillmentMethod: OrderFulfillmentMethod.PICKUP,
      pickupScheduledAt: null,
    });

    expect(getOrderEditViolation(order)).toBeInstanceOf(
      OrderEditDeadlineExpiredError
    );
  });

  it('should block changes on a non-editable status before checking the deadline', () => {
    const order = makeOrder({
      userId: new UniqueEntityID('user-1'),
      status: OrderStatus.PREPARING,
      fulfillmentMethod: OrderFulfillmentMethod.PICKUP,
      pickupScheduledAt: inHours(48),
    });

    expect(getOrderEditViolation(order)).toBeInstanceOf(
      OrderStatusNotEditableError
    );
  });
});
