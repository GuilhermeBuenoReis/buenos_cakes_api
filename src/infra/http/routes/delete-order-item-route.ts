import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';

import { UnexpectedError } from '@/core/errors/unexpected-error';
import { OrderItemNotFoundError } from '@/domain/orders/application/errors/order-item-not-found-error';
import { DeleteOrderItemService } from '@/domain/orders/application/services/delete-order-item-service';
import { DrizzleOrderItemsRepository } from '@/infra/db/repositories/drizzle-order-items-repository';
import { userAuthMiddleware } from '../middlewares/user-auth-middleware';

export const deleteOrderItemRoute: FastifyPluginAsyncZod = async (app) => {
  app.post(
    '/api/order-items/delete/:orderItemId',
    {
      onRequest: userAuthMiddleware,
      schema: {
        summary: 'Delete order item',
        operationId: 'deleteOrderItem',
        tags: ['Order Items'],
        params: z.object({
          orderItemId: z.string().min(1),
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
      const orderItemsRepository = new DrizzleOrderItemsRepository();
      const deleteOrderItemService = new DeleteOrderItemService(
        orderItemsRepository
      );

      try {
        const { orderItemId } = request.params;

        const result = await deleteOrderItemService.execute({
          orderItemId,
        });

        if (result.isError()) {
          const error = result.value;

          if (error instanceof OrderItemNotFoundError) {
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
