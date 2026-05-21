import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';

import { UnexpectedError } from '@/core/errors/unexpected-error';
import { OrderNotFoundError } from '@/domain/orders/application/errors/order-not-found-error';
import { DeleteOrderService } from '@/domain/orders/application/services/delete-order-service';
import { DrizzleOrdersRepository } from '@/infra/db/repositories/drizzle-orders-repository';
import { userAuthMiddleware } from '../middlewares/user-auth-middleware';

export const deleteOrderRoute: FastifyPluginAsyncZod = async (app) => {
  app.post(
    '/api/orders/delete/:orderId',
    {
      onRequest: userAuthMiddleware,
      schema: {
        summary: 'Delete order',
        operationId: 'deleteOrder',
        tags: ['Orders'],
        params: z.object({
          orderId: z.string().min(1),
        }),
        response: {
          200: z.object({}),
          400: z.object({ message: z.string() }),
          404: z.object({ message: z.string() }),
          500: z.object({ message: z.string() }),
        },
      },
    },
    async (request, reply) => {
      const ordersRepository = new DrizzleOrdersRepository();
      const deleteOrderService = new DeleteOrderService(ordersRepository);

      try {
        const { orderId } = request.params;

        const result = await deleteOrderService.execute({
          orderId,
        });

        if (result.isError()) {
          const error = result.value;

          if (error instanceof OrderNotFoundError) {
            return reply.status(404).send({ message: error.message });
          }

          if (error instanceof UnexpectedError) {
            return reply.status(500).send({ message: error.message });
          }

          return reply.status(400).send({ message: 'Bad request' });
        }

        return {};
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({ message: 'Internal server error' });
      }
    }
  );
};
