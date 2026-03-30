import type { Address } from '../entities/address';
import type { UniqueEntityID } from '../utils/unique-entity-id';

export interface AddressRepositoryResponse {
  address: Address;
}

export interface AddressesRepositoryResponse {
  addresses: Address[];
}

export interface AddressesRepository {
  findById(id: string): Promise<AddressRepositoryResponse | null>;
  findManyByUserId(
    userId: UniqueEntityID
  ): Promise<AddressesRepositoryResponse>;
  findDefaultByUserId(
    userId: UniqueEntityID
  ): Promise<AddressRepositoryResponse | null>;
  create(address: Address): Promise<AddressRepositoryResponse>;
  save(address: Address): Promise<AddressRepositoryResponse>;
  delete(address: Address): Promise<AddressRepositoryResponse>;
}
