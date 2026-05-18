import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';

import { UnexpectedError } from '@/core/errors/unexpected-error';
import { CategoryNotFoundError } from '@/domain/products/application/errors/category-not-found-error';
import { CategorySlugAlreadyExistsError } from '@/domain/products/application/errors/category-slug-already-exists-error';
import { UpdateCategoryService } from '@/domain/products/application/services/update-category-service';
import { DrizzleCategoriesRepository } from '@/infra/db/repositories/drizzle-categories-repository';
import { CategoryPresenter } from '@/infra/presenters/category-presenter';
import { userGuard } from '../server';

export const updateCategoryRoute: FastifyPluginAsyncZod = async (app) => {
  app.patch(
    '/api/categories/:categoryId',
    {
      onRequest: userGuard,
      schema: {
        summary: 'Update category',
        operationId: 'updateCategory',
        tags: ['Categories'],
        params: z.object({
          categoryId: z.string().min(1),
        }),
        body: z.object({
          name: z.string().min(1).optional(),
          slug: z.string().min(1).optional(),
          description: z.string().nullable().optional(),
          imageUrl: z.string().nullable().optional(),
          isActive: z.boolean().optional(),
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
          409: z.object({ message: z.string() }),
          500: z.object({ message: z.string() }),
        },
      },
    },
    async (request, reply) => {
      const categoriesRepository = new DrizzleCategoriesRepository();
      const updateCategoryService = new UpdateCategoryService(
        categoriesRepository
      );

      try {
        const { categoryId } = request.params;
        const { name, slug, description, imageUrl, isActive } = request.body;

        const result = await updateCategoryService.execute({
          categoryId,
          name,
          slug,
          description,
          imageUrl,
          isActive,
        });

        if (result.isError()) {
          const error = result.value;

          if (error instanceof CategoryNotFoundError) {
            return reply.status(404).send({ message: error.message });
          }

          if (error instanceof CategorySlugAlreadyExistsError) {
            return reply.status(409).send({ message: error.message });
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
