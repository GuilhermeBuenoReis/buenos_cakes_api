import { faker } from '@faker-js/faker';
import type { UniqueEntityID as UniqueEntityIDType } from '../../src/core/entities/unique-entity-id';
import { UniqueEntityID } from '../../src/core/entities/unique-entity-id';
import {
  Payment,
  PaymentMethod,
} from '../../src/domain/orders/enterprise/entities/payment';

type PaymentProps = Parameters<typeof Payment.create>[0];

export function makePayment(
  override: Partial<PaymentProps> = {},
  id?: UniqueEntityIDType
) {
  const method =
    override.method ??
    faker.helpers.arrayElement([
      PaymentMethod.PIX,
      PaymentMethod.CREDIT_CARD,
      PaymentMethod.DEBIT_CARD,
      PaymentMethod.CASH,
    ]);

  const payment = Payment.create(
    {
      orderId: override.orderId ?? new UniqueEntityID(),
      method,
      amount: faker.number.float({ min: 30, max: 500, fractionDigits: 2 }),
      providerName: method === PaymentMethod.CASH ? null : 'stripe',
      providerReferenceId:
        method === PaymentMethod.CASH ? null : faker.string.uuid(),
      providerSessionId:
        method === PaymentMethod.CASH ? null : faker.string.uuid(),
      createdAt: faker.date.recent(),
      ...override,
    },
    id
  );

  return payment;
}
