import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';

import { UnexpectedError } from '@/core/errors/unexpected-error';
import { AddressNotFoundError } from '@/domain/users/application/errors/address-not-found-error';
import { UpdateAddressService } from '@/domain/users/application/services/update-address-service';
import { DrizzleAddressesRepository } from '@/infra/db/repositories/drizzle-address-repositorie';
import { AddressPresenter } from '@/infra/presenters/address-presenter';

export const updateAddressRoute: FastifyPluginAsyncZod = async (app) => {
  app.patch(
    '/api/addresses/:addressId',
    {
      schema: {
        summary: 'Update address',
        operationId: 'updateAddress',
        tags: ['Addresses'],
        params: z.object({
          addressId: z.string().min(1),
        }),
        body: z.object({
          label: z.string().min(1).optional(),
          recipientName: z.string().min(1).optional(),
          street: z.string().min(1).optional(),
          houseNumber: z.string().min(1).optional(),
          complement: z.string().nullable().optional(),
          city: z.string().min(1).optional(),
          state: z.string().min(1).optional(),
          zipCode: z.string().min(1).optional(),
          reference: z.string().nullable().optional(),
          isDefault: z.boolean().optional(),
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
      const updateAddressService = new UpdateAddressService(
        addressesRepository
      );

      try {
        const { addressId } = request.params;
        const {
          label,
          recipientName,
          street,
          houseNumber,
          complement,
          city,
          state,
          zipCode,
          reference,
          isDefault,
        } = request.body;

        const result = await updateAddressService.execute({
          addressId,
          label,
          recipientName,
          street,
          houseNumber,
          complement,
          city,
          state,
          zipCode,
          reference,
          isDefault,
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

        return reply.status(500).send({
          message: 'Internal server error',
        });
      }
    }
  );
};
