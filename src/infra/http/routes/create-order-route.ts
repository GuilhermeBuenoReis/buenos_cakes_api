import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';

import { UnexpectedError } from '@/core/errors/unexpected-error';
import { DeliveryAddressRequiredError } from '@/domain/orders/application/errors/delivery-address-required-error';
import { PickupScheduleRequiredError } from '@/domain/orders/application/errors/pickup-schedule-required-error';
import { CreateOrderService } from '@/domain/orders/application/services/create-order-service';
import type { OrderFulfillmentMethod } from '@/domain/orders/enterprise/entities/order';
import { AddressNotFoundError } from '@/domain/users/application/errors/address-not-found-error';
import { UserNotFoundError } from '@/domain/users/application/errors/user-not-found-error';
import { DrizzleAddressesRepository } from '@/infra/db/repositories/drizzle-address-repositorie';
import { DrizzleOrdersRepository } from '@/infra/db/repositories/drizzle-orders-repository';
import { DrizzleUsersRepository } from '@/infra/db/repositories/drizzle-users-repository';
import { OrderPresenter } from '@/infra/presenters/order-presenter';
import { userAuthMiddleware } from '../middlewares/user-auth-middleware';
import { parsePickupScheduledAt } from '../utils/parse-pickup-scheduled-at';

export const createOrderRoute: FastifyPluginAsyncZod = async (app) => {
  app.post(
    '/api/orders/create',
    {
      onRequest: userAuthMiddleware,
      schema: {
        summary: 'Create an order',
        operationId: 'createOrder',
        tags: ['Orders'],
        body: z.object({
          userId: z.string().min(1),
          fulfillmentMethod: z.enum(['pickup', 'delivery']),
          deliveryAddressId: z.string().nullable().optional(),
          pickupScheduledAt: z.string().min(1).nullable().optional(),
          customerNote: z.string().nullable().optional(),
          subtotal: z.number(),
          deliveryFee: z.number().optional(),
          total: z.number(),
        }),
        response: {
          201: z.object({
            order: z.object({
              id: z.string(),
              userId: z.string(),
              status: z.enum([
                'pending',
                'confirmed',
                'preparing',
                'ready',
                'completed',
                'canceled',
              ]),
              fulfillmentMethod: z.enum(['pickup', 'delivery']),
              deliveryAddressId: z.string().nullable().optional(),
              pickupScheduledAt: z.iso.datetime().nullable().optional(),
              customerNote: z.string().nullable().optional(),
              subtotal: z.number(),
              deliveryFee: z.number(),
              total: z.number(),
              createdAt: z.iso.datetime(),
              updatedAt: z.iso.datetime().nullable().optional(),
            }),
          }),
          400: z.object({ message: z.string() }),
          404: z.object({ message: z.string() }),
          500: z.object({ message: z.string() }),
        },
      },
    },
    async (request, reply) => {
      const ordersRepository = new DrizzleOrdersRepository();
      const usersRepository = new DrizzleUsersRepository();
      const addressesRepository = new DrizzleAddressesRepository();
      const createOrderService = new CreateOrderService(
        ordersRepository,
        usersRepository,
        addressesRepository
      );

      try {
        const {
          userId,
          fulfillmentMethod,
          deliveryAddressId,
          pickupScheduledAt,
          customerNote,
          subtotal,
          deliveryFee,
          total,
        } = request.body;

        const parsedPickupScheduledAt =
          parsePickupScheduledAt(pickupScheduledAt);

        if (
          pickupScheduledAt !== undefined &&
          pickupScheduledAt !== null &&
          parsedPickupScheduledAt === null
        ) {
          return reply
            .status(400)
            .send({ message: 'Invalid pickup scheduled date.' });
        }

        const result = await createOrderService.execute({
          userId,
          fulfillmentMethod: fulfillmentMethod as OrderFulfillmentMethod,
          deliveryAddressId,
          pickupScheduledAt: parsedPickupScheduledAt,
          customerNote,
          subtotal,
          deliveryFee,
          total,
        });

        if (result.isError()) {
          const error = result.value;

          if (
            error instanceof UserNotFoundError ||
            error instanceof AddressNotFoundError
          ) {
            return reply.status(404).send({ message: error.message });
          }

          if (
            error instanceof DeliveryAddressRequiredError ||
            error instanceof PickupScheduleRequiredError
          ) {
            return reply.status(400).send({ message: error.message });
          }

          if (error instanceof UnexpectedError) {
            return reply.status(500).send({ message: error.message });
          }

          return reply.status(400).send({ message: 'Bad request' });
        }

        const { order } = result.value;

        return reply.status(201).send({
          order: OrderPresenter.toHTTP(order),
        });
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({ message: 'Internal server error' });
      }
    }
  );
};
