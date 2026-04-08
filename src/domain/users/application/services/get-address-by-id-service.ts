import type { Address } from '../../enterprise/entities/address';
import type { AddressesRepository } from '../repositories/addresses-repository';
import { type Either, error, success } from '../../../../core/either';
import { AddressNotFoundError } from '../errors/address-not-found-error';
import { UnexpectedError } from '../../../../core/errors/unexpected-error';

export interface GetAddressByIdServiceRequest {
  addressId: string;
}

export type GetAddressByIdServiceResponse = Either<
  AddressNotFoundError | UnexpectedError,
  {
    address: Address;
  }
>;

export class GetAddressByIdService {
  constructor(private addressesRepository: AddressesRepository) {}

  async execute({
    addressId,
  }: GetAddressByIdServiceRequest): Promise<GetAddressByIdServiceResponse> {
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
