import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';

import { UnexpectedError } from '@/core/errors/unexpected-error';
import { ProductNotFoundError } from '@/domain/products/application/errors/product-not-found-error';
import { ProductSizeCodeAlreadyExistsError } from '@/domain/products/application/errors/product-size-code-already-exists-error';
import { CreateProductSizeService } from '@/domain/products/application/services/create-product-size-service';
import { DrizzleProductSizesRepository } from '@/infra/db/repositories/drizzle-product-sizes-repository';
import { DrizzleProductsRepository } from '@/infra/db/repositories/drizzle-products-repository';
import { ProductSizePresenter } from '@/infra/presenters/product-size-presenter';
import { userGuard } from '../server';

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

export const createProductSizeRoute: FastifyPluginAsyncZod = async (app) => {
  app.post(
    '/api/product-sizes/create',
    {
      onRequest: userGuard,
      schema: {
        summary: 'Create a product size',
        operationId: 'createProductSize',
        tags: ['Product Sizes'],
        body: z.object({
          productId: z.string().min(1),
          code: z.string().min(1),
          label: z.string().min(1),
          servingsLabel: z.string().nullable().optional(),
          priceDelta: z.number(),
          isDefault: z.boolean().optional(),
          sortOrder: z.number().int().optional(),
          isActive: z.boolean().optional(),
        }),
        response: {
          201: z.object({
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
      const productsRepository = new DrizzleProductsRepository();
      const productSizesRepository = new DrizzleProductSizesRepository();
      const createProductSizeService = new CreateProductSizeService(
        productsRepository,
        productSizesRepository
      );

      try {
        const {
          productId,
          code,
          label,
          servingsLabel,
          priceDelta,
          isDefault,
          sortOrder,
          isActive,
        } = request.body;

        const result = await createProductSizeService.execute({
          productId,
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

          if (error instanceof ProductNotFoundError) {
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

        return reply.status(201).send({
          productSize: ProductSizePresenter.toHTTP(productSize),
        });
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({ message: 'Internal server error' });
      }
    }
  );
};
