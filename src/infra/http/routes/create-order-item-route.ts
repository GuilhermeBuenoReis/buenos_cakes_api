import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';

import { UnexpectedError } from '@/core/errors/unexpected-error';
import { OrderNotFoundError } from '@/domain/orders/application/errors/order-not-found-error';
import { CreateOrderItemService } from '@/domain/orders/application/services/create-order-item-service';
import { ProductFillingNotFoundError } from '@/domain/products/application/errors/product-filling-not-found-error';
import { ProductNotFoundError } from '@/domain/products/application/errors/product-not-found-error';
import { ProductSizeNotFoundError } from '@/domain/products/application/errors/product-size-not-found-error';
import { DrizzleOrderItemsRepository } from '@/infra/db/repositories/drizzle-order-items-repository';
import { DrizzleOrdersRepository } from '@/infra/db/repositories/drizzle-orders-repository';
import { DrizzleProductFillingsRepository } from '@/infra/db/repositories/drizzle-product-fillings-repository';
import { DrizzleProductSizesRepository } from '@/infra/db/repositories/drizzle-product-sizes-repository';
import { DrizzleProductsRepository } from '@/infra/db/repositories/drizzle-products-repository';
import { OrderItemPresenter } from '@/infra/presenters/order-item-presenter';
import { userAuthMiddleware } from '../middlewares/user-auth-middleware';

export const createOrderItemRoute: FastifyPluginAsyncZod = async (app) => {
  app.post(
    '/api/order-items/create',
    {
      onRequest: userAuthMiddleware,
      schema: {
        summary: 'Create an order item',
        operationId: 'createOrderItem',
        tags: ['Order Items'],
        body: z.object({
          orderId: z.string().min(1),
          productId: z.string().min(1),
          productSizeId: z.string().nullable().optional(),
          productFillingId: z.string().nullable().optional(),
          quantity: z.number().int().positive(),
          unitPrice: z.number(),
          total: z.number(),
          note: z.string().nullable().optional(),
        }),
        response: {
          201: z.object({
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
      const ordersRepository = new DrizzleOrdersRepository();
      const productsRepository = new DrizzleProductsRepository();
      const productSizesRepository = new DrizzleProductSizesRepository();
      const productFillingsRepository = new DrizzleProductFillingsRepository();
      const createOrderItemService = new CreateOrderItemService(
        orderItemsRepository,
        ordersRepository,
        productsRepository,
        productSizesRepository,
        productFillingsRepository
      );

      try {
        const {
          orderId,
          productId,
          productSizeId,
          productFillingId,
          quantity,
          unitPrice,
          total,
          note,
        } = request.body;

        const result = await createOrderItemService.execute({
          orderId,
          productId,
          productSizeId,
          productFillingId,
          quantity,
          unitPrice,
          total,
          note,
        });

        if (result.isError()) {
          const error = result.value;

          if (
            error instanceof OrderNotFoundError ||
            error instanceof ProductNotFoundError ||
            error instanceof ProductSizeNotFoundError ||
            error instanceof ProductFillingNotFoundError
          ) {
            return reply.status(404).send({ message: error.message });
          }

          if (error instanceof UnexpectedError) {
            return reply.status(500).send({ message: error.message });
          }

          return reply.status(400).send({ message: 'Bad request' });
        }

        const { orderItem } = result.value;

        return reply.status(201).send({
          orderItem: OrderItemPresenter.toHTTP(orderItem),
        });
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({ message: 'Internal server error' });
      }
    }
  );
};
