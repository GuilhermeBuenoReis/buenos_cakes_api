import type { AddressesRepository } from '../repositories/addresses-repository';
import { type Either, error, success } from '../../../../core/either';
import { AddressNotFoundError } from '../errors/address-not-found-error';
import { UnexpectedError } from '../../../../core/errors/unexpected-error';

export interface DeleteAddressServiceRequest {
  addressId: string;
}

export type DeleteAddressServiceResponse = Either<
  AddressNotFoundError | UnexpectedError,
  {
    message: string;
  }
>;

export class DeleteAddressService {
  constructor(private addressesRepository: AddressesRepository) {}

  async execute({
    addressId,
  }: DeleteAddressServiceRequest): Promise<DeleteAddressServiceResponse> {
    try {
      const address = await this.addressesRepository.findById(addressId);

      if (!address) {
        return error(new AddressNotFoundError(addressId));
      }

      await this.addressesRepository.delete(address);

      return success({
        message: 'Address deleted successfully.',
      });
    } catch {
      return error(new UnexpectedError());
    }
  }
}
