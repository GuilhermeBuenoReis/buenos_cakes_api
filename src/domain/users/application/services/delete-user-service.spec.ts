import { beforeEach, describe, expect, it } from 'vitest';
import { makeUser } from '../../../../test/factories/make-user';
import { FailingUsersRepository } from '../../../../test/repositories/failures/failing-users-repository';
import { InMemoryUsersRepository } from '../../../../test/repositories/in-memory-users-repository';
import { DeleteUserService } from './delete-user-service';
import { UnexpectedError } from '../../../../core/errors/unexpected-error';
import { UserNotFoundError } from '../errors/user-not-found-error';

let inMemoryUsersRepository: InMemoryUsersRepository;
let sut: DeleteUserService;

describe('DeleteUserService', () => {
  beforeEach(() => {
    inMemoryUsersRepository = new InMemoryUsersRepository();
    sut = new DeleteUserService(inMemoryUsersRepository);
  });

  it('should delete a user', async () => {
    const user = makeUser();

    await inMemoryUsersRepository.create(user);

    const result = await sut.execute({
      userId: user.id.toString(),
    });

    expect(result.isSuccess()).toBe(true);
    expect(inMemoryUsersRepository.items).toHaveLength(0);

    if (result.isSuccess()) {
      expect(result.value.message).toBe('User deleted successfully.');
    }
  });

  it('should not delete a user when id does not exist', async () => {
    const result = await sut.execute({
      userId: 'non-existing-user-id',
    });

    expect(result.isError()).toBe(true);

    if (result.isError()) {
      expect(result.value).toBeInstanceOf(UserNotFoundError);
    }
  });

  it('should return an unexpected error when something goes wrong', async () => {
    sut = new DeleteUserService(new FailingUsersRepository());

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
