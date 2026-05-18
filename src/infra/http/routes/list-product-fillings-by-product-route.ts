import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';

import { UnexpectedError } from '@/core/errors/unexpected-error';
import { ListProductsFillingsByProductService } from '@/domain/products/application/services/list-products-fillings-by-product-service';
import { DrizzleProductFillingsRepository } from '@/infra/db/repositories/drizzle-product-fillings-repository';
import { ProductFillingPresenter } from '@/infra/presenters/product-filling-presenter';
import { userGuard } from '../server';

const productFillingResponseSchema = z.object({
  id: z.string(),
  productId: z.string(),
  label: z.string(),
  priceDelta: z.number(),
  isDefault: z.boolean(),
  sortOrder: z.number(),
  isActive: z.boolean(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime().nullable().optional(),
});

export const listProductFillingsByProductRoute: FastifyPluginAsyncZod = async (
  app
) => {
  app.get(
    '/api/products/:productId/fillings',
    {
      onRequest: userGuard,
      schema: {
        summary: 'List product fillings by product',
        operationId: 'listProductFillingsByProduct',
        tags: ['Product Fillings'],
        params: z.object({
          productId: z.string().min(1),
        }),
        response: {
          200: z.object({
            productFillings: z.array(productFillingResponseSchema),
          }),
          400: z.object({ message: z.string() }),
          500: z.object({ message: z.string() }),
        },
      },
    },
    async (request, reply) => {
      const productFillingsRepository = new DrizzleProductFillingsRepository();
      const listProductsFillingsByProductService =
        new ListProductsFillingsByProductService(productFillingsRepository);

      try {
        const { productId } = request.params;

        const result = await listProductsFillingsByProductService.execute({
          productId,
        });

        if (result.isError()) {
          const error = result.value;

          if (error instanceof UnexpectedError) {
            return reply.status(500).send({ message: error.message });
          }

          return reply.status(400).send({ message: 'Bad request' });
        }

        const { productFillings } = result.value;

        return reply.status(200).send({
          productFillings: productFillings.map(ProductFillingPresenter.toHTTP),
        });
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({ message: 'Internal server error' });
      }
    }
  );
};
