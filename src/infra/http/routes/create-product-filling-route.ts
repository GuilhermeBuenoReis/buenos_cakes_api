import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';

import { UnexpectedError } from '@/core/errors/unexpected-error';
import { ProductFillingLabelAlreadyExistsError } from '@/domain/products/application/errors/product-filling-label-already-exists-error';
import { ProductNotFoundError } from '@/domain/products/application/errors/product-not-found-error';
import { CreateProductsFillingService } from '@/domain/products/application/services/create-products-filling-service';
import { DrizzleProductFillingsRepository } from '@/infra/db/repositories/drizzle-product-fillings-repository';
import { DrizzleProductsRepository } from '@/infra/db/repositories/drizzle-products-repository';
import { ProductFillingPresenter } from '@/infra/presenters/product-filling-presenter';
import { userAuthMiddleware } from '../middlewares/user-auth-middleware';

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

export const createProductFillingRoute: FastifyPluginAsyncZod = async (app) => {
  app.post(
    '/api/product-fillings/create',
    {
      onRequest: userAuthMiddleware,
      schema: {
        summary: 'Create a product filling',
        operationId: 'createProductFilling',
        tags: ['Product Fillings'],
        body: z.object({
          productId: z.string().min(1),
          label: z.string().min(1),
          priceDelta: z.number(),
          isDefault: z.boolean().optional(),
          sortOrder: z.number().int().optional(),
          isActive: z.boolean().optional(),
        }),
        response: {
          201: z.object({
            productFilling: productFillingResponseSchema,
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
      const productFillingsRepository = new DrizzleProductFillingsRepository();
      const createProductsFillingService = new CreateProductsFillingService(
        productsRepository,
        productFillingsRepository
      );

      try {
        const { productId, label, priceDelta, isDefault, sortOrder, isActive } =
          request.body;

        const result = await createProductsFillingService.execute({
          productId,
          label,
          priceDelta,
          isDefault,
          sortOrder,
          isActive,
        });

        if (result.isError()) {
          const error = result.value;

          if (error instanceof ProductNotFoundError) {
            return reply.status(404).send({ message: error.message });
          }

          if (error instanceof ProductFillingLabelAlreadyExistsError) {
            return reply.status(409).send({ message: error.message });
          }

          if (error instanceof UnexpectedError) {
            return reply.status(500).send({ message: error.message });
          }

          return reply.status(400).send({ message: 'Bad request' });
        }

        const { productFilling } = result.value;

        return reply.status(201).send({
          productFilling: ProductFillingPresenter.toHTTP(productFilling),
        });
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({ message: 'Internal server error' });
      }
    }
  );
};
