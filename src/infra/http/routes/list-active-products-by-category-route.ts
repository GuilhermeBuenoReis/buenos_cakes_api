import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';

import { UnexpectedError } from '@/core/errors/unexpected-error';
import { ListActiveProductsByCategoryService } from '@/domain/products/application/services/list-active-products-by-category-service';
import { DrizzleProductsRepository } from '@/infra/db/repositories/drizzle-products-repository';
import { ProductPresenter } from '@/infra/presenters/product-presenter';
import { userAuthMiddleware } from '../middlewares/user-auth-middleware';

export const listActiveProductsByCategoryRoute: FastifyPluginAsyncZod = async (
  app
) => {
  app.get(
    '/api/categories/:categoryId/products/active',
    {
      onRequest: userAuthMiddleware,
      schema: {
        summary: 'List active products by category',
        operationId: 'listActiveProductsByCategory',
        tags: ['Products'],
        params: z.object({
          categoryId: z.string().min(1),
        }),
        querystring: z.object({
          page: z.coerce.number().int().positive().default(1),
        }),
        response: {
          200: z.object({
            products: z.array(
              z.object({
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
              })
            ),
          }),
          400: z.object({ message: z.string() }),
          500: z.object({ message: z.string() }),
        },
      },
    },
    async (request, reply) => {
      const productsRepository = new DrizzleProductsRepository();
      const listActiveProductsByCategoryService =
        new ListActiveProductsByCategoryService(productsRepository);

      try {
        const { categoryId } = request.params;
        const { page } = request.query;

        const result = await listActiveProductsByCategoryService.execute({
          categoryId,
          page,
        });

        if (result.isError()) {
          const error = result.value;

          if (error instanceof UnexpectedError) {
            return reply.status(500).send({ message: error.message });
          }

          return reply.status(400).send({ message: 'Bad request' });
        }

        const { products } = result.value;

        return reply.status(200).send({
          products: products.map(ProductPresenter.toHTTP),
        });
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({ message: 'Internal server error' });
      }
    }
  );
};
