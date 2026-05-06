import { faker } from '@faker-js/faker';
import type { UniqueEntityID as UniqueEntityIDType } from '../../src/core/entities/unique-entity-id';
import { UniqueEntityID } from '../../src/core/entities/unique-entity-id';
import { OrderItem } from '../../src/domain/orders/enterprise/entities/order-item';

type OrderItemProps = Parameters<typeof OrderItem.create>[0];

export function makeOrderItem(
  override: Partial<OrderItemProps> = {},
  id?: UniqueEntityIDType
) {
  const quantity = override.quantity ?? faker.number.int({ min: 1, max: 5 });
  const unitPrice =
    override.unitPrice ??
    faker.number.float({ min: 10, max: 150, fractionDigits: 2 });

  const orderItem = OrderItem.create(
    {
      orderId: override.orderId ?? new UniqueEntityID(),
      productId: override.productId ?? new UniqueEntityID(),
      productSizeId: override.productSizeId ?? new UniqueEntityID(),
      productFillingId: override.productFillingId ?? new UniqueEntityID(),
      quantity,
      unitPrice,
      total: override.total ?? quantity * unitPrice,
      note: faker.helpers.maybe(() => faker.lorem.sentence()) ?? null,
      createdAt: faker.date.recent(),
      ...override,
    },
    id
  );

  return orderItem;
}
