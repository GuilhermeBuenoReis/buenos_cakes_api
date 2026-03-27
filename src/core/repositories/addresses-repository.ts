import type { Address } from '../entities/address';
import type { UniqueEntityID } from '../utils/unique-entity-id';

export interface AddressesRepository {
  findById(id: string): Promise<Address | null>;
  findManyByUserId(userId: UniqueEntityID): Promise<Address[]>;
  findDefaultByUserId(userId: UniqueEntityID): Promise<Address | null>;
  create(address: Address): Promise<void>;
  save(address: Address): Promise<void>;
  delete(address: Address): Promise<void>;
}
