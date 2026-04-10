import { faker } from '@faker-js/faker';
import type { UniqueEntityID as UniqueEntityIDType } from '../../src/core/entities/unique-entity-id';
import { UniqueEntityID } from '../../src/core/entities/unique-entity-id';
import { Address } from '../../src/domain/users/enterprise/entities/address';

type AddressProps = Parameters<typeof Address.create>[0];

export function makeAddress(
  override: Partial<AddressProps> = {},
  id?: UniqueEntityIDType
) {
  const address = Address.create(
    {
      userId: override.userId ?? new UniqueEntityID(),
      label: faker.helpers.arrayElement(['home', 'work']),
      recipientName: faker.person.fullName(),
      street: faker.location.street(),
      houseNumber: faker.location.buildingNumber(),
      complement:
        faker.helpers.maybe(() => faker.location.secondaryAddress()) ?? null,
      city: faker.location.city(),
      state: faker.location.state({ abbreviated: true }),
      zipCode: faker.location.zipCode('########'),
      reference:
        faker.helpers.maybe(() => faker.location.streetAddress()) ?? null,
      isDefault: faker.datatype.boolean(),
      createdAt: faker.date.recent(),
      ...override,
    },
    id
  );

  return address;
}
