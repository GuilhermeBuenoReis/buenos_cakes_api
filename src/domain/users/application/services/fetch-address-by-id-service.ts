import { type Either, error, success } from '../../../../core/either';
import { UnexpectedError } from '../../../../core/errors/unexpected-error';
import type { Address } from '../../enterprise/entities/address';
import { AddressNotFoundError } from '../errors/address-not-found-error';
import type { AddressesRepository } from '../repositories/addresses-repository';

export interface FetchAddressByIdServiceRequest {
  addressId: string;
}

export type FetchAddressByIdServiceResponse = Either<
  AddressNotFoundError | UnexpectedError,
  {
    address: Address;
  }
>;

export class FetchAddressByIdService {
  constructor(private addressesRepository: AddressesRepository) {}

  async execute({
    addressId,
  }: FetchAddressByIdServiceRequest): Promise<FetchAddressByIdServiceResponse> {
    try {
      const address = await this.addressesRepository.findById(addressId);

      if (!address) {
        return error(new AddressNotFoundError(addressId));
      }

      return success({
        address,
      });
    } catch {
      return error(new UnexpectedError());
    }
  }
}
