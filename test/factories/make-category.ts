import { faker } from '@faker-js/faker';
import type { UniqueEntityID } from '../../src/core/entities/unique-entity-id';
import { Category } from '../../src/domain/products/enterprise/entities/category';

type CategoryProps = Parameters<typeof Category.create>[0];

export function makeCategory(
  override: Partial<CategoryProps> = {},
  id?: UniqueEntityID
) {
  const category = Category.create(
    {
      name: faker.commerce.department(),
      slug: faker.helpers.slugify(faker.commerce.department()).toLowerCase(),
      description:
        faker.helpers.maybe(() => faker.commerce.productDescription()) ?? null,
      imageUrl: faker.helpers.maybe(() => faker.internet.url()) ?? null,
      isActive: faker.datatype.boolean(),
      createdAt: faker.date.recent(),
      ...override,
    },
    id
  );

  return category;
}
