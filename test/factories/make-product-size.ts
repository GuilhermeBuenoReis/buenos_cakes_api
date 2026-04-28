import { faker } from '@faker-js/faker';
import type { UniqueEntityID as UniqueEntityIDType } from '../../src/core/entities/unique-entity-id';
import { UniqueEntityID } from '../../src/core/entities/unique-entity-id';
import { ProductSize } from '../../src/domain/products/enterprise/entities/product-size';

type ProductSizeProps = Parameters<typeof ProductSize.create>[0];

export function makeProductSize(
  override: Partial<ProductSizeProps> = {},
  id?: UniqueEntityIDType
) {
  const productSize = ProductSize.create(
    {
      productId: override.productId ?? new UniqueEntityID(),
      code: faker.string.alphanumeric({ length: 6 }).toUpperCase(),
      label: faker.helpers.arrayElement(['Pequeno', 'Medio', 'Grande']),
      servingsLabel:
        faker.helpers.maybe(() => `${faker.number.int({ min: 6, max: 30 })} fatias`) ??
        null,
      priceDelta: faker.number.float({ min: 0, max: 50, fractionDigits: 2 }),
      isDefault: faker.datatype.boolean(),
      sortOrder: faker.number.int({ min: 0, max: 10 }),
      isActive: faker.datatype.boolean(),
      createdAt: faker.date.recent(),
      ...override,
    },
    id
  );

  return productSize;
}
