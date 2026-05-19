import { beforeEach, describe, expect, it } from 'vitest';
import { makeAddress } from '../../../../../test/factories/make-address';
import { makeUser } from '../../../../../test/factories/make-user';
import { FailingAddressesRepository } from '../../../../../test/repositories/failures/failing-addresses-repository';
import { FailingUsersRepository } from '../../../../../test/repositories/failures/failing-users-repository';
import { InMemoryAddressesRepository } from '../../../../../test/repositories/in-memory-addresses-repository';
import { InMemoryUsersRepository } from '../../../../../test/repositories/in-memory-users-repository';
import { UnexpectedError } from '../../../../core/errors/unexpected-error';
import { UserNotFoundError } from '../errors/user-not-found-error';
import { CreateAddressService } from './create-address-service';

let inMemoryUsersRepository: InMemoryUsersRepository;
let inMemoryAddressesRepository: InMemoryAddressesRepository;
let sut: CreateAddressService;

describe('CreateAddressService', () => {
  beforeEach(() => {
    inMemoryUsersRepository = new InMemoryUsersRepository();
    inMemoryAddressesRepository = new InMemoryAddressesRepository();
    sut = new CreateAddressService(
      inMemoryUsersRepository,
      inMemoryAddressesRepository
    );
  });

  it('should create an address', async () => {
    const user = makeUser();

    await inMemoryUsersRepository.create(user);

    const result = await sut.execute({
      userId: user.id.toString(),
      label: 'home',
      recipientName: 'John Doe',
      street: 'Rua das Flores',
      houseNumber: '123',
      complement: 'Apto 12',
      city: 'Sao Paulo',
      state: 'SP',
      zipCode: '01001000',
      reference: 'Um pe de jambo',
    });

    expect(result.isSuccess()).toBe(true);
    expect(inMemoryAddressesRepository.items).toHaveLength(1);

    if (result.isSuccess()) {
      expect(result.value.address.userId.toString()).toBe(user.id.toString());
      expect(result.value.address.label).toBe('home');
      expect(result.value.address.isDefault).toBe(true);
    }
  });

  it('should not create an address for a non-existing user', async () => {
    const result = await sut.execute({
      userId: 'non-existing-user-id',
      label: 'home',
      recipientName: 'John Doe',
      street: 'Rua das Flores',
      houseNumber: '123',
      city: 'Sao Paulo',
      state: 'SP',
      zipCode: '01001000',
    });

    expect(result.isError()).toBe(true);
    expect(inMemoryAddressesRepository.items).toHaveLength(0);

    if (result.isError()) {
      expect(result.value).toBeInstanceOf(UserNotFoundError);
    }
  });

  it('should keep the first user address as default automatically', async () => {
    const user = makeUser();

    await inMemoryUsersRepository.create(user);

    const result = await sut.execute({
      userId: user.id.toString(),
      label: 'work',
      recipientName: 'John Doe',
      street: 'Avenida Central',
      houseNumber: '456',
      city: 'Sao Paulo',
      state: 'SP',
      zipCode: '02002000',
      isDefault: false,
    });

    expect(result.isSuccess()).toBe(true);

    if (result.isSuccess()) {
      expect(result.value.address.isDefault).toBe(true);
    }
  });

  it('should replace the current default address when a new default is created', async () => {
    const user = makeUser();
    const existingDefaultAddress = makeAddress({
      userId: user.id,
      isDefault: true,
    });

    await inMemoryUsersRepository.create(user);
    await inMemoryAddressesRepository.create(existingDefaultAddress);

    const result = await sut.execute({
      userId: user.id.toString(),
      label: 'work',
      recipientName: 'John Doe',
      street: 'Avenida Central',
      houseNumber: '456',
      city: 'Sao Paulo',
      state: 'SP',
      zipCode: '02002000',
      isDefault: true,
    });

    expect(result.isSuccess()).toBe(true);

    const savedDefaultAddress = inMemoryAddressesRepository.items.find((item) =>
      item.id.equals(existingDefaultAddress.id)
    );

    if (result.isSuccess() && savedDefaultAddress) {
      expect(savedDefaultAddress.isDefault).toBe(false);
      expect(result.value.address.isDefault).toBe(true);
    }
  });

  it('should return an unexpected error when something goes wrong', async () => {
    sut = new CreateAddressService(
      new FailingUsersRepository(),
      new FailingAddressesRepository()
    );

    const result = await sut.execute({
      userId: 'user-1',
      label: 'home',
      recipientName: 'John Doe',
      street: 'Rua das Flores',
      houseNumber: '123',
      city: 'Sao Paulo',
      state: 'SP',
      zipCode: '01001000',
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
