import type { Address } from '../entities/address';
import type { AddressesRepository } from '../repositories/addresses-repository';
import { type Either, error, success } from '../utils/either';
import { AddressNotFoundError } from './errors/address-not-found-error';
import { UnexpectedError } from './errors/unexpected-error';
import { AddressDefaultHelper } from './helpers/address-default-helper';

export interface UpdateAddressServiceRequest {
  addressId: string;
  label?: string;
  recipientName?: string;
  street?: string;
  houseNumber?: string;
  complement?: string | null;
  city?: string;
  state?: string;
  zipCode?: string;
  reference?: string | null;
  isDefault?: boolean;
}

export type UpdateAddressServiceResponse = Either<
  AddressNotFoundError | UnexpectedError,
  {
    address: Address;
  }
>;

export class UpdateAddressService {
  private addressDefaultHelper: AddressDefaultHelper;

  constructor(private addressesRepository: AddressesRepository) {
    this.addressDefaultHelper = new AddressDefaultHelper(addressesRepository);
  }

  async execute({
    addressId,
    label,
    recipientName,
    street,
    houseNumber,
    complement,
    city,
    state,
    zipCode,
    reference,
    isDefault,
  }: UpdateAddressServiceRequest): Promise<UpdateAddressServiceResponse> {
    try {
      const address = await this.addressesRepository.findById(addressId);

      if (!address) {
        return error(new AddressNotFoundError(addressId));
      }

      const updatedDefaultStatus = await this.resolveUpdatedDefaultStatus(
        address,
        isDefault
      );

      const fieldsToUpdate = {
        label,
        recipientName,
        street,
        houseNumber,
        complement,
        city,
        state,
        zipCode,
        reference,
        isDefault: updatedDefaultStatus,
      };

      if (fieldsToUpdate.label !== undefined)
        address.label = fieldsToUpdate.label;
      if (fieldsToUpdate.recipientName !== undefined)
        address.recipientName = fieldsToUpdate.recipientName;
      if (fieldsToUpdate.street !== undefined)
        address.street = fieldsToUpdate.street;
      if (fieldsToUpdate.houseNumber !== undefined)
        address.houseNumber = fieldsToUpdate.houseNumber;
      if (fieldsToUpdate.complement !== undefined)
        address.complement = fieldsToUpdate.complement;
      if (fieldsToUpdate.city !== undefined) address.city = fieldsToUpdate.city;
      if (fieldsToUpdate.state !== undefined)
        address.state = fieldsToUpdate.state;
      if (fieldsToUpdate.zipCode !== undefined)
        address.zipCode = fieldsToUpdate.zipCode;
      if (fieldsToUpdate.reference !== undefined)
        address.reference = fieldsToUpdate.reference;
      if (fieldsToUpdate.isDefault !== undefined)
        address.isDefault = fieldsToUpdate.isDefault;

      await this.addressesRepository.save(address);

      return success({
        address,
      });
    } catch {
      return error(new UnexpectedError());
    }
  }

  private async resolveUpdatedDefaultStatus(
    address: Address,
    requestedDefaultStatus?: boolean
  ): Promise<boolean | undefined> {
    return this.addressDefaultHelper.resolveUpdateDefaultStatus(
      address,
      requestedDefaultStatus
    );
  }
}
