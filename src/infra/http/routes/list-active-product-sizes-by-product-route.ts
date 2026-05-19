import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';

import { UnexpectedError } from '@/core/errors/unexpected-error';
import { ListActiveProductSizesByProductService } from '@/domain/products/application/services/list-active-product-sizes-by-product-service';
import { DrizzleProductSizesRepository } from '@/infra/db/repositories/drizzle-product-sizes-repository';
import { ProductSizePresenter } from '@/infra/presenters/product-size-presenter';
import { userAuthMiddleware } from '../middlewares/user-auth-middleware';

const productSizeResponseSchema = z.object({
  id: z.string(),
  productId: z.string(),
  code: z.string(),
  label: z.string(),
  servingsLabel: z.string().nullable().optional(),
  priceDelta: z.number(),
  isDefault: z.boolean(),
  sortOrder: z.number(),
  isActive: z.boolean(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime().nullable().optional(),
});

export const listActiveProductSizesByProductRoute: FastifyPluginAsyncZod =
  async (app) => {
    app.get(
      '/api/products/:productId/sizes/active',
      {
        onRequest: userAuthMiddleware,
        schema: {
          summary: 'List active product sizes by product',
          operationId: 'listActiveProductSizesByProduct',
          tags: ['Product Sizes'],
          params: z.object({
            productId: z.string().min(1),
          }),
          response: {
            200: z.object({
              productSizes: z.array(productSizeResponseSchema),
            }),
            400: z.object({ message: z.string() }),
            500: z.object({ message: z.string() }),
          },
        },
      },
      async (request, reply) => {
        const productSizesRepository = new DrizzleProductSizesRepository();
        const listActiveProductSizesByProductService =
          new ListActiveProductSizesByProductService(productSizesRepository);

        try {
          const { productId } = request.params;

          const result = await listActiveProductSizesByProductService.execute({
            productId,
          });

          if (result.isError()) {
            const error = result.value;

            if (error instanceof UnexpectedError) {
              return reply.status(500).send({ message: error.message });
            }

            return reply.status(400).send({ message: 'Bad request' });
          }

          const { productSizes } = result.value;

          return reply.status(200).send({
            productSizes: productSizes.map(ProductSizePresenter.toHTTP),
          });
        } catch (error) {
          request.log.error(error);
          return reply.status(500).send({ message: 'Internal server error' });
        }
      }
    );
  };
