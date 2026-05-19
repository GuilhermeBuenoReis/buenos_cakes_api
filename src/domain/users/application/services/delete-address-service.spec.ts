import { beforeEach, describe, expect, it } from 'vitest';
import { makeAddress } from '../../../../../test/factories/make-address';
import { FailingAddressesRepository } from '../../../../../test/repositories/failures/failing-addresses-repository';
import { InMemoryAddressesRepository } from '../../../../../test/repositories/in-memory-addresses-repository';
import { UnexpectedError } from '../../../../core/errors/unexpected-error';
import { AddressNotFoundError } from '../errors/address-not-found-error';
import { DeleteAddressService } from './delete-address-service';

let inMemoryAddressesRepository: InMemoryAddressesRepository;
let failingAddressesRepository: FailingAddressesRepository;
let sut: DeleteAddressService;

describe('DeleteAddressService', () => {
  beforeEach(() => {
    inMemoryAddressesRepository = new InMemoryAddressesRepository();
    failingAddressesRepository = new FailingAddressesRepository();
    sut = new DeleteAddressService(inMemoryAddressesRepository);
  });

  it('should delete an address', async () => {
    const address = makeAddress();

    await inMemoryAddressesRepository.create(address);

    const result = await sut.execute({
      addressId: address.id.toString(),
    });

    expect(result.isSuccess()).toBe(true);
    expect(inMemoryAddressesRepository.items).toHaveLength(0);

    if (result.isSuccess()) {
      expect(result.value.message).toBe('Address deleted successfully.');
    }
  });

  it('should not delete an address when id does not exist', async () => {
    const result = await sut.execute({
      addressId: 'non-existing-address-id',
    });

    expect(result.isError()).toBe(true);

    if (result.isError()) {
      expect(result.value).toBeInstanceOf(AddressNotFoundError);
    }
  });

  it('should return an unexpected error when something goes wrong', async () => {
    sut = new DeleteAddressService(failingAddressesRepository);

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
