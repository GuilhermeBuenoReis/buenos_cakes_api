import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';

import { UnexpectedError } from '@/core/errors/unexpected-error';
import { ProductNotFoundError } from '@/domain/products/application/errors/product-not-found-error';
import { DeleteProductService } from '@/domain/products/application/services/delete-product-service';
import { DrizzleProductsRepository } from '@/infra/db/repositories/drizzle-products-repository';
import { userGuard } from '../server';

export const deleteProductRoute: FastifyPluginAsyncZod = async (app) => {
  app.post(
    '/api/products/delete/:productId',
    {
      onRequest: userGuard,
      schema: {
        summary: 'Delete a product',
        operationId: 'deleteProduct',
        tags: ['Products'],
        params: z.object({
          productId: z.string().min(1),
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
      const productsRepository = new DrizzleProductsRepository();
      const deleteProductService = new DeleteProductService(productsRepository);

      try {
        const { productId } = request.params;

        const result = await deleteProductService.execute({
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

        return {};
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({ message: 'Internal server error' });
      }
    }
  );
};
