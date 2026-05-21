import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';

import { UnexpectedError } from '@/core/errors/unexpected-error';
import { UserAlreadyExistsError } from '@/domain/users/application/errors/user-already-exists-error';
import { UserNotFoundError } from '@/domain/users/application/errors/user-not-found-error';
import { UpdateUserService } from '@/domain/users/application/services/update-user-service';
import { DrizzleUsersRepository } from '@/infra/db/repositories/drizzle-users-repository';
import { UserPresenter } from '@/infra/presenters/user-presenter';
import { userAuthMiddleware } from '../middlewares/user-auth-middleware';

export const updateUserRoute: FastifyPluginAsyncZod = async (app) => {
  app.patch(
    '/api/users/:userId',
    {
      onRequest: userAuthMiddleware,
      schema: {
        summary: 'Update user',
        operationId: 'updateUser',
        tags: ['Users'],
        params: z.object({
          userId: z.string().min(1),
        }),
        body: z.object({
          name: z.string().min(1).optional(),
          email: z.email().optional(),
          cpf: z.string().nullable().optional(),
          phone: z.string().nullable().optional(),
        }),
        response: {
          200: z.object({
            user: z.object({
              id: z.string(),
              name: z.string(),
              email: z.email(),
              cpf: z.string().nullable().optional(),
              phone: z.string().nullable().optional(),
              role: z.enum(['customer', 'admin']),
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
      const usersRepository = new DrizzleUsersRepository();
      const updateUserService = new UpdateUserService(usersRepository);

      try {
        const { userId } = request.params;
        const { name, email, cpf, phone } = request.body;

        const result = await updateUserService.execute({
          userId,
          name,
          email,
          cpf,
          phone,
        });

        if (result.isError()) {
          const error = result.value;

          if (error instanceof UserNotFoundError) {
            return reply.status(404).send({ message: error.message });
          }

          if (error instanceof UserAlreadyExistsError) {
            return reply.status(409).send({ message: error.message });
          }

          if (error instanceof UnexpectedError) {
            return reply.status(500).send({ message: error.message });
          }

          return reply.status(400).send({ message: 'Bad request' });
        }

        const { user } = result.value;

        return reply.status(200).send({
          user: UserPresenter.toHTTP(user),
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
