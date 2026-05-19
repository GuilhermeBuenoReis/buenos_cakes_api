import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';

import { UnexpectedError } from '@/core/errors/unexpected-error';
import { AddressNotFoundError } from '@/domain/users/application/errors/address-not-found-error';
import { DeleteAddressService } from '@/domain/users/application/services/delete-address-service';
import { DrizzleAddressesRepository } from '@/infra/db/repositories/drizzle-address-repositorie';
import { userAuthMiddleware } from '../middlewares/user-auth-middleware';

export const deleteAddressRoute: FastifyPluginAsyncZod = async (app) => {
  app.post(
    '/api/addresses/delete/:addressId',
    {
      onRequest: userAuthMiddleware,
      schema: {
        summary: 'Delete an address',
        operationId: 'deleteAddress',
        tags: ['Addresses'],
        params: z.object({
          addressId: z.string().min(1),
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
      const addressesRepository = new DrizzleAddressesRepository();

      const deleteAddressService = new DeleteAddressService(
        addressesRepository
      );

      try {
        const { addressId } = request.params;

        const result = await deleteAddressService.execute({
          addressId,
        });

        if (result.isError()) {
          const error = result.value;

          if (error instanceof AddressNotFoundError) {
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
