import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';

import { UnexpectedError } from '@/core/errors/unexpected-error';
import { ProductSizeNotFoundError } from '@/domain/products/application/errors/product-size-not-found-error';
import { DeleteProductSizeService } from '@/domain/products/application/services/delete-product-size-service';
import { DrizzleProductSizesRepository } from '@/infra/db/repositories/drizzle-product-sizes-repository';
import { userAuthMiddleware } from '../middlewares/user-auth-middleware';

export const deleteProductSizeRoute: FastifyPluginAsyncZod = async (app) => {
  app.post(
    '/api/product-sizes/delete/:productSizeId',
    {
      onRequest: userAuthMiddleware,
      schema: {
        summary: 'Delete product size',
        operationId: 'deleteProductSize',
        tags: ['Product Sizes'],
        params: z.object({
          productSizeId: z.string().min(1),
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
      const productSizesRepository = new DrizzleProductSizesRepository();
      const deleteProductSizeService = new DeleteProductSizeService(
        productSizesRepository
      );

      try {
        const { productSizeId } = request.params;

        const result = await deleteProductSizeService.execute({
          productSizeId,
        });

        if (result.isError()) {
          const error = result.value;

          if (error instanceof ProductSizeNotFoundError) {
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
