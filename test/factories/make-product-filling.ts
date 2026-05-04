import { faker } from '@faker-js/faker';
import type { UniqueEntityID as UniqueEntityIDType } from '../../src/core/entities/unique-entity-id';
import { UniqueEntityID } from '../../src/core/entities/unique-entity-id';
import { ProductFillings } from '../../src/domain/products/enterprise/entities/product_fillings';

type ProductFillingProps = Parameters<typeof ProductFillings.create>[0];

export function makeProductFilling(
  override: Partial<ProductFillingProps> = {},
  id?: UniqueEntityIDType
) {
  const productFilling = ProductFillings.create(
    {
      productId: override.productId ?? new UniqueEntityID(),
      label: faker.helpers.arrayElement(['Chocolate', 'Morango', 'Ninho']),
      priceDelta: faker.number.float({ min: 0, max: 50, fractionDigits: 2 }),
      isDefault: faker.datatype.boolean(),
      sortOrder: faker.number.int({ min: 0, max: 10 }),
      isActive: faker.datatype.boolean(),
      createdAt: faker.date.recent(),
      ...override,
    },
    id
  );

  return productFilling;
}
