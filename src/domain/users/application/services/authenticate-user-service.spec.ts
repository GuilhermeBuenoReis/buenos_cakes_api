import { beforeEach, describe, expect, it } from 'vitest';
import { FakeHasher } from '../../../../../test/cryptography/fake-hash-generator';
import { FakeTokenGenerator } from '../../../../../test/cryptography/fake-token-generator';
import { makeUser } from '../../../../../test/factories/make-user';
import { FailingUsersRepository } from '../../../../../test/repositories/failures/failing-users-repository';
import { InMemoryUsersRepository } from '../../../../../test/repositories/in-memory-users-repository';
import { AuthenticateUserService } from './authenticate-user-service';
import { InvalidCredentialsError } from '../errors/invalid-credentials-error';
import { UnexpectedError } from '../../../../core/errors/unexpected-error';

let inMemoryUsersRepository: InMemoryUsersRepository;
let fakeHasher: FakeHasher;
let fakeTokenGenerator: FakeTokenGenerator;
let sut: AuthenticateUserService;

describe('AuthenticateUserService', () => {
  beforeEach(() => {
    inMemoryUsersRepository = new InMemoryUsersRepository();
    fakeHasher = new FakeHasher();
    fakeTokenGenerator = new FakeTokenGenerator();

    sut = new AuthenticateUserService(
      inMemoryUsersRepository,
      fakeHasher,
      fakeTokenGenerator
    );
  });

  it('should authenticate a user', async () => {
    const user = makeUser({
      email: 'john@example.com',
      password: '123456_hashed',
    });

    await inMemoryUsersRepository.create(user);

    const result = await sut.execute({
      email: 'john@example.com',
      password: '123456',
    });

    expect(result.isSuccess()).toBe(true);

    if (result.isSuccess()) {
      expect(result.value.user.id.toString()).toBe(user.id.toString());
      expect(result.value.user.email).toBe(user.email);
      expect(result.value.accessToken).toBe(`token-${user.id.toString()}`);
    }
  });

  it('should not authenticate a user with an invalid email', async () => {
    const result = await sut.execute({
      email: 'john@example.com',
      password: '123456',
    });

    expect(result.isError()).toBe(true);

    if (result.isError()) {
      expect(result.value).toBeInstanceOf(InvalidCredentialsError);
    }
  });

  it('should not authenticate a user with an invalid password', async () => {
    const user = makeUser({
      email: 'john@example.com',
      password: '123456_hashed',
    });

    await inMemoryUsersRepository.create(user);

    const result = await sut.execute({
      email: 'john@example.com',
      password: 'wrong-password',
    });

    expect(result.isError()).toBe(true);

    if (result.isError()) {
      expect(result.value).toBeInstanceOf(InvalidCredentialsError);
    }
  });

  it('should return an unexpected error when something goes wrong', async () => {
    sut = new AuthenticateUserService(
      new FailingUsersRepository(),
      fakeHasher,
      fakeTokenGenerator
    );

    const result = await sut.execute({
      email: 'john@example.com',
      password: '123456',
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
