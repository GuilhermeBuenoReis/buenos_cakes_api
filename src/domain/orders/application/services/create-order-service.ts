import { type Either, error, success } from '../../../../core/either';
import { UniqueEntityID } from '../../../../core/entities/unique-entity-id';
import { UnexpectedError } from '../../../../core/errors/unexpected-error';
import { AddressNotFoundError } from '../../../users/application/errors/address-not-found-error';
import { UserNotFoundError } from '../../../users/application/errors/user-not-found-error';
import type { AddressesRepository } from '../../../users/application/repositories/addresses-repository';
import type { UsersRepository } from '../../../users/application/repositories/users-repository';
import {
  Order,
  OrderFulfillmentMethod,
} from '../../enterprise/entities/order';
import { DeliveryAddressRequiredError } from '../errors/delivery-address-required-error';
import { PickupScheduleRequiredError } from '../errors/pickup-schedule-required-error';
import type { OrdersRepository } from '../repositories/orders-repository';

export interface CreateOrderServiceRequest {
  userId: string;
  fulfillmentMethod: OrderFulfillmentMethod;
  deliveryAddressId?: string | null;
  pickupScheduledAt?: Date | null;
  customerNote?: string | null;
  subtotal: number;
  deliveryFee?: number;
  total: number;
}

export type CreateOrderServiceResponse = Either<
  | UserNotFoundError
  | AddressNotFoundError
  | DeliveryAddressRequiredError
  | PickupScheduleRequiredError
  | UnexpectedError,
  {
    order: Order;
  }
>;

export class CreateOrderService {
  constructor(
    private ordersRepository: OrdersRepository,
    private usersRepository: UsersRepository,
    private addressesRepository: AddressesRepository
  ) {}

  async execute({
    userId,
    fulfillmentMethod,
    deliveryAddressId,
    pickupScheduledAt,
    customerNote,
    subtotal,
    deliveryFee,
    total,
  }: CreateOrderServiceRequest): Promise<CreateOrderServiceResponse> {
    try {
      const user = await this.usersRepository.findById(userId);

      if (!user) {
        return error(new UserNotFoundError(userId));
      }

      if (fulfillmentMethod === OrderFulfillmentMethod.DELIVERY) {
        if (!deliveryAddressId) {
          return error(new DeliveryAddressRequiredError());
        }

        const deliveryAddress =
          await this.addressesRepository.findById(deliveryAddressId);

        if (!deliveryAddress || !deliveryAddress.userId.equals(user.id)) {
          return error(new AddressNotFoundError(deliveryAddressId));
        }
      }

      if (
        fulfillmentMethod === OrderFulfillmentMethod.PICKUP &&
        !pickupScheduledAt
      ) {
        return error(new PickupScheduleRequiredError());
      }

      const order = Order.create({
        userId: user.id,
        fulfillmentMethod,
        deliveryAddressId:
          fulfillmentMethod === OrderFulfillmentMethod.DELIVERY
            ? new UniqueEntityID(deliveryAddressId ?? undefined)
            : null,
        pickupScheduledAt:
          fulfillmentMethod === OrderFulfillmentMethod.PICKUP
            ? pickupScheduledAt
            : null,
        customerNote,
        subtotal,
        deliveryFee:
          fulfillmentMethod === OrderFulfillmentMethod.DELIVERY
            ? deliveryFee
            : 0,
        total,
      });

      await this.ordersRepository.create(order);

      return success({
        order,
      });
    } catch {
      return error(new UnexpectedError());
    }
  }
}
