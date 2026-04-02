import type { Address } from '../entities/address';
import type { AddressesRepository } from '../repositories/addresses-repository';
import { type Either, error, success } from '../utils/either';
import { AddressNotFoundError } from './errors/address-not-found-error';
import { UnexpectedError } from './errors/unexpected-error';
import { AddressDefaultHelper } from './helpers/address-default-helper';

export interface SetDefaultAddressServiceRequest {
  addressId: string;
}

export type SetDefaultAddressServiceResponse = Either<
  AddressNotFoundError | UnexpectedError,
  {
    address: Address;
  }
>;

export class SetDefaultAddressService {
  private addressDefaultHelper: AddressDefaultHelper;

  constructor(private addressesRepository: AddressesRepository) {
    this.addressDefaultHelper = new AddressDefaultHelper(addressesRepository);
  }

  async execute({
    addressId,
  }: SetDefaultAddressServiceRequest): Promise<SetDefaultAddressServiceResponse> {
    try {
      const address = await this.addressesRepository.findById(addressId);

      if (!address) {
        return error(new AddressNotFoundError(addressId));
      }

      await this.addressDefaultHelper.setAsDefault(address);
      await this.addressesRepository.save(address);

      return success({
        address,
      });
    } catch {
      return error(new UnexpectedError());
    }
  }
}
