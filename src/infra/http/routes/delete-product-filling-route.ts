import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';

import { UnexpectedError } from '@/core/errors/unexpected-error';
import { ProductFillingNotFoundError } from '@/domain/products/application/errors/product-filling-not-found-error';
import { DeleteProductsFillingService } from '@/domain/products/application/services/delete-products-filling-service';
import { DrizzleProductFillingsRepository } from '@/infra/db/repositories/drizzle-product-fillings-repository';
import { userAuthMiddleware } from '../middlewares/user-auth-middleware';

export const deleteProductFillingRoute: FastifyPluginAsyncZod = async (app) => {
  app.post(
    '/api/product-fillings/delete/:productFillingId',
    {
      onRequest: userAuthMiddleware,
      schema: {
        summary: 'Delete product filling',
        operationId: 'deleteProductFilling',
        tags: ['Product Fillings'],
        params: z.object({
          productFillingId: z.string().min(1),
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
      const productFillingsRepository = new DrizzleProductFillingsRepository();
      const deleteProductsFillingService = new DeleteProductsFillingService(
        productFillingsRepository
      );

      try {
        const { productFillingId } = request.params;

        const result = await deleteProductsFillingService.execute({
          productFillingId,
        });

        if (result.isError()) {
          const error = result.value;

          if (error instanceof ProductFillingNotFoundError) {
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
