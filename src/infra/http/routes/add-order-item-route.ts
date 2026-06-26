import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';

import { userAuthMiddleware } from '../middlewares/user-auth-middleware';
import {
  handleOrderItemsChange,
  orderItemsChangeErrorResponses,
  orderItemsChangeResponseSchema,
} from './handle-order-items-change';

export const addOrderItemRoute: FastifyPluginAsyncZod = async (app) => {
  app.post(
    '/api/orders/:orderId/items',
    {
      onRequest: userAuthMiddleware,
      schema: {
        summary: 'Add an item to an existing order',
        operationId: 'addOrderItem',
        tags: ['Orders'],
        params: z.object({
          orderId: z.string().min(1),
        }),
        body: z.object({
          productId: z.string().min(1),
          productSizeId: z.string().nullable().optional(),
          productFillingId: z.string().nullable().optional(),
          quantity: z.number().int().positive(),
          note: z.string().nullable().optional(),
          successUrl: z.url().optional(),
          cancelUrl: z.url().optional(),
          customerEmail: z.email().nullable().optional(),
        }),
        response: {
          201: orderItemsChangeResponseSchema,
          ...orderItemsChangeErrorResponses,
        },
      },
    },
    async (request, reply) => {
      const { orderId } = request.params;
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
          action: 'add',
          productId,
          productSizeId,
          productFillingId,
          quantity,
          note,
        },
        successUrl,
        cancelUrl,
        customerEmail,
        successStatusCode: 201,
      });
    }
  );
};
