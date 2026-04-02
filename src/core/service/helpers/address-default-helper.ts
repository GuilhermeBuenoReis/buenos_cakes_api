import type { Address } from '../../entities/address';
import type { AddressesRepository } from '../../repositories/addresses-repository';
import type { UniqueEntityID } from '../../utils/unique-entity-id';

export class AddressDefaultHelper {
  constructor(private addressesRepository: AddressesRepository) {}

  async resolveCreateDefaultStatus(
    userId: UniqueEntityID,
    requestedDefaultStatus?: boolean
  ): Promise<boolean> {
    const currentDefaultAddress =
      await this.addressesRepository.findDefaultByUserId(userId);

    const newAddressShouldBeDefault = currentDefaultAddress
      ? (requestedDefaultStatus ?? false)
      : true;

    if (newAddressShouldBeDefault && currentDefaultAddress) {
      currentDefaultAddress.isDefault = false;
      await this.addressesRepository.save(currentDefaultAddress);
    }

    return newAddressShouldBeDefault;
  }

  async resolveUpdateDefaultStatus(
    address: Address,
    requestedDefaultStatus?: boolean
  ): Promise<boolean | undefined> {
    if (requestedDefaultStatus === undefined) {
      return undefined;
    }

    const currentDefaultAddress =
      await this.addressesRepository.findDefaultByUserId(address.userId);

    if (!currentDefaultAddress) {
      return true;
    }

    if (
      !requestedDefaultStatus &&
      currentDefaultAddress.id.equals(address.id)
    ) {
      return true;
    }

    if (
      requestedDefaultStatus &&
      !currentDefaultAddress.id.equals(address.id)
    ) {
      currentDefaultAddress.isDefault = false;
      await this.addressesRepository.save(currentDefaultAddress);
    }

    return requestedDefaultStatus;
  }

  async setAsDefault(address: Address): Promise<void> {
    const currentDefaultAddress =
      await this.addressesRepository.findDefaultByUserId(address.userId);

    if (currentDefaultAddress && !currentDefaultAddress.id.equals(address.id)) {
      currentDefaultAddress.isDefault = false;
      await this.addressesRepository.save(currentDefaultAddress);
    }

    address.isDefault = true;
  }
}
