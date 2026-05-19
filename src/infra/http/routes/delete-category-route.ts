import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';

import { UnexpectedError } from '@/core/errors/unexpected-error';
import { CategoryNotFoundError } from '@/domain/products/application/errors/category-not-found-error';
import { DeleteCategoryService } from '@/domain/products/application/services/delete-category-service';
import { DrizzleCategoriesRepository } from '@/infra/db/repositories/drizzle-categories-repository';
import { userAuthMiddleware } from '../middlewares/user-auth-middleware';

export const deleteCategoryRoute: FastifyPluginAsyncZod = async (app) => {
  app.post(
    '/api/categories/delete/:categoryId',
    {
      onRequest: userAuthMiddleware,
      schema: {
        summary: 'Delete a category',
        operationId: 'deleteCategory',
        tags: ['Categories'],
        params: z.object({
          categoryId: z.string().min(1),
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
      const categoriesRepository = new DrizzleCategoriesRepository();
      const deleteCategoryService = new DeleteCategoryService(
        categoriesRepository
      );

      try {
        const { categoryId } = request.params;

        const result = await deleteCategoryService.execute({
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

        return {};
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({ message: 'Internal server error' });
      }
    }
  );
};
