import type { Address } from '../../domain/users/enterprise/entities/address';
import type { AddressesRepository } from '../../domain/users/application/repositories/addresses-repository';
import type { UniqueEntityID } from '../../core/entities/unique-entity-id';

export class InMemoryAddressesRepository implements AddressesRepository {
  public items: Address[] = [];

  async findById(id: string): Promise<Address | null> {
    const address = this.items.find((item) => item.id.toString() === id);

    if (!address) {
      return null;
    }

    return address;
  }

  async findManyByUserId(userId: UniqueEntityID): Promise<Address[]> {
    const address = this.items.filter((item) => item.userId.equals(userId));

    return address;
  }

  async findDefaultByUserId(userId: UniqueEntityID): Promise<Address | null> {
    const address = this.items.find(
      (item) => item.userId.equals(userId) && item.isDefault
    );

    if (!address) {
      return null;
    }

    return address;
  }

  async create(address: Address): Promise<Address> {
    this.items.push(address);

    return address;
  }

  async save(address: Address): Promise<Address> {
    const addressIndex = this.items.findIndex((item) =>
      item.id.equals(address.id)
    );

    this.items[addressIndex] = address;

    return address;
  }

  async delete(address: Address): Promise<void> {
    const addressIndex = this.items.findIndex((item) =>
      item.id.equals(address.id)
    );

    this.items.splice(addressIndex, 1);
  }
}
