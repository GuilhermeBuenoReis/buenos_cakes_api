import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';

import { UnexpectedError } from '@/core/errors/unexpected-error';
import { ListOrdersService } from '@/domain/orders/application/services/list-orders-service';
import { DrizzleOrdersRepository } from '@/infra/db/repositories/drizzle-orders-repository';
import { OrderPresenter } from '@/infra/presenters/order-presenter';
import { userAuthMiddleware } from '../middlewares/user-auth-middleware';

export const listOrdersRoute: FastifyPluginAsyncZod = async (app) => {
  app.get(
    '/api/orders',
    {
      onRequest: userAuthMiddleware,
      schema: {
        summary: 'List orders',
        operationId: 'listOrders',
        tags: ['Orders'],
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
          500: z.object({ message: z.string() }),
        },
      },
    },
    async (request, reply) => {
      const ordersRepository = new DrizzleOrdersRepository();
      const listOrdersService = new ListOrdersService(ordersRepository);

      try {
        const { page } = request.query;

        const result = await listOrdersService.execute({
          page,
        });

        if (result.isError()) {
          const error = result.value;

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
