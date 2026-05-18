import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';

import { UnexpectedError } from '@/core/errors/unexpected-error';
import { AddressNotFoundError } from '@/domain/users/application/errors/address-not-found-error';
import { SetDefaultAddressService } from '@/domain/users/application/services/set-default-address-service';
import { DrizzleAddressesRepository } from '@/infra/db/repositories/drizzle-address-repositorie';
import { AddressPresenter } from '@/infra/presenters/address-presenter';
import { userGuard } from '../server';

export const setDefaultAddressRoute: FastifyPluginAsyncZod = async (app) => {
  app.post(
    '/api/addresses/:addressId/default',
    {
      onRequest: userGuard,
      schema: {
        summary: 'Set default address',
        operationId: 'setDefaultAddress',
        tags: ['Addresses'],
        params: z.object({
          addressId: z.string().min(1),
        }),
        response: {
          200: z.object({
            address: z.object({
              id: z.string(),
              userId: z.string(),
              label: z.string(),
              recipientName: z.string(),
              street: z.string(),
              houseNumber: z.string(),
              complement: z.string().nullable().optional(),
              city: z.string(),
              state: z.string(),
              zipCode: z.string(),
              reference: z.string().nullable().optional(),
              isDefault: z.boolean(),
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
      const addressesRepository = new DrizzleAddressesRepository();
      const setDefaultAddressService = new SetDefaultAddressService(
        addressesRepository
      );

      try {
        const { addressId } = request.params;

        const result = await setDefaultAddressService.execute({
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

        const { address } = result.value;

        return reply.status(200).send({
          address: AddressPresenter.toHTTP(address),
        });
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({ message: 'Internal server error' });
      }
    }
  );
};
