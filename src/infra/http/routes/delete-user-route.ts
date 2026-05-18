import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { UnexpectedError } from '@/core/errors/unexpected-error';
import { UserNotFoundError } from '@/domain/users/application/errors/user-not-found-error';
import { DeleteUserService } from '@/domain/users/application/services/delete-user-service';
import { DrizzleUsersRepository } from '@/infra/db/repositories/drizzle-users-repository';
import { userGuard } from '../server';

export const deleteUserRoute: FastifyPluginAsyncZod = async (app) => {
  app.post(
    '/api/users/delete/:userId',
    {
      onRequest: userGuard,
      schema: {
        summary: 'Delete a user',
        operationId: 'deleteUser',
        tags: ['Users'],
        params: z.object({
          userId: z.string().min(1),
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
      const usersRepository = new DrizzleUsersRepository();

      const deleteUserService = new DeleteUserService(usersRepository);
      try {
        const { userId } = request.params;

        const result = await deleteUserService.execute({
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

        return {};
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({ message: 'Internal server error' });
      }
    }
  );
};
