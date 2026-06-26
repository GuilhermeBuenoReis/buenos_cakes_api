import { faker } from '@faker-js/faker';
import type { UniqueEntityID as UniqueEntityIDType } from '../../src/core/entities/unique-entity-id';
import { UniqueEntityID } from '../../src/core/entities/unique-entity-id';
import {
  OrderAdjustment,
  OrderAdjustmentType,
} from '../../src/domain/orders/enterprise/entities/order-adjustment';

type OrderAdjustmentProps = Parameters<typeof OrderAdjustment.create>[0];

export function makeOrderAdjustment(
  override: Partial<OrderAdjustmentProps> = {},
  id?: UniqueEntityIDType
) {
  const previousTotal =
    override.previousTotal ??
    faker.number.float({ min: 50, max: 200, fractionDigits: 2 });
  const newTotal =
    override.newTotal ??
    faker.number.float({ min: 50, max: 200, fractionDigits: 2 });

  const orderAdjustment = OrderAdjustment.create(
    {
      orderId: override.orderId ?? new UniqueEntityID(),
      requestedByUserId: override.requestedByUserId ?? new UniqueEntityID(),
      type: override.type ?? OrderAdjustmentType.ADDITIONAL_PAYMENT,
      previousTotal,
      newTotal,
      difference: override.difference ?? newTotal - previousTotal,
      operation: override.operation ?? {
        action: 'add',
        productId: new UniqueEntityID().toString(),
        quantity: 1,
      },
      ...override,
    },
    id
  );

  return orderAdjustment;
}
