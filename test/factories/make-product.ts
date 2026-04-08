import { faker } from '@faker-js/faker';
import { UniqueEntityID } from '../../src/core/entities/unique-entity-id';
import type { UniqueEntityID as UniqueEntityIDType } from '../../src/core/entities/unique-entity-id';
import { Product } from '../../src/domain/products/enterprise/entities/product';

type ProductProps = Parameters<typeof Product.create>[0];

export function makeProduct(
  override: Partial<ProductProps> = {},
  id?: UniqueEntityIDType
) {
  const product = Product.create(
    {
      categoryId: override.categoryId ?? new UniqueEntityID(),
      name: faker.commerce.productName(),
      slug: faker.helpers.slugify(faker.commerce.productName()).toLowerCase(),
      description:
        faker.helpers.maybe(() => faker.commerce.productDescription()) ?? null,
      basePrice: Number(faker.commerce.price({ min: 10, max: 500 })),
      coverImageUrl: faker.helpers.maybe(() => faker.internet.url()) ?? null,
      ratingAvg: faker.number.float({ min: 0, max: 5, fractionDigits: 1 }),
      reviewsCount: faker.number.int({ min: 0, max: 500 }),
      popularityScore: faker.number.int({ min: 0, max: 1000 }),
      isActive: faker.datatype.boolean(),
      createdAt: faker.date.recent(),
      ...override,
    },
    id
  );

  return product;
}
