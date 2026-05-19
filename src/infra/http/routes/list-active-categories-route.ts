import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';

import { UnexpectedError } from '@/core/errors/unexpected-error';
import { ListActiveCategoriesService } from '@/domain/products/application/services/list-active-categories-service';
import { DrizzleCategoriesRepository } from '@/infra/db/repositories/drizzle-categories-repository';
import { CategoryPresenter } from '@/infra/presenters/category-presenter';
import { userAuthMiddleware } from '../middlewares/user-auth-middleware';

export const listActiveCategoriesRoute: FastifyPluginAsyncZod = async (app) => {
  app.get(
    '/api/categories/active',
    {
      onRequest: userAuthMiddleware,
      schema: {
        summary: 'List active categories',
        operationId: 'listActiveCategories',
        tags: ['Categories'],
        querystring: z.object({
          page: z.coerce.number().int().positive().default(1),
        }),
        response: {
          200: z.object({
            categories: z.array(
              z.object({
                id: z.string(),
                name: z.string(),
                slug: z.string(),
                description: z.string().nullable().optional(),
                imageUrl: z.string().nullable().optional(),
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
      const categoriesRepository = new DrizzleCategoriesRepository();
      const listActiveCategoriesService = new ListActiveCategoriesService(
        categoriesRepository
      );

      try {
        const { page } = request.query;

        const result = await listActiveCategoriesService.execute({
          page,
        });

        if (result.isError()) {
          const error = result.value;

          if (error instanceof UnexpectedError) {
            return reply.status(500).send({ message: error.message });
          }

          return reply.status(400).send({ message: 'Bad request' });
        }

        const { categories } = result.value;

        return reply.status(200).send({
          categories: categories.map(CategoryPresenter.toHTTP),
        });
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({ message: 'Internal server error' });
      }
    }
  );
};
