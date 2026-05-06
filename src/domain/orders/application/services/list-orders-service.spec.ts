import { beforeEach, describe, expect, it } from 'vitest';
import { makeOrder } from '../../../../../test/factories/make-order';
import { FailingOrdersRepository } from '../../../../../test/repositories/failures/failing-orders-repository';
import { InMemoryOrdersRepository } from '../../../../../test/repositories/in-memory-orders-repository';
import { UnexpectedError } from '../../../../core/errors/unexpected-error';
import { ListOrdersService } from './list-orders-service';

let inMemoryOrdersRepository: InMemoryOrdersRepository;
let failingOrdersRepository: FailingOrdersRepository;
let sut: ListOrdersService;

describe('ListOrdersService', () => {
  beforeEach(() => {
    inMemoryOrdersRepository = new InMemoryOrdersRepository();
    failingOrdersRepository = new FailingOrdersRepository();
    sut = new ListOrdersService(inMemoryOrdersRepository);
  });

  it('should list orders', async () => {
    await inMemoryOrdersRepository.create(makeOrder());
    await inMemoryOrdersRepository.create(makeOrder());

    const result = await sut.execute({
      page: 1,
    });

    expect(result.isSuccess()).toBe(true);

    if (result.isSuccess()) {
      expect(result.value.orders).toHaveLength(2);
    }
  });

  it('should paginate orders', async () => {
    for (let i = 1; i <= 22; i++) {
      await inMemoryOrdersRepository.create(makeOrder());
    }

    const result = await sut.execute({
      page: 2,
    });

    expect(result.isSuccess()).toBe(true);

    if (result.isSuccess()) {
      expect(result.value.orders).toHaveLength(2);
    }
  });

  it('should return an unexpected error when repository fails', async () => {
    sut = new ListOrdersService(failingOrdersRepository);

    const result = await sut.execute({
      page: 1,
    });

    expect(result.isError()).toBe(true);

    if (result.isError()) {
      expect(result.value).toBeInstanceOf(UnexpectedError);
    }
  });
});
