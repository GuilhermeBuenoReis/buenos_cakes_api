import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';

import { userAuthMiddleware } from '../middlewares/user-auth-middleware';
import {
  handleOrderItemsChange,
  orderItemsChangeErrorResponses,
  orderItemsChangeResponseSchema,
} from './handle-order-items-change';

export const updateOrderItemOnOrderRoute: FastifyPluginAsyncZod = async (
  app
) => {
  app.patch(
    '/api/orders/:orderId/items/:orderItemId',
    {
      onRequest: userAuthMiddleware,
      schema: {
        summary: 'Change an item of an existing order',
        operationId: 'changeOrderItem',
        tags: ['Orders'],
        params: z.object({
          orderId: z.string().min(1),
          orderItemId: z.string().min(1),
        }),
        body: z.object({
          productId: z.string().min(1).optional(),
          productSizeId: z.string().nullable().optional(),
          productFillingId: z.string().nullable().optional(),
          quantity: z.number().int().positive().optional(),
          note: z.string().nullable().optional(),
          successUrl: z.url().optional(),
          cancelUrl: z.url().optional(),
          customerEmail: z.email().nullable().optional(),
        }),
        response: {
          200: orderItemsChangeResponseSchema,
          ...orderItemsChangeErrorResponses,
        },
      },
    },
    async (request, reply) => {
      const { orderId, orderItemId } = request.params;
      const {
        productId,
        productSizeId,
        productFillingId,
        quantity,
        note,
        successUrl,
        cancelUrl,
        customerEmail,
      } = request.body;

      return handleOrderItemsChange(request, reply, {
        orderId,
        operation: {
          action: 'edit',
          orderItemId,
          productId,
          productSizeId,
          productFillingId,
          quantity,
          note,
        },
        successUrl,
        cancelUrl,
        customerEmail,
        successStatusCode: 200,
      });
    }
  );
};
