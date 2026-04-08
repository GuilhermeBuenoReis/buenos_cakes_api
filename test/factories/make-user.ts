import { faker } from '@faker-js/faker';
import { User, UserRole } from '../../src/domain/users/enterprise/entities/user';
import type { UniqueEntityID } from '../../src/core/entities/unique-entity-id';

type UserProps = Parameters<typeof User.create>[0];

export function makeUser(
  override: Partial<UserProps> = {},
  id?: UniqueEntityID
) {
  const user = User.create(
    {
      name: faker.person.fullName(),
      email: faker.internet.email().toLowerCase(),
      password: faker.internet.password(),
      cpf: faker.helpers.maybe(() => faker.string.numeric(11)) ?? null,
      phone: faker.helpers.maybe(() => faker.phone.number()) ?? null,
      role: faker.helpers.arrayElement([UserRole.CUSTOMER, UserRole.ADMIN]),
      createdAt: faker.date.recent(),
      ...override,
    },
    id
  );

  return user;
}
