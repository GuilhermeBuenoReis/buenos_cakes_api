import { beforeEach, describe, expect, it } from 'vitest';
import { makeUser } from '../../../../../test/factories/make-user';
import { FailingUsersRepository } from '../../../../../test/repositories/failures/failing-users-repository';
import { InMemoryUsersRepository } from '../../../../../test/repositories/in-memory-users-repository';
import { UniqueEntityID } from '../../../../core/entities/unique-entity-id';
import { UnexpectedError } from '../../../../core/errors/unexpected-error';
import { UserNotFoundError } from '../errors/user-not-found-error';
import { FetchUserByIdService } from './fetch-user-by-id-service';

let inMemoryUsersRepository: InMemoryUsersRepository;
let sut: FetchUserByIdService;

describe('FetchUserByIdService', () => {
  beforeEach(() => {
    inMemoryUsersRepository = new InMemoryUsersRepository();
    sut = new FetchUserByIdService(inMemoryUsersRepository);
  });

  it('should get a user by id', async () => {
    const userId = new UniqueEntityID('user-1');
    const user = makeUser({}, userId);

    await inMemoryUsersRepository.create(user);

    const userIdToFind = userId.toString();

    const result = await sut.execute({
      userId: userIdToFind,
    });

    expect(result.isSuccess()).toBe(true);

    if (result.isSuccess()) {
      expect(result.value.user.id.toString()).toBe(userId.toString());
      expect(result.value.user.email).toBe(user.email);
    }
  });

  it('should not get a user when id does not exist', async () => {
    const nonExistingUserId = 'non-existing-user-id';

    const result = await sut.execute({
      userId: nonExistingUserId,
    });

    expect(result.isError()).toBe(true);

    if (result.isError()) {
      expect(result.value).toBeInstanceOf(UserNotFoundError);
    }
  });

  it('should return an unexpected error when something goes wrong', async () => {
    sut = new FetchUserByIdService(new FailingUsersRepository());

    const userIdToFind = 'user-1';

    const result = await sut.execute({
      userId: userIdToFind,
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
