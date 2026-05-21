import { beforeEach, describe, expect, it } from 'vitest';
import { makeAddress } from '../../../../../test/factories/make-address';
import { makeUser } from '../../../../../test/factories/make-user';
import { FailingAddressesRepository } from '../../../../../test/repositories/failures/failing-addresses-repository';
import { FailingUsersRepository } from '../../../../../test/repositories/failures/failing-users-repository';
import { InMemoryAddressesRepository } from '../../../../../test/repositories/in-memory-addresses-repository';
import { InMemoryUsersRepository } from '../../../../../test/repositories/in-memory-users-repository';
import { UnexpectedError } from '../../../../core/errors/unexpected-error';
import { UserNotFoundError } from '../errors/user-not-found-error';
import { ListUserAddressesService } from './list-user-addresses-service';

let inMemoryUsersRepository: InMemoryUsersRepository;
let inMemoryAddressesRepository: InMemoryAddressesRepository;
let failingUsersRepository: FailingUsersRepository;
let failingAddressesRepository: FailingAddressesRepository;
let sut: ListUserAddressesService;

describe('ListUserAddressesService', () => {
  beforeEach(() => {
    inMemoryUsersRepository = new InMemoryUsersRepository();
    inMemoryAddressesRepository = new InMemoryAddressesRepository();
    failingUsersRepository = new FailingUsersRepository();
    failingAddressesRepository = new FailingAddressesRepository();

    sut = new ListUserAddressesService(
      inMemoryUsersRepository,
      inMemoryAddressesRepository
    );
  });

  it('should list all addresses from a user', async () => {
    const user = makeUser();
    const anotherUser = makeUser();
    const firstAddress = makeAddress({ userId: user.id });
    const secondAddress = makeAddress({ userId: user.id });
    const unrelatedAddress = makeAddress({ userId: anotherUser.id });

    await inMemoryUsersRepository.create(user);
    await inMemoryUsersRepository.create(anotherUser);
    await inMemoryAddressesRepository.create(firstAddress);
    await inMemoryAddressesRepository.create(secondAddress);
    await inMemoryAddressesRepository.create(unrelatedAddress);

    const result = await sut.execute({
      userId: user.id.toString(),
    });

    expect(result.isSuccess()).toBe(true);

    if (result.isSuccess()) {
      expect(result.value.addresses).toHaveLength(2);
      expect(
        result.value.addresses.map((address) => address.id.toString())
      ).toEqual([firstAddress.id.toString(), secondAddress.id.toString()]);
    }
  });

  it('should not list addresses for a non-existing user', async () => {
    const result = await sut.execute({
      userId: 'non-existing-user-id',
    });

    expect(result.isError()).toBe(true);

    if (result.isError()) {
      expect(result.value).toBeInstanceOf(UserNotFoundError);
    }
  });

  it('should return an unexpected error when something goes wrong', async () => {
    sut = new ListUserAddressesService(
      failingUsersRepository,
      failingAddressesRepository
    );

    const result = await sut.execute({
      userId: 'user-1',
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
