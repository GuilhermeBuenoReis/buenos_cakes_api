import { beforeEach, describe, expect, it } from 'vitest';
import { makeAddress } from '../../../../../test/factories/make-address';
import { FailingAddressesRepository } from '../../../../../test/repositories/failures/failing-addresses-repository';
import { InMemoryAddressesRepository } from '../../../../../test/repositories/in-memory-addresses-repository';
import { AddressNotFoundError } from '../errors/address-not-found-error';
import { UnexpectedError } from '../../../../core/errors/unexpected-error';
import { SetDefaultAddressService } from './set-default-address-service';

let inMemoryAddressesRepository: InMemoryAddressesRepository;
let failingAddressesRepository: FailingAddressesRepository;
let sut: SetDefaultAddressService;

describe('SetDefaultAddressService', () => {
  beforeEach(() => {
    inMemoryAddressesRepository = new InMemoryAddressesRepository();
    failingAddressesRepository = new FailingAddressesRepository();
    sut = new SetDefaultAddressService(inMemoryAddressesRepository);
  });

  it('should set an address as default', async () => {
    const currentDefaultAddress = makeAddress({
      isDefault: true,
    });
    const anotherAddress = makeAddress({
      userId: currentDefaultAddress.userId,
      isDefault: false,
    });

    await inMemoryAddressesRepository.create(currentDefaultAddress);
    await inMemoryAddressesRepository.create(anotherAddress);

    const result = await sut.execute({
      addressId: anotherAddress.id.toString(),
    });

    expect(result.isSuccess()).toBe(true);

    const savedCurrentDefaultAddress = inMemoryAddressesRepository.items.find(
      (item) => item.id.equals(currentDefaultAddress.id)
    );

    if (result.isSuccess() && savedCurrentDefaultAddress) {
      expect(savedCurrentDefaultAddress.isDefault).toBe(false);
      expect(result.value.address.isDefault).toBe(true);
    }
  });

  it('should set an address as default when there is no current default', async () => {
    const address = makeAddress({
      isDefault: false,
    });

    await inMemoryAddressesRepository.create(address);

    const result = await sut.execute({
      addressId: address.id.toString(),
    });

    expect(result.isSuccess()).toBe(true);

    if (result.isSuccess()) {
      expect(result.value.address.isDefault).toBe(true);
    }
  });

  it('should not set an address as default when it does not exist', async () => {
    const result = await sut.execute({
      addressId: 'non-existing-address-id',
    });

    expect(result.isError()).toBe(true);

    if (result.isError()) {
      expect(result.value).toBeInstanceOf(AddressNotFoundError);
    }
  });

  it('should return an unexpected error when something goes wrong', async () => {
    sut = new SetDefaultAddressService(failingAddressesRepository);

    const result = await sut.execute({
      addressId: 'address-1',
    });

    expect(result.isError()).toBe(true);

    if (result.isError()) {
      expect(result.value).toBeInstanceOf(UnexpectedError);
      expect(result.value.message).toBe(
        'Something went wrong. Please try again later.'
      );
    }
  });
});
