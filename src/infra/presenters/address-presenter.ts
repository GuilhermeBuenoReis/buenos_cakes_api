import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { Address } from '@/domain/users/enterprise/entities/address';
import type { addresses } from '../db/schema/address';

type DrizzleAddress = typeof addresses.$inferSelect;

export class AddressPresenter {
  static toDomain(address: DrizzleAddress): Address {
    return Address.create(
      {
        userId: new UniqueEntityID(address.userId),
        label: address.label,
        recipientName: address.recipientName,
        street: address.street,
        houseNumber: address.houseNumber,
        complement: address.complement,
        city: address.city,
        state: address.state,
        zipCode: address.zipCode,
        reference: address.reference,
        isDefault: address.isDefault,
        createdAt: address.createdAt,
        updatedAt: address.updatedAt,
      },
      new UniqueEntityID(address.id)
    );
  }

  static toHTTP(address: Address) {
    return {
      id: address.id.toString(),
      userId: address.userId.toString(),
      label: address.label,
      recipientName: address.recipientName,
      street: address.street,
      houseNumber: address.houseNumber,
      complement: address.complement,
      city: address.city,
      state: address.state,
      zipCode: address.zipCode,
      reference: address.reference,
      isDefault: address.isDefault,
      createdAt: address.createdAt.toISOString(),
      updatedAt: address.updatedAt?.toISOString() ?? null,
    };
  }
}
