import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';

import { UnexpectedError } from '@/core/errors/unexpected-error';
import { ListUserOrdersService } from '@/domain/orders/application/services/list-user-orders-service';
import { UserNotFoundError } from '@/domain/users/application/errors/user-not-found-error';
import { DrizzleOrdersRepository } from '@/infra/db/repositories/drizzle-orders-repository';
import { DrizzleUsersRepository } from '@/infra/db/repositories/drizzle-users-repository';
import { OrderPresenter } from '@/infra/presenters/order-presenter';
import { userAuthMiddleware } from '../middlewares/user-auth-middleware';

export const listUserOrdersRoute: FastifyPluginAsyncZod = async (app) => {
  app.get(
    '/api/users/:userId/orders',
    {
      onRequest: userAuthMiddleware,
      schema: {
        summary: 'List user orders',
        operationId: 'listUserOrders',
        tags: ['Orders'],
        params: z.object({
          userId: z.string().min(1),
        }),
        querystring: z.object({
          page: z.coerce.number().int().positive().default(1),
        }),
        response: {
          200: z.object({
            orders: z.array(
              z.object({
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
              })
            ),
          }),
          400: z.object({ message: z.string() }),
          404: z.object({ message: z.string() }),
          500: z.object({ message: z.string() }),
        },
      },
    },
    async (request, reply) => {
      const usersRepository = new DrizzleUsersRepository();
      const ordersRepository = new DrizzleOrdersRepository();
      const listUserOrdersService = new ListUserOrdersService(
        usersRepository,
        ordersRepository
      );

      try {
        const { userId } = request.params;
        const { page } = request.query;

        const result = await listUserOrdersService.execute({
          userId,
          page,
        });

        if (result.isError()) {
          const error = result.value;

          if (error instanceof UserNotFoundError) {
            return reply.status(404).send({ message: error.message });
          }

          if (error instanceof UnexpectedError) {
            return reply.status(500).send({ message: error.message });
          }

          return reply.status(400).send({ message: 'Bad request' });
        }

        const { orders } = result.value;

        return reply.status(200).send({
          orders: orders.map(OrderPresenter.toHTTP),
        });
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({ message: 'Internal server error' });
      }
    }
  );
};
