import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';

import { UnexpectedError } from '@/core/errors/unexpected-error';
import { ProductFillingLabelAlreadyExistsError } from '@/domain/products/application/errors/product-filling-label-already-exists-error';
import { ProductFillingNotFoundError } from '@/domain/products/application/errors/product-filling-not-found-error';
import { UpdateProductsFillingService } from '@/domain/products/application/services/update-products-filling-service';
import { DrizzleProductFillingsRepository } from '@/infra/db/repositories/drizzle-product-fillings-repository';
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

export const updateProductFillingRoute: FastifyPluginAsyncZod = async (app) => {
  app.patch(
    '/api/product-fillings/:productFillingId',
    {
      onRequest: userAuthMiddleware,
      schema: {
        summary: 'Update product filling',
        operationId: 'updateProductFilling',
        tags: ['Product Fillings'],
        params: z.object({
          productFillingId: z.string().min(1),
        }),
        body: z.object({
          label: z.string().min(1).optional(),
          priceDelta: z.number().optional(),
          isDefault: z.boolean().optional(),
          sortOrder: z.number().int().optional(),
          isActive: z.boolean().optional(),
        }),
        response: {
          200: z.object({
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
      const productFillingsRepository = new DrizzleProductFillingsRepository();
      const updateProductsFillingService = new UpdateProductsFillingService(
        productFillingsRepository
      );

      try {
        const { productFillingId } = request.params;
        const { label, priceDelta, isDefault, sortOrder, isActive } =
          request.body;

        const result = await updateProductsFillingService.execute({
          productFillingId,
          label,
          priceDelta,
          isDefault,
          sortOrder,
          isActive,
        });

        if (result.isError()) {
          const error = result.value;

          if (error instanceof ProductFillingNotFoundError) {
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

        return reply.status(200).send({
          productFilling: ProductFillingPresenter.toHTTP(productFilling),
        });
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({ message: 'Internal server error' });
      }
    }
  );
};
