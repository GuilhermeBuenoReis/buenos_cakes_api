import type { Address } from '../../enterprise/entities/address';
import type { UniqueEntityID } from '../../../../core/entities/unique-entity-id';

export interface AddressesRepository {
  findById(id: string): Promise<Address | null>;
  findManyByUserId(userId: UniqueEntityID): Promise<Address[]>;
  findDefaultByUserId(userId: UniqueEntityID): Promise<Address | null>;
  create(address: Address): Promise<Address>;
  save(address: Address): Promise<Address>;
  delete(address: Address): Promise<void>;
}
