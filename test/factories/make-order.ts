import { faker } from '@faker-js/faker';
import type { UniqueEntityID as UniqueEntityIDType } from '../../src/core/entities/unique-entity-id';
import { UniqueEntityID } from '../../src/core/entities/unique-entity-id';
import {
  Order,
  OrderFulfillmentMethod,
  OrderStatus,
} from '../../src/domain/orders/enterprise/entities/order';

type OrderProps = Parameters<typeof Order.create>[0];

export function makeOrder(
  override: Partial<OrderProps> = {},
  id?: UniqueEntityIDType
) {
  const fulfillmentMethod =
    override.fulfillmentMethod ??
    faker.helpers.arrayElement([
      OrderFulfillmentMethod.PICKUP,
      OrderFulfillmentMethod.DELIVERY,
    ]);

  const order = Order.create(
    {
      userId: override.userId ?? new UniqueEntityID(),
      status:
        override.status ??
        faker.helpers.arrayElement([
          OrderStatus.PENDING,
          OrderStatus.CONFIRMED,
          OrderStatus.PREPARING,
          OrderStatus.READY,
          OrderStatus.COMPLETED,
          OrderStatus.CANCELED,
        ]),
      fulfillmentMethod,
      deliveryAddressId:
        override.deliveryAddressId ??
        (fulfillmentMethod === OrderFulfillmentMethod.DELIVERY
          ? new UniqueEntityID()
          : null),
      pickupScheduledAt:
        override.pickupScheduledAt ??
        (fulfillmentMethod === OrderFulfillmentMethod.PICKUP
          ? faker.date.soon()
          : null),
      customerNote: faker.helpers.maybe(() => faker.lorem.sentence()) ?? null,
      subtotal: faker.number.float({ min: 50, max: 500, fractionDigits: 2 }),
      deliveryFee:
        fulfillmentMethod === OrderFulfillmentMethod.DELIVERY
          ? faker.number.float({ min: 5, max: 30, fractionDigits: 2 })
          : 0,
      total: faker.number.float({ min: 50, max: 530, fractionDigits: 2 }),
      createdAt: faker.date.recent(),
      ...override,
    },
    id
  );

  return order;
}
