import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';

import { UnexpectedError } from '@/core/errors/unexpected-error';
import { CategoryNotFoundError } from '@/domain/products/application/errors/category-not-found-error';
import { ProductNotFoundError } from '@/domain/products/application/errors/product-not-found-error';
import { ProductSlugAlreadyExistsError } from '@/domain/products/application/errors/product-slug-already-exists-error';
import { UpdateProductService } from '@/domain/products/application/services/update-product-service';
import { DrizzleCategoriesRepository } from '@/infra/db/repositories/drizzle-categories-repository';
import { DrizzleProductsRepository } from '@/infra/db/repositories/drizzle-products-repository';
import { ProductPresenter } from '@/infra/presenters/product-presenter';
import { userAuthMiddleware } from '../middlewares/user-auth-middleware';

export const updateProductRoute: FastifyPluginAsyncZod = async (app) => {
  app.patch(
    '/api/products/:productId',
    {
      onRequest: userAuthMiddleware,
      schema: {
        summary: 'Update product',
        operationId: 'updateProduct',
        tags: ['Products'],
        params: z.object({
          productId: z.string().min(1),
        }),
        body: z.object({
          categoryId: z.string().min(1).optional(),
          name: z.string().min(1).optional(),
          slug: z.string().min(1).optional(),
          description: z.string().nullable().optional(),
          basePrice: z.number().optional(),
          coverImageUrl: z.string().nullable().optional(),
          isActive: z.boolean().optional(),
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
          409: z.object({ message: z.string() }),
          500: z.object({ message: z.string() }),
        },
      },
    },
    async (request, reply) => {
      const productsRepository = new DrizzleProductsRepository();
      const categoriesRepository = new DrizzleCategoriesRepository();

      const updateProductService = new UpdateProductService(
        productsRepository,
        categoriesRepository
      );

      try {
        const { productId } = request.params;
        const {
          categoryId,
          name,
          slug,
          description,
          basePrice,
          coverImageUrl,
          isActive,
        } = request.body;

        const result = await updateProductService.execute({
          productId,
          categoryId,
          name,
          slug,
          description,
          basePrice,
          coverImageUrl,
          isActive,
        });

        if (result.isError()) {
          const error = result.value;

          if (
            error instanceof ProductNotFoundError ||
            error instanceof CategoryNotFoundError
          ) {
            return reply.status(404).send({ message: error.message });
          }

          if (error instanceof ProductSlugAlreadyExistsError) {
            return reply.status(409).send({ message: error.message });
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
