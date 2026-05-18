import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';

import { UnexpectedError } from '@/core/errors/unexpected-error';
import { ProductNotFoundError } from '@/domain/products/application/errors/product-not-found-error';
import { FetchProductByIdService } from '@/domain/products/application/services/fetch-product-by-id-service';
import { DrizzleProductsRepository } from '@/infra/db/repositories/drizzle-products-repository';
import { ProductPresenter } from '@/infra/presenters/product-presenter';
import { userGuard } from '../server';

export const fetchProductByIdRoute: FastifyPluginAsyncZod = async (app) => {
  app.get(
    '/api/products/:productId',
    {
      onRequest: userGuard,
      schema: {
        summary: 'Fetch product by id',
        operationId: 'fetchProductById',
        tags: ['Products'],
        params: z.object({
          productId: z.string().min(1),
        }),
        response: {
          200: z.object({
            product: z.object({
              id: z.string(),
              categoryId: z.string(),
              name: z.string(),
              slug: z.string(),
              description: z.string().nullable().optional(),
              basePrice: z.number(),
              coverImageUrl: z.string().nullable().optional(),
              ratingAvg: z.number(),
              reviewsCount: z.number(),
              popularityScore: z.number(),
              isActive: z.boolean(),
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
      const productsRepository = new DrizzleProductsRepository();
      const fetchProductByIdService = new FetchProductByIdService(
        productsRepository
      );

      try {
        const { productId } = request.params;

        const result = await fetchProductByIdService.execute({
          productId,
        });

        if (result.isError()) {
          const error = result.value;

          if (error instanceof ProductNotFoundError) {
            return reply.status(404).send({ message: error.message });
          }

          if (error instanceof UnexpectedError) {
            return reply.status(500).send({ message: error.message });
          }

          return reply.status(400).send({ message: 'Bad request' });
        }

        const { product } = result.value;

        return reply.status(200).send({
          product: ProductPresenter.toHTTP(product),
        });
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({ message: 'Internal server error' });
      }
    }
  );
};
