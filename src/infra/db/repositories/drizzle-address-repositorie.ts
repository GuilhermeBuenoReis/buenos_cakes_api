import { and, eq } from 'drizzle-orm';

import type { UniqueEntityID } from '@/core/entities/unique-entity-id';
import type { AddressesRepository } from '@/domain/users/application/repositories/addresses-repository';
import type { Address } from '@/domain/users/enterprise/entities/address';
import { AddressPresenter } from '@/infra/presenters/address-presenter';
import { db } from '..';
import { addresses } from '../schema/address';

export class DrizzleAddressesRepository implements AddressesRepository {
  async findById(id: string): Promise<Address | null> {
    const address = await db.query.addresses.findFirst({
      where: eq(addresses.id, id),
    });

    if (!address) {
      return null;
    }

    return AddressPresenter.toDomain(address);
  }

  async findManyByUserId(userId: UniqueEntityID): Promise<Address[]> {
    const userAddresses = await db.query.addresses.findMany({
      where: eq(addresses.userId, userId.toString()),
    });

    return userAddresses.map(AddressPresenter.toDomain);
  }

  async findDefaultByUserId(userId: UniqueEntityID): Promise<Address | null> {
    const address = await db.query.addresses.findFirst({
      where: and(
        eq(addresses.userId, userId.toString()),
        eq(addresses.isDefault, true)
      ),
    });

    if (!address) {
      return null;
    }

    return AddressPresenter.toDomain(address);
  }

  async create(address: Address): Promise<Address> {
    const [created] = await db
      .insert(addresses)
      .values({
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
        createdAt: address.createdAt,
        updatedAt: address.updatedAt,
      })
      .returning();

    if (!created) {
      throw new Error('Failed to create address.');
    }

    return AddressPresenter.toDomain(created);
  }

  async save(address: Address): Promise<Address> {
    const [updatedAddress] = await db
      .update(addresses)
      .set({
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
        updatedAt: new Date(),
      })
      .where(eq(addresses.id, address.id.toString()))
      .returning();

    if (!updatedAddress) {
      throw new Error('Failed to update address.');
    }

    return AddressPresenter.toDomain(updatedAddress);
  }

  async delete(address: Address): Promise<void> {
    await db.delete(addresses).where(eq(addresses.id, address.id.toString()));
  }
}
