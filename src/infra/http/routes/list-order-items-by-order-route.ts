import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';

import { UnexpectedError } from '@/core/errors/unexpected-error';
import { ListOrderItemsByOrderService } from '@/domain/orders/application/services/list-order-items-by-order-service';
import { DrizzleOrderItemsRepository } from '@/infra/db/repositories/drizzle-order-items-repository';
import { OrderItemPresenter } from '@/infra/presenters/order-item-presenter';
import { userAuthMiddleware } from '../middlewares/user-auth-middleware';

export const listOrderItemsByOrderRoute: FastifyPluginAsyncZod = async (
  app
) => {
  app.get(
    '/api/orders/:orderId/items',
    {
      onRequest: userAuthMiddleware,
      schema: {
        summary: 'List order items by order',
        operationId: 'listOrderItemsByOrder',
        tags: ['Order Items'],
        params: z.object({
          orderId: z.string().min(1),
        }),
        response: {
          200: z.object({
            orderItems: z.array(
              z.object({
                id: z.string(),
                orderId: z.string(),
                productId: z.string(),
                productSizeId: z.string().nullable().optional(),
                productFillingId: z.string().nullable().optional(),
                quantity: z.number().int(),
                unitPrice: z.number(),
                total: z.number(),
                note: z.string().nullable().optional(),
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
      const orderItemsRepository = new DrizzleOrderItemsRepository();
      const listOrderItemsByOrderService = new ListOrderItemsByOrderService(
        orderItemsRepository
      );

      try {
        const { orderId } = request.params;

        const result = await listOrderItemsByOrderService.execute({
          orderId,
        });

        if (result.isError()) {
          const error = result.value;

          if (error instanceof UnexpectedError) {
            return reply.status(500).send({ message: error.message });
          }

          return reply.status(400).send({ message: 'Bad request' });
        }

        const { orderItems } = result.value;

        return reply.status(200).send({
          orderItems: orderItems.map(OrderItemPresenter.toHTTP),
        });
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({ message: 'Internal server error' });
      }
    }
  );
};
