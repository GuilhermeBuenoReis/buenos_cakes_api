import { faker } from '@faker-js/faker';
import { User, UserRole } from '../../core/entities/user';
import { UniqueEntityID } from '../../core/utils/unique-entity-id';

type UserFactoryOverrides = Partial<Parameters<typeof User.create>[0]>;

export function makeUser(
  overrides: UserFactoryOverrides = {},
  id?: UniqueEntityID
) {
  return User.create(
    {
      name: faker.person.fullName(),
      email: faker.internet.email().toLowerCase(),
      passwordHash: faker.internet.password(),
      cpf: faker.helpers.maybe(() => faker.string.numeric(11)) ?? null,
      phone: faker.helpers.maybe(() => faker.phone.number()) ?? null,
      role: faker.helpers.arrayElement([UserRole.CUSTOMER, UserRole.ADMIN]),
      createdAt: faker.date.recent(),
      ...overrides,
    },
    id
  );
}
