import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';

import { userAuthMiddleware } from '../middlewares/user-auth-middleware';
import {
  handleOrderItemsChange,
  orderItemsChangeErrorResponses,
  orderItemsChangeResponseSchema,
} from './handle-order-items-change';

export const removeOrderItemRoute: FastifyPluginAsyncZod = async (app) => {
  app.delete(
    '/api/orders/:orderId/items/:orderItemId',
    {
      onRequest: userAuthMiddleware,
      schema: {
        summary: 'Remove an item from an existing order',
        operationId: 'removeOrderItem',
        tags: ['Orders'],
        params: z.object({
          orderId: z.string().min(1),
          orderItemId: z.string().min(1),
        }),
        body: z
          .object({
            successUrl: z.url().optional(),
            cancelUrl: z.url().optional(),
            customerEmail: z.email().nullable().optional(),
          })
          .optional(),
        response: {
          200: orderItemsChangeResponseSchema,
          ...orderItemsChangeErrorResponses,
        },
      },
    },
    async (request, reply) => {
      const { orderId, orderItemId } = request.params;
      const body = request.body ?? {};

      return handleOrderItemsChange(request, reply, {
        orderId,
        operation: {
          action: 'remove',
          orderItemId,
        },
        successUrl: body.successUrl,
        cancelUrl: body.cancelUrl,
        customerEmail: body.customerEmail,
        successStatusCode: 200,
      });
    }
  );
};
