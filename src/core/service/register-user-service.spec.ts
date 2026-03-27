import { describe, expect, it } from 'vitest';
import { FakeHasher } from '../../test/cryptography/fake-hash-generator';
import { makeRegisterUserServiceRequest } from '../../test/factories/make-register-user-service-request';
import { makeUser } from '../../test/factories/make-user';
import { InMemoryUsersRepository } from '../../test/repositories/in-memory-users-repository';
import { UserAlreadyExistsError } from './errors/user-already-exists-error';
import { RegisterUserService } from './register-user-service';

describe('RegisterUserService', () => {
  it('should register a new user', async () => {
    const usersRepository = new InMemoryUsersRepository();
    const hashGenerator = new FakeHasher();

    const sut = new RegisterUserService(usersRepository, hashGenerator);

    const request = makeRegisterUserServiceRequest({
      password: '123456',
    });

    const result = await sut.execute(request);

    expect(result.isSuccess()).toBe(true);
    expect(usersRepository.items).toHaveLength(1);

    if (result.isSuccess()) {
      expect(result.value.user.email).toBe(request.email);
      expect(result.value.user.passwordHash).toBe(`${request.password}_hashed`);
      expect(result.value.user.role).toBe('customer');
    }
  });

  it('should not register a user with the same email twice', async () => {
    const usersRepository = new InMemoryUsersRepository();
    const hashGenerator = new FakeHasher();
    const sut = new RegisterUserService(usersRepository, hashGenerator);

    const existingUser = makeUser({
      email: 'john@example.com',
      passwordHash: 'existing-password-hash',
    });

    await usersRepository.create(existingUser);

    const request = makeRegisterUserServiceRequest({
      email: existingUser.email,
    });

    const result = await sut.execute(request);

    expect(result.isError()).toBe(true);
    expect(usersRepository.items).toHaveLength(1);

    if (result.isError()) {
      expect(result.value).toBeInstanceOf(UserAlreadyExistsError);
    }
  });
});
