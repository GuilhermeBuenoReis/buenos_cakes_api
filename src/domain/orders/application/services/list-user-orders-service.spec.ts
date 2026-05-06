import { beforeEach, describe, expect, it } from 'vitest';
import { makeOrder } from '../../../../../test/factories/make-order';
import { makeUser } from '../../../../../test/factories/make-user';
import { FailingOrdersRepository } from '../../../../../test/repositories/failures/failing-orders-repository';
import { FailingUsersRepository } from '../../../../../test/repositories/failures/failing-users-repository';
import { InMemoryOrdersRepository } from '../../../../../test/repositories/in-memory-orders-repository';
import { InMemoryUsersRepository } from '../../../../../test/repositories/in-memory-users-repository';
import { UnexpectedError } from '../../../../core/errors/unexpected-error';
import { UserNotFoundError } from '../../../users/application/errors/user-not-found-error';
import { ListUserOrdersService } from './list-user-orders-service';

let inMemoryOrdersRepository: InMemoryOrdersRepository;
let inMemoryUsersRepository: InMemoryUsersRepository;
let failingOrdersRepository: FailingOrdersRepository;
let failingUsersRepository: FailingUsersRepository;
let sut: ListUserOrdersService;

describe('ListUserOrdersService', () => {
  beforeEach(() => {
    inMemoryOrdersRepository = new InMemoryOrdersRepository();
    inMemoryUsersRepository = new InMemoryUsersRepository();
    failingOrdersRepository = new FailingOrdersRepository();
    failingUsersRepository = new FailingUsersRepository();
    sut = new ListUserOrdersService(
      inMemoryUsersRepository,
      inMemoryOrdersRepository
    );
  });

  it('should list orders from a user', async () => {
    const user = makeUser();
    const anotherUser = makeUser();

    await inMemoryUsersRepository.create(user);
    await inMemoryUsersRepository.create(anotherUser);
    await inMemoryOrdersRepository.create(makeOrder({ userId: user.id }));
    await inMemoryOrdersRepository.create(makeOrder({ userId: user.id }));
    await inMemoryOrdersRepository.create(makeOrder({ userId: anotherUser.id }));

    const result = await sut.execute({
      userId: user.id.toString(),
      page: 1,
    });

    expect(result.isSuccess()).toBe(true);

    if (result.isSuccess()) {
      expect(result.value.orders).toHaveLength(2);
      expect(
        result.value.orders.every((order) => order.userId.equals(user.id))
      ).toBe(true);
    }
  });

  it('should not list orders from a non-existing user', async () => {
    const result = await sut.execute({
      userId: 'non-existing-user-id',
      page: 1,
    });

    expect(result.isError()).toBe(true);

    if (result.isError()) {
      expect(result.value).toBeInstanceOf(UserNotFoundError);
    }
  });

  it('should return an unexpected error when orders repository fails', async () => {
    sut = new ListUserOrdersService(
      inMemoryUsersRepository,
      failingOrdersRepository
    );

    const user = makeUser();

    await inMemoryUsersRepository.create(user);

    const result = await sut.execute({
      userId: user.id.toString(),
      page: 1,
    });

    expect(result.isError()).toBe(true);

    if (result.isError()) {
      expect(result.value).toBeInstanceOf(UnexpectedError);
    }
  });

  it('should return an unexpected error when users repository fails', async () => {
    sut = new ListUserOrdersService(
      failingUsersRepository,
      inMemoryOrdersRepository
    );

    const result = await sut.execute({
      userId: 'user-1',
      page: 1,
    });

    expect(result.isError()).toBe(true);

    if (result.isError()) {
      expect(result.value).toBeInstanceOf(UnexpectedError);
    }
  });
});
