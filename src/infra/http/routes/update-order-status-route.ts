import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';

import { UnexpectedError } from '@/core/errors/unexpected-error';
import { OrderNotFoundError } from '@/domain/orders/application/errors/order-not-found-error';
import { UpdateOrderStatusService } from '@/domain/orders/application/services/update-order-status-service';
import type { OrderStatus } from '@/domain/orders/enterprise/entities/order';
import { DrizzleOrdersRepository } from '@/infra/db/repositories/drizzle-orders-repository';
import { OrderPresenter } from '@/infra/presenters/order-presenter';
import { userAuthMiddleware } from '../middlewares/user-auth-middleware';

export const updateOrderStatusRoute: FastifyPluginAsyncZod = async (app) => {
  app.patch(
    '/api/orders/:orderId/status',
    {
      onRequest: userAuthMiddleware,
      schema: {
        summary: 'Update order status',
        operationId: 'updateOrderStatus',
        tags: ['Orders'],
        params: z.object({
          orderId: z.string().min(1),
        }),
        body: z.object({
          status: z.enum([
            'pending',
            'confirmed',
            'preparing',
            'ready',
            'completed',
            'canceled',
          ]),
        }),
        response: {
          200: z.object({
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
      const updateOrderStatusService = new UpdateOrderStatusService(
        ordersRepository
      );

      try {
        const { orderId } = request.params;
        const { status } = request.body;

        const result = await updateOrderStatusService.execute({
          orderId,
          status: status as OrderStatus,
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

        const { order } = result.value;

        return reply.status(200).send({
          order: OrderPresenter.toHTTP(order),
        });
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({ message: 'Internal server error' });
      }
    }
  );
};
