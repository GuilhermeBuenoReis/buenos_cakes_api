import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';

import { UnexpectedError } from '@/core/errors/unexpected-error';
import { OrderItemNotFoundError } from '@/domain/orders/application/errors/order-item-not-found-error';
import { FetchOrderItemByIdService } from '@/domain/orders/application/services/fetch-order-item-by-id-service';
import { DrizzleOrderItemsRepository } from '@/infra/db/repositories/drizzle-order-items-repository';
import { OrderItemPresenter } from '@/infra/presenters/order-item-presenter';
import { userAuthMiddleware } from '../middlewares/user-auth-middleware';

export const fetchOrderItemByIdRoute: FastifyPluginAsyncZod = async (app) => {
  app.get(
    '/api/order-items/:orderItemId',
    {
      onRequest: userAuthMiddleware,
      schema: {
        summary: 'Fetch order item by id',
        operationId: 'fetchOrderItemById',
        tags: ['Order Items'],
        params: z.object({
          orderItemId: z.string().min(1),
        }),
        response: {
          200: z.object({
            orderItem: z.object({
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
            }),
          }),
          400: z.object({ message: z.string() }),
          404: z.object({ message: z.string() }),
          500: z.object({ message: z.string() }),
        },
      },
    },
    async (request, reply) => {
      const orderItemsRepository = new DrizzleOrderItemsRepository();
      const fetchOrderItemByIdService = new FetchOrderItemByIdService(
        orderItemsRepository
      );

      try {
        const { orderItemId } = request.params;

        const result = await fetchOrderItemByIdService.execute({
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

        const { orderItem } = result.value;

        return reply.status(200).send({
          orderItem: OrderItemPresenter.toHTTP(orderItem),
        });
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({ message: 'Internal server error' });
      }
    }
  );
};
