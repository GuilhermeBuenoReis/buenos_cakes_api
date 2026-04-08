import { beforeEach, describe, expect, it } from 'vitest';
import { makeAddress } from '../../../../../test/factories/make-address';
import { FailingAddressesRepository } from '../../../../../test/repositories/failures/failing-addresses-repository';
import { InMemoryAddressesRepository } from '../../../../../test/repositories/in-memory-addresses-repository';
import { UniqueEntityID } from '../../../../core/entities/unique-entity-id';
import { AddressNotFoundError } from '../errors/address-not-found-error';
import { UnexpectedError } from '../../../../core/errors/unexpected-error';
import { GetAddressByIdService } from './get-address-by-id-service';

let inMemoryAddressesRepository: InMemoryAddressesRepository;
let failingAddressesRepository: FailingAddressesRepository;
let sut: GetAddressByIdService;

describe('GetAddressByIdService', () => {
  beforeEach(() => {
    inMemoryAddressesRepository = new InMemoryAddressesRepository();
    failingAddressesRepository = new FailingAddressesRepository();
    sut = new GetAddressByIdService(inMemoryAddressesRepository);
  });

  it('should get an address by id', async () => {
    const addressId = new UniqueEntityID('address-1');
    const address = makeAddress({}, addressId);

    await inMemoryAddressesRepository.create(address);

    const result = await sut.execute({
      addressId: addressId.toString(),
    });

    expect(result.isSuccess()).toBe(true);

    if (result.isSuccess()) {
      expect(result.value.address.id.toString()).toBe(addressId.toString());
      expect(result.value.address.street).toBe(address.street);
    }
  });

  it('should not get an address when id does not exist', async () => {
    const result = await sut.execute({
      addressId: 'non-existing-address-id',
    });

    expect(result.isError()).toBe(true);

    if (result.isError()) {
      expect(result.value).toBeInstanceOf(AddressNotFoundError);
    }
  });

  it('should return an unexpected error when something goes wrong', async () => {
    sut = new GetAddressByIdService(failingAddressesRepository);

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
