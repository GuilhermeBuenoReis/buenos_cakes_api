import { beforeEach, describe, expect, it } from 'vitest';
import { makeUser } from '../../../../test/factories/make-user';
import { FailingUsersRepository } from '../../../../test/repositories/failures/failing-users-repository';
import { InMemoryUsersRepository } from '../../../../test/repositories/in-memory-users-repository';
import { UnexpectedError } from '../../../../core/errors/unexpected-error';
import { UserAlreadyExistsError } from '../errors/user-already-exists-error';
import { UserNotFoundError } from '../errors/user-not-found-error';
import { UpdateUserService } from './update-user-service';

let inMemoryUsersRepository: InMemoryUsersRepository;
let sut: UpdateUserService;

describe('UpdateUserService', () => {
  beforeEach(() => {
    inMemoryUsersRepository = new InMemoryUsersRepository();
    sut = new UpdateUserService(inMemoryUsersRepository);
  });

  it('should update a user', async () => {
    const user = makeUser({
      name: 'John Doe',
      email: 'john@example.com',
      cpf: '12345678901',
      phone: '11999999999',
    });

    await inMemoryUsersRepository.create(user);

    const result = await sut.execute({
      userId: user.id.toString(),
      name: 'Jane Doe',
      email: 'jane@example.com',
      cpf: null,
      phone: '11888888888',
    });

    expect(result.isSuccess()).toBe(true);

    if (result.isSuccess()) {
      expect(result.value.user.name).toBe('Jane Doe');
      expect(result.value.user.email).toBe('jane@example.com');
      expect(result.value.user.cpf).toBeNull();
      expect(result.value.user.phone).toBe('11888888888');
      expect(result.value.user.updatedAt).toBeInstanceOf(Date);
    }
  });

  it('should not update a user when it does not exist', async () => {
    const result = await sut.execute({
      userId: 'non-existing-user-id',
      name: 'Jane Doe',
    });

    expect(result.isError()).toBe(true);

    if (result.isError()) {
      expect(result.value).toBeInstanceOf(UserNotFoundError);
    }
  });

  it('should not update a user with an email that is already in use', async () => {
    const user = makeUser({
      email: 'john@example.com',
    });

    const anotherUser = makeUser({
      email: 'jane@example.com',
    });

    await inMemoryUsersRepository.create(user);
    await inMemoryUsersRepository.create(anotherUser);

    const result = await sut.execute({
      userId: user.id.toString(),
      email: anotherUser.email,
    });

    expect(result.isError()).toBe(true);

    if (result.isError()) {
      expect(result.value).toBeInstanceOf(UserAlreadyExistsError);
    }
  });

  it('should return an unexpected error when something goes wrong', async () => {
    sut = new UpdateUserService(new FailingUsersRepository());

    const result = await sut.execute({
      userId: 'user-1',
      name: 'Jane Doe',
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
