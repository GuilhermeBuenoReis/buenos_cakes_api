import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';

import { UnexpectedError } from '@/core/errors/unexpected-error';
import { CategoryNotFoundError } from '@/domain/products/application/errors/category-not-found-error';
import { FetchCategoryByIdService } from '@/domain/products/application/services/fetch-category-by-id-service';
import { DrizzleCategoriesRepository } from '@/infra/db/repositories/drizzle-categories-repository';
import { CategoryPresenter } from '@/infra/presenters/category-presenter';
import { userGuard } from '../server';

export const fetchCategoryByIdRoute: FastifyPluginAsyncZod = async (app) => {
  app.get(
    '/api/categories/:categoryId',
    {
      onRequest: userGuard,
      schema: {
        summary: 'Fetch category by id',
        operationId: 'fetchCategoryById',
        tags: ['Categories'],
        params: z.object({
          categoryId: z.string().min(1),
        }),
        response: {
          200: z.object({
            category: z.object({
              id: z.string(),
              name: z.string(),
              slug: z.string(),
              description: z.string().nullable().optional(),
              imageUrl: z.string().nullable().optional(),
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
      const categoriesRepository = new DrizzleCategoriesRepository();
      const fetchCategoryByIdService = new FetchCategoryByIdService(
        categoriesRepository
      );

      try {
        const { categoryId } = request.params;

        const result = await fetchCategoryByIdService.execute({
          categoryId,
        });

        if (result.isError()) {
          const error = result.value;

          if (error instanceof CategoryNotFoundError) {
            return reply.status(404).send({ message: error.message });
          }

          if (error instanceof UnexpectedError) {
            return reply.status(500).send({ message: error.message });
          }

          return reply.status(400).send({ message: 'Bad request' });
        }

        const { category } = result.value;

        return reply.status(200).send({
          category: CategoryPresenter.toHTTP(category),
        });
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({ message: 'Internal server error' });
      }
    }
  );
};
