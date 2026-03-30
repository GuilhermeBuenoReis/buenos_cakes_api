import { beforeEach, describe, expect, it } from 'vitest';
import { makeUser } from '../../test/factories/make-user';
import { InMemoryUsersRepository } from '../../test/repositories/in-memory-users-repository';
import { UniqueEntityID } from '../utils/unique-entity-id';
import { UserNotFoundError } from './errors/user-not-found-error';
import { GetUserByIdService } from './get-user-by-id-service';

let inMemoryUsersRepository: InMemoryUsersRepository;
let sut: GetUserByIdService;

describe('GetUserByIdService', () => {
  beforeEach(() => {
    inMemoryUsersRepository = new InMemoryUsersRepository();
    sut = new GetUserByIdService(inMemoryUsersRepository);
  });

  it('should get a user by id', async () => {
    const userId = new UniqueEntityID('user-1');
    const user = makeUser({}, userId);

    await inMemoryUsersRepository.create(user);

    const result = await sut.execute({
      userId: userId.toString(),
    });

    expect(result.isSuccess()).toBe(true);

    if (result.isSuccess()) {
      expect(result.value.user.id.toString()).toBe(userId.toString());
      expect(result.value.user.email).toBe(user.email);
    }
  });

  it('should not get a user when id does not exist', async () => {
    const result = await sut.execute({
      userId: 'non-existing-user-id',
    });

    expect(result.isError()).toBe(true);

    if (result.isError()) {
      expect(result.value).toBeInstanceOf(UserNotFoundError);
    }
  });
});
