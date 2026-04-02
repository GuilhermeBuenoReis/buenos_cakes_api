import type { Address } from '../../../core/entities/address';
import type { AddressesRepository } from '../../../core/repositories/addresses-repository';
import type { UniqueEntityID } from '../../../core/utils/unique-entity-id';

export class FailingAddressesRepository implements AddressesRepository {
  async findById(_id: string): Promise<Address | null> {
    throw new Error('Unexpected repository error.');
  }

  async findManyByUserId(_userId: UniqueEntityID): Promise<Address[]> {
    throw new Error('Unexpected repository error.');
  }

  async findDefaultByUserId(_userId: UniqueEntityID): Promise<Address | null> {
    throw new Error('Unexpected repository error.');
  }

  async create(_address: Address): Promise<Address> {
    throw new Error('Unexpected repository error.');
  }

  async save(_address: Address): Promise<Address> {
    throw new Error('Unexpected repository error.');
  }

  async delete(_address: Address): Promise<void> {
    throw new Error('Unexpected repository error.');
  }
}
