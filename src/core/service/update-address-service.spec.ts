import { beforeEach, describe, expect, it } from 'vitest';
import { makeAddress } from '../../test/factories/make-address';
import { FailingAddressesRepository } from '../../test/repositories/failures/failing-addresses-repository';
import { InMemoryAddressesRepository } from '../../test/repositories/in-memory-addresses-repository';
import { AddressNotFoundError } from './errors/address-not-found-error';
import { UnexpectedError } from './errors/unexpected-error';
import { UpdateAddressService } from './update-address-service';

let inMemoryAddressesRepository: InMemoryAddressesRepository;
let failingAddressesRepository: FailingAddressesRepository;
let sut: UpdateAddressService;

describe('UpdateAddressService', () => {
  beforeEach(() => {
    inMemoryAddressesRepository = new InMemoryAddressesRepository();
    failingAddressesRepository = new FailingAddressesRepository();
    sut = new UpdateAddressService(inMemoryAddressesRepository);
  });

  it('should update an address', async () => {
    const address = makeAddress({
      label: 'home',
      recipientName: 'John Doe',
      street: 'Rua das Flores',
      houseNumber: '123',
      complement: 'Casa 1',
      city: 'Sao Paulo',
      state: 'SP',
      zipCode: '01001000',
      reference: 'Portao azul',
      isDefault: true,
    });

    await inMemoryAddressesRepository.create(address);

    const result = await sut.execute({
      addressId: address.id.toString(),
      label: 'work',
      recipientName: 'Jane Doe',
      street: 'Avenida Central',
      houseNumber: '456',
      complement: null,
      city: 'Campinas',
      state: 'SP',
      zipCode: '13010000',
      reference: null,
    });

    expect(result.isSuccess()).toBe(true);

    if (result.isSuccess()) {
      expect(result.value.address.label).toBe('work');
      expect(result.value.address.recipientName).toBe('Jane Doe');
      expect(result.value.address.street).toBe('Avenida Central');
      expect(result.value.address.houseNumber).toBe('456');
      expect(result.value.address.complement).toBeNull();
      expect(result.value.address.city).toBe('Campinas');
      expect(result.value.address.state).toBe('SP');
      expect(result.value.address.zipCode).toBe('13010000');
      expect(result.value.address.reference).toBeNull();
      expect(result.value.address.updatedAt).toBeInstanceOf(Date);
    }
  });

  it('should not update an address when it does not exist', async () => {
    const result = await sut.execute({
      addressId: 'non-existing-address-id',
      street: 'Avenida Central',
    });

    expect(result.isError()).toBe(true);

    if (result.isError()) {
      expect(result.value).toBeInstanceOf(AddressNotFoundError);
    }
  });

  it('should replace the current default address when updating another address as default', async () => {
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
      isDefault: true,
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

  it('should keep the only default address as default when trying to unset it', async () => {
    const address = makeAddress({
      isDefault: true,
    });

    await inMemoryAddressesRepository.create(address);

    const result = await sut.execute({
      addressId: address.id.toString(),
      isDefault: false,
    });

    expect(result.isSuccess()).toBe(true);

    if (result.isSuccess()) {
      expect(result.value.address.isDefault).toBe(true);
    }
  });

  it('should return an unexpected error when something goes wrong', async () => {
    sut = new UpdateAddressService(failingAddressesRepository);

    const result = await sut.execute({
      addressId: 'address-1',
      street: 'Avenida Central',
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
