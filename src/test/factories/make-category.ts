import { faker } from '@faker-js/faker';
import { Category } from '../../core/entities/category';
import type { UniqueEntityID } from '../../core/utils/unique-entity-id';

type CategoryProps = Parameters<typeof Category.create>[0];

export function makeCategory(
  override: Partial<CategoryProps> = {},
  id?: UniqueEntityID
) {
  const category = Category.create(
    {
      name: faker.commerce.department(),
      slug: faker.helpers.slugify(faker.commerce.department()).toLowerCase(),
      description: faker.helpers.maybe(() => faker.commerce.productDescription()) ?? null,
      imageUrl: faker.helpers.maybe(() => faker.internet.url()) ?? null,
      isActive: faker.datatype.boolean(),
      createdAt: faker.date.recent(),
      ...override,
    },
    id
  );

  return category;
}
