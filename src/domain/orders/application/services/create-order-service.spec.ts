import { beforeEach, describe, expect, it } from 'vitest';
import { makeAddress } from '../../../../../test/factories/make-address';
import { makeUser } from '../../../../../test/factories/make-user';
import { FailingOrdersRepository } from '../../../../../test/repositories/failures/failing-orders-repository';
import { InMemoryAddressesRepository } from '../../../../../test/repositories/in-memory-addresses-repository';
import { InMemoryOrdersRepository } from '../../../../../test/repositories/in-memory-orders-repository';
import { InMemoryUsersRepository } from '../../../../../test/repositories/in-memory-users-repository';
import { UnexpectedError } from '../../../../core/errors/unexpected-error';
import { AddressNotFoundError } from '../../../users/application/errors/address-not-found-error';
import { UserNotFoundError } from '../../../users/application/errors/user-not-found-error';
import { OrderFulfillmentMethod } from '../../enterprise/entities/order';
import { DeliveryAddressRequiredError } from '../errors/delivery-address-required-error';
import { PickupScheduleRequiredError } from '../errors/pickup-schedule-required-error';
import { CreateOrderService } from './create-order-service';

let inMemoryOrdersRepository: InMemoryOrdersRepository;
let inMemoryUsersRepository: InMemoryUsersRepository;
let inMemoryAddressesRepository: InMemoryAddressesRepository;
let failingOrdersRepository: FailingOrdersRepository;
let sut: CreateOrderService;

describe('CreateOrderService', () => {
  beforeEach(() => {
    inMemoryOrdersRepository = new InMemoryOrdersRepository();
    inMemoryUsersRepository = new InMemoryUsersRepository();
    inMemoryAddressesRepository = new InMemoryAddressesRepository();
    failingOrdersRepository = new FailingOrdersRepository();
    sut = new CreateOrderService(
      inMemoryOrdersRepository,
      inMemoryUsersRepository,
      inMemoryAddressesRepository
    );
  });

  it('should create a pickup order', async () => {
    const user = makeUser();
    const pickupScheduledAt = new Date('2026-05-06T14:00:00.000Z');

    await inMemoryUsersRepository.create(user);

    const result = await sut.execute({
      userId: user.id.toString(),
      fulfillmentMethod: OrderFulfillmentMethod.PICKUP,
      pickupScheduledAt,
      customerNote: 'Sem morango.',
      subtotal: 120,
      total: 120,
    });

    expect(result.isSuccess()).toBe(true);
    expect(inMemoryOrdersRepository.items).toHaveLength(1);

    if (result.isSuccess()) {
      expect(result.value.order.userId.toString()).toBe(user.id.toString());
      expect(result.value.order.fulfillmentMethod).toBe(
        OrderFulfillmentMethod.PICKUP
      );
      expect(result.value.order.deliveryAddressId).toBeNull();
      expect(result.value.order.pickupScheduledAt).toEqual(pickupScheduledAt);
      expect(result.value.order.deliveryFee).toBe(0);
    }
  });

  it('should create a delivery order', async () => {
    const user = makeUser();
    const address = makeAddress({
      userId: user.id,
    });

    await inMemoryUsersRepository.create(user);
    await inMemoryAddressesRepository.create(address);

    const result = await sut.execute({
      userId: user.id.toString(),
      fulfillmentMethod: OrderFulfillmentMethod.DELIVERY,
      deliveryAddressId: address.id.toString(),
      subtotal: 120,
      deliveryFee: 15,
      total: 135,
    });

    expect(result.isSuccess()).toBe(true);

    if (result.isSuccess()) {
      expect(result.value.order.deliveryAddressId?.toString()).toBe(
        address.id.toString()
      );
      expect(result.value.order.pickupScheduledAt).toBeNull();
      expect(result.value.order.deliveryFee).toBe(15);
      expect(result.value.order.total).toBe(135);
    }
  });

  it('should not create an order when user does not exist', async () => {
    const result = await sut.execute({
      userId: 'non-existing-user-id',
      fulfillmentMethod: OrderFulfillmentMethod.PICKUP,
      pickupScheduledAt: new Date(),
      subtotal: 120,
      total: 120,
    });

    expect(result.isError()).toBe(true);

    if (result.isError()) {
      expect(result.value).toBeInstanceOf(UserNotFoundError);
    }
  });

  it('should not create a delivery order without address', async () => {
    const user = makeUser();

    await inMemoryUsersRepository.create(user);

    const result = await sut.execute({
      userId: user.id.toString(),
      fulfillmentMethod: OrderFulfillmentMethod.DELIVERY,
      subtotal: 120,
      total: 120,
    });

    expect(result.isError()).toBe(true);

    if (result.isError()) {
      expect(result.value).toBeInstanceOf(DeliveryAddressRequiredError);
    }
  });

  it('should not create a delivery order with another user address', async () => {
    const user = makeUser();
    const anotherUserAddress = makeAddress();

    await inMemoryUsersRepository.create(user);
    await inMemoryAddressesRepository.create(anotherUserAddress);

    const result = await sut.execute({
      userId: user.id.toString(),
      fulfillmentMethod: OrderFulfillmentMethod.DELIVERY,
      deliveryAddressId: anotherUserAddress.id.toString(),
      subtotal: 120,
      total: 120,
    });

    expect(result.isError()).toBe(true);

    if (result.isError()) {
      expect(result.value).toBeInstanceOf(AddressNotFoundError);
    }
  });

  it('should not create a pickup order without schedule', async () => {
    const user = makeUser();

    await inMemoryUsersRepository.create(user);

    const result = await sut.execute({
      userId: user.id.toString(),
      fulfillmentMethod: OrderFulfillmentMethod.PICKUP,
      subtotal: 120,
      total: 120,
    });

    expect(result.isError()).toBe(true);

    if (result.isError()) {
      expect(result.value).toBeInstanceOf(PickupScheduleRequiredError);
    }
  });

  it('should return an unexpected error when orders repository fails', async () => {
    sut = new CreateOrderService(
      failingOrdersRepository,
      inMemoryUsersRepository,
      inMemoryAddressesRepository
    );

    const user = makeUser();

    await inMemoryUsersRepository.create(user);

    const result = await sut.execute({
      userId: user.id.toString(),
      fulfillmentMethod: OrderFulfillmentMethod.PICKUP,
      pickupScheduledAt: new Date(),
      subtotal: 120,
      total: 120,
    });

    expect(result.isError()).toBe(true);

    if (result.isError()) {
      expect(result.value).toBeInstanceOf(UnexpectedError);
    }
  });
});
