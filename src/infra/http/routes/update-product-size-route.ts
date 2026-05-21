import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';

import { UnexpectedError } from '@/core/errors/unexpected-error';
import { ProductSizeCodeAlreadyExistsError } from '@/domain/products/application/errors/product-size-code-already-exists-error';
import { ProductSizeNotFoundError } from '@/domain/products/application/errors/product-size-not-found-error';
import { UpdateProductSizeService } from '@/domain/products/application/services/update-product-size-service';
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

export const updateProductSizeRoute: FastifyPluginAsyncZod = async (app) => {
  app.patch(
    '/api/product-sizes/:productSizeId',
    {
      onRequest: userAuthMiddleware,
      schema: {
        summary: 'Update product size',
        operationId: 'updateProductSize',
        tags: ['Product Sizes'],
        params: z.object({
          productSizeId: z.string().min(1),
        }),
        body: z.object({
          code: z.string().min(1).optional(),
          label: z.string().min(1).optional(),
          servingsLabel: z.string().nullable().optional(),
          priceDelta: z.number().optional(),
          isDefault: z.boolean().optional(),
          sortOrder: z.number().int().optional(),
          isActive: z.boolean().optional(),
        }),
        response: {
          200: z.object({
            productSize: productSizeResponseSchema,
          }),
          400: z.object({ message: z.string() }),
          404: z.object({ message: z.string() }),
          409: z.object({ message: z.string() }),
          500: z.object({ message: z.string() }),
        },
      },
    },
    async (request, reply) => {
      const productSizesRepository = new DrizzleProductSizesRepository();
      const updateProductSizeService = new UpdateProductSizeService(
        productSizesRepository
      );

      try {
        const { productSizeId } = request.params;
        const {
          code,
          label,
          servingsLabel,
          priceDelta,
          isDefault,
          sortOrder,
          isActive,
        } = request.body;

        const result = await updateProductSizeService.execute({
          productSizeId,
          code,
          label,
          servingsLabel,
          priceDelta,
          isDefault,
          sortOrder,
          isActive,
        });

        if (result.isError()) {
          const error = result.value;

          if (error instanceof ProductSizeNotFoundError) {
            return reply.status(404).send({ message: error.message });
          }

          if (error instanceof ProductSizeCodeAlreadyExistsError) {
            return reply.status(409).send({ message: error.message });
          }

          if (error instanceof UnexpectedError) {
            return reply.status(500).send({ message: error.message });
          }

          return reply.status(400).send({ message: 'Bad request' });
        }

        const { productSize } = result.value;

        return reply.status(200).send({
          productSize: ProductSizePresenter.toHTTP(productSize),
        });
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({ message: 'Internal server error' });
      }
    }
  );
};
