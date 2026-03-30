import { beforeEach, describe, expect, it } from 'vitest';
import { FakeHasher } from '../../test/cryptography/fake-hash-generator';
import { makeUser } from '../../test/factories/make-user';
import { InMemoryUsersRepository } from '../../test/repositories/in-memory-users-repository';
import { UserAlreadyExistsError } from './errors/user-already-exists-error';
import { RegisterUserService } from './register-user-service';

let inMemoryUsersRepository: InMemoryUsersRepository;
let fakeHasher: FakeHasher;
let sut: RegisterUserService;

describe('RegisterUserService', () => {
  beforeEach(() => {
    inMemoryUsersRepository = new InMemoryUsersRepository();
    fakeHasher = new FakeHasher();

    sut = new RegisterUserService(inMemoryUsersRepository, fakeHasher);
  });

  it('should register a new user', async () => {
    const user = {
      name: 'John Doe',
      email: 'john.doe@example.com',
      password: '123456',
    };

    const result = await sut.execute(user);

    expect(result.isSuccess()).toBe(true);
    expect(inMemoryUsersRepository.items).toHaveLength(1);

    if (result.isSuccess()) {
      expect(result.value.user.email).toBe(user.email);
      expect(result.value.user.password).toBe(`${user.password}_hashed`);
      expect(result.value.user.role).toBe('customer');
    }
  });

  it('should not register a user with the same email twice', async () => {
    const existingUser = makeUser({
      email: 'john@example.com',
      password: 'existing-password-hash',
    });

    await inMemoryUsersRepository.create(existingUser);

    const user = {
      name: 'Jane Doe',
      email: 'john@example.com',
      password: '123456',
    };

    const result = await sut.execute(user);

    expect(result.isError()).toBe(true);
    expect(inMemoryUsersRepository.items).toHaveLength(1);

    if (result.isError()) {
      expect(result.value).toBeInstanceOf(UserAlreadyExistsError);
    }
  });
});
