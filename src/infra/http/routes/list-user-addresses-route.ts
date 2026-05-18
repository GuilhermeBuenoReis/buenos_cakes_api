import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';

import { UnexpectedError } from '@/core/errors/unexpected-error';
import { UserNotFoundError } from '@/domain/users/application/errors/user-not-found-error';
import { ListUserAddressesService } from '@/domain/users/application/services/list-user-addresses-service';
import { DrizzleAddressesRepository } from '@/infra/db/repositories/drizzle-address-repositorie';
import { DrizzleUsersRepository } from '@/infra/db/repositories/drizzle-users-repository';
import { AddressPresenter } from '@/infra/presenters/address-presenter';

export const listUserAddressesRoute: FastifyPluginAsyncZod = async (app) => {
  app.get(
    '/api/users/:userId/addresses',
    {
      schema: {
        summary: 'List user addresses',
        operationId: 'listUserAddresses',
        tags: ['Addresses'],
        params: z.object({
          userId: z.string().min(1),
        }),
        response: {
          200: z.object({
            addresses: z.array(
              z.object({
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
              })
            ),
          }),
          400: z.object({ message: z.string() }),
          404: z.object({ message: z.string() }),
          500: z.object({ message: z.string() }),
        },
      },
    },
    async (request, reply) => {
      const usersRepository = new DrizzleUsersRepository();
      const addressesRepository = new DrizzleAddressesRepository();

      const listUserAddressesService = new ListUserAddressesService(
        usersRepository,
        addressesRepository
      );

      try {
        const { userId } = request.params;

        const result = await listUserAddressesService.execute({
          userId,
        });

        if (result.isError()) {
          const error = result.value;

          if (error instanceof UserNotFoundError) {
            return reply.status(404).send({ message: error.message });
          }

          if (error instanceof UnexpectedError) {
            return reply.status(500).send({ message: error.message });
          }

          return reply.status(400).send({ message: 'Bad request' });
        }

        const { addresses } = result.value;

        return reply.status(200).send({
          addresses: addresses.map(AddressPresenter.toHTTP),
        });
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({ message: 'Internal server error' });
      }
    }
  );
};
